"""
Sincroniza f_funil (origem crm_inquilino_0040 -> dw_infratecnica.f_funil).

CASO ESPECIAL: a SQL faz GROUP BY (cso.id_oportunidade, cso.id_status_destino),
ou seja, o mesmo id_oportunidade aparece em multiplas linhas (uma por
status_destino). Por isso a paginacao keyset por uma unica PK NAO funciona.

Estrategia adotada:
- Carga em UNICO SELECT com janela de l.criado_em controlada por
  DATA_INICIO / DATA_FIM (default amplo).
- Leitura via pandas.read_sql com retry para mitigar falhas transitorias.
- TRUNCATE + INSERT em chunks no destino.

Para volumes muito grandes voce pode estreitar a janela (ex: rodar
mes a mes alterando DATA_INICIO / DATA_FIM via env ou parametros).
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

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text  # noqa: E402
from etl_utils import (  # noqa: E402
    destino_engine, origem_engine, retry,
)
from config import caminho_sql  # noqa: E402

# ---------- conexoes ----------
origem_dommus = origem_engine()
destino_dwi = destino_engine()

# ---------- parametros ----------
TABELA_DESTINO = "f_funil"
CAMINHO_SQL    = caminho_sql("consulta_f_funil")

# Janela default: ampla (carga full)
DATA_INICIO = "1900-01-01 00:00:00"
DATA_FIM    = "2099-12-31 23:59:59"

WRITE_CHUNKSIZE = 500


def gravar_dataframe(df):
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


def ler_completo(sql_formatado):
    with origem_dommus.connect() as conn:
        return pd.read_sql(text(sql_formatado), conn)


def main():
    print("Carregando SQL para " + TABELA_DESTINO + "...")

    with open(CAMINHO_SQL, "r", encoding="utf-8") as f:
        sql_raw = f.read()

    sql_formatado = sql_raw.format(data_inicio=DATA_INICIO, data_fim=DATA_FIM)

    t_ini = time.time()

    print("[info] Lendo SQL completa (sem paginacao - GROUP BY composto)...")
    df = retry("ler f_funil completo", ler_completo, sql_formatado)

    if df is None or df.empty:
        print("Origem vazia - ABORTANDO sem truncar o destino.")
        return

    n = len(df)
    print("[info] " + str(n) + " linhas lidas da origem.")

    retry("truncate destino", truncar_destino)
    print("[info] Destino " + TABELA_DESTINO + " truncado.")

    retry("gravar dataframe", gravar_dataframe, df)

    gravado = contar_destino()
    total_t = time.time() - t_ini
    print("OK " + TABELA_DESTINO +
          " | lido=" + str(n) +
          " | gravado=" + str(gravado) +
          " | tempo total=" + ("%.1f" % total_t) + "s")

    if gravado < n:
        raise RuntimeError(
            "PERDA na carga: lido " + str(n) +
            ", gravado " + str(gravado) +
            " (destino com menos linhas que a origem)"
        )
    if gravado > n:
        print(
            "[warn] " + TABELA_DESTINO +
            ": gravado (" + str(gravado) + ") > lido (" + str(n) + ")."
            " Possivel trigger/processo concorrente no destino. Continuando."
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
