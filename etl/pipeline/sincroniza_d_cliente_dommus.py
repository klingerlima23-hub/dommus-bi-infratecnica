"""
Sincroniza d_cliente_dommus (origem dommus_homolog_gu.tb_cliente, filtrada
pela WHERE definida em consulta_d_cliente_dommus.sql -- atualmente id=40
para o cliente Infratecnica).

Tabela trivial de UMA linha (a identidade visual do cliente).
Por ser tao pequena, NAO usa keyset pagination nem date filter -- so
TRUNCATE + INSERT direto.

Mantem o padrao do projeto:
- Engines via etl_utils (SESSION_INIT + retry + pool_recycle).
- Logs no mesmo formato dos demais sincroniza_d_*.py.
"""
from __future__ import annotations


# ============================================================
# Guard: garante execucao sob Python 3.12.
# Se o script foi lancado com `python` (resolvendo p/ outra versao
# como 3.14), re-executa o chamador (sys.argv[0]) sob `py -3.12`.
# ============================================================
import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    print(f"[sincroniza_d_cliente_dommus] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text  # noqa: E402
import pandas as pd  # noqa: E402

from etl_utils import destino_engine, origem_engine, retry  # noqa: E402
from config import caminho_sql  # noqa: E402

origem_dommus = origem_engine()
destino_dwi   = destino_engine()

TABELA_DESTINO = "d_cliente_dommus"
CAMINHO_SQL    = caminho_sql("consulta_d_cliente_dommus")


def ler_origem(sql: str) -> pd.DataFrame:
    with origem_dommus.connect() as conn:
        return pd.read_sql(text(sql), conn)


def truncar_destino():
    with destino_dwi.begin() as conn:
        conn.execute(text("TRUNCATE TABLE " + TABELA_DESTINO))


def gravar(df: pd.DataFrame):
    with destino_dwi.begin() as conn:
        df.to_sql(
            TABELA_DESTINO, conn,
            if_exists="append", index=False,
        )


def contar_destino() -> int:
    with destino_dwi.connect() as conn:
        r = conn.execute(text("SELECT COUNT(*) FROM " + TABELA_DESTINO)).scalar()
        return int(r or 0)


def main():
    print("Carregando SQL para " + TABELA_DESTINO + "...")
    with open(CAMINHO_SQL, "r", encoding="utf-8") as f:
        sql_raw = f.read()

    t_ini = time.time()
    df = retry("ler origem " + TABELA_DESTINO, ler_origem, sql_raw)

    if df is None or df.empty:
        print("Origem vazia (cliente nao encontrado em tb_cliente para o filtro definido em consulta_d_cliente_dommus.sql) - ABORTANDO sem truncar destino.")
        return

    n_lido = len(df)
    print("[info] origem: " + str(n_lido) + " linha(s)")

    retry("truncate destino", truncar_destino)
    print("[info] Destino " + TABELA_DESTINO + " truncado.")

    retry("gravar " + TABELA_DESTINO, gravar, df)

    gravado = contar_destino()
    total_t = time.time() - t_ini
    print("OK " + TABELA_DESTINO +
          " | lido=" + str(n_lido) +
          " | gravado=" + str(gravado) +
          " | tempo total=" + ("%.1f" % total_t) + "s")

    if gravado < n_lido:
        raise RuntimeError(
            "PERDA na carga: lido " + str(n_lido) +
            ", gravado " + str(gravado)
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
