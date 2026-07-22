"""
Sincroniza f_oportunidade_interesse (crm_inquilino_0040 -> dw_infratecnica).

Padrao: TRUNCATE + FULL LOAD com keyset pagination em oi.id_oportunidade_interesse
        (alias id_oportunidade_interesse no resultado).

Extrai 4 chaves conhecidas do JSON dados_dinamicos:
   16 = valor_estimado
   17 = valor_real
   18 = tipo_mercado
   19 = tipo_segmento
E preserva o JSON bruto em dados_dinamicos_raw pra futuras evolucoes.

Mitigacoes contra erro 2013 herdadas do padrao Dommus (retry adaptativo).
"""

# ============================================================
# Guard: garante execucao sob Python 3.12.
# ============================================================
import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    print(f"[guard] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os, sys, time
import json

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
TABELA_DESTINO = "f_oportunidade_interesse"
PK_QUALIFIED   = "oi.id_oportunidade_interesse"
PK_ALIAS       = "id_oportunidade_interesse"
CAMINHO_SQL    = caminho_sql("consulta_f_oportunidade_interesse")

# Janela ampla: truncate + full load carrega TUDO
DATA_INICIO = "1900-01-01 00:00:00"
DATA_FIM    = "2099-12-31 23:59:59"

PAGE_SIZE       = 5000
PAGE_SIZE_MIN   = 500
WRITE_CHUNKSIZE = 500


def normalizar_json(df):
    """
    Pandas trata o retorno de JSON do MySQL como str (ou dict, dependendo
    do driver). Pra gravar em coluna JSON no destino, garantimos que
    sempre virem string JSON valida. Se ja for dict/list, serializa;
    se for str, deixa passar; NULL fica NULL.
    """
    if 'dados_dinamicos_raw' not in df.columns:
        return df
    def _fmt(v):
        if v is None:
            return None
        if isinstance(v, (dict, list)):
            return json.dumps(v, ensure_ascii=False)
        return v
    df['dados_dinamicos_raw'] = df['dados_dinamicos_raw'].map(_fmt)
    return df


def gravar_pagina(df):
    df = normalizar_json(df)
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
