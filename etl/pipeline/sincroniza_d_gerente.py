"""
Sincroniza d_gerente (origem bi_dommus -> destino dw_infratecnica.d_gerente).

Padrao: TRUNCATE + FULL LOAD com keyset pagination em SG.id
        (alias id_gerente no resultado).

Mitigacoes contra erro 2013 (Lost connection to MySQL server during query):
- use_pure=True no driver (sem C-extension que bufferava e abortava).
- SESSION timeouts longos + max_execution_time=0 via event listener no pool.
- net_read_timeout/net_write_timeout=7200 via SESSION (mysql-connector nao aceita no socket).
- InterfaceError incluso no retry (o 2013 sobe como InterfaceError).
- ler_pagina_adaptativa: se cair em 2013, reduz page_size pela metade e tenta de novo.
"""

# ============================================================
# Guard: garante execucao sob Python 3.12.
# Se o script foi lancado com `python` (resolvendo p/ outra versao
# como 3.14), re-executa o chamador (sys.argv[0]) sob `py -3.12`.
# ============================================================
import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    print(f"[guard] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os, sys, time

# Permite importar etl_utils.py do mesmo diretorio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text  # noqa: E402
from etl_utils import (  # noqa: E402
    destino_engine, origem_engine, retry, construir_sql_paginado, ler_pagina_adaptativa,
)
from config import caminho_sql  # noqa: E402

# ---------- conexoes ----------
origem_dommus = origem_engine()

destino_dwi = destino_engine()

# ---------- parametros ----------
TABELA_DESTINO = "d_gerente"
PK_QUALIFIED   = "SG.id"
PK_ALIAS       = "id_gerente"
CAMINHO_SQL    = caminho_sql("consulta_d_gerente")

# Janela ampla: truncate + full load carrega TUDO
DATA_INICIO = "1900-01-01 00:00:00"
DATA_FIM    = "2099-12-31 23:59:59"

PAGE_SIZE       = 1000
PAGE_SIZE_MIN   = 200
WRITE_CHUNKSIZE = 500


def gravar_pagina(df):
    with destino_dwi.begin() as conn:
        df.to_sql(
            TABELA_DESTINO, conn,
            if_exists="append", index=False,
            chunksize=WRITE_CHUNKSIZE, method="multi",
        )


def truncar_destino():
    with destino_dwi.begin() as conn:
        conn.execute(text("TRUNCATE TABLE " + TABELA_DESTINO))


def contar_destino():
    with destino_dwi.connect() as conn:
        r = conn.execute(text("SELECT COUNT(*) FROM " + TABELA_DESTINO)).scalar()
        return r or 0


def main():
    print("Carregando SQL para " + TABELA_DESTINO + "...")

    with open(CAMINHO_SQL, "r", encoding="utf-8") as f:
        sql_raw = f.read()

    sql_formatado = sql_raw.format(data_inicio=DATA_INICIO, data_fim=DATA_FIM)
    sql_paginado = construir_sql_paginado(sql_formatado, PK_QUALIFIED)

    t_ini = time.time()
    last_id = 0
    pagina = 0
    total_linhas = 0
    ps_corrente = PAGE_SIZE

    pagina += 1
    print("[info] Lendo pagina " + str(pagina) +
          " (last_id=" + str(last_id) + ", ps=" + str(ps_corrente) + ")...")
    df, ps_corrente = ler_pagina_adaptativa(
        origem_dommus, sql_paginado, last_id, ps_corrente,
        page_size_min=PAGE_SIZE_MIN,
        descricao="ler pagina " + str(pagina),
    )

    if df is None or df.empty:
        print("Origem vazia - ABORTANDO sem truncar o destino.")
        return

    if PK_ALIAS not in df.columns:
        raise RuntimeError(
            "Coluna " + repr(PK_ALIAS) +
            " nao esta no resultado. Colunas: " + str(list(df.columns))
        )

    retry("truncate destino", truncar_destino)
    print("[info] Destino " + TABELA_DESTINO + " truncado.")

    n = len(df)
    novo_last_id = int(df[PK_ALIAS].iloc[-1])
    retry("gravar pagina " + str(pagina), gravar_pagina, df)
    total_linhas += n
    print("[info] Pagina " + str(pagina) + ": " + str(n) +
          " linhas | last_id=" + str(novo_last_id) +
          " | acumulado=" + str(total_linhas) +
          " | ps_efetivo=" + str(ps_corrente))
    last_id = novo_last_id

    while n >= ps_corrente:
        pagina += 1
        t0 = time.time()
        df, ps_corrente = ler_pagina_adaptativa(
            origem_dommus, sql_paginado, last_id, ps_corrente,
            page_size_min=PAGE_SIZE_MIN,
            descricao="ler pagina " + str(pagina) + " (last_id=" + str(last_id) + ")",
        )
        if df is None or df.empty:
            print("[info] Pagina " + str(pagina) + ": 0 linhas - fim.")
            break
        n = len(df)
        novo_last_id = int(df[PK_ALIAS].iloc[-1])
        retry("gravar pagina " + str(pagina), gravar_pagina, df)
        total_linhas += n
        dt = time.time() - t0
        print("[info] Pagina " + str(pagina) + ": " + str(n) +
              " linhas | last_id=" + str(novo_last_id) +
              " | acumulado=" + str(total_linhas) +
              " | ps=" + str(ps_corrente) +
              " | " + ("%.1f" % dt) + "s")
        last_id = novo_last_id

    gravado = contar_destino()
    total_t = time.time() - t_ini
    print("OK " + TABELA_DESTINO +
          " | lido=" + str(total_linhas) +
          " | gravado=" + str(gravado) +
          " | tempo total=" + ("%.1f" % total_t) + "s")

    if gravado < total_linhas:
        raise RuntimeError(
            "PERDA na carga: lido " + str(total_linhas) +
            ", gravado " + str(gravado) +
            " (destino com menos linhas que a origem)"
        )
    if gravado > total_linhas:
        print(
            "[warn] " + TABELA_DESTINO +
            ": gravado (" + str(gravado) + ") > lido (" + str(total_linhas) + ")."
            " Possivel trigger/processo concorrente no destino."
            " Continuando."
        )


if __name__ == "__main__":
    try:
        main()
        print("Carga Completa")
    except Exception as e:
        print("Erro: " + str(e))
        raise
    finally:
        try:
            origem_dommus.dispose()
            destino_dwi.dispose()
        except Exception:
            pass
