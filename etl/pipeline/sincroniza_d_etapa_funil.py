"""
Sincroniza d_etapa_funil (dados fixos -> dw_infratecnica.d_etapa_funil).

A tabela d_etapa_funil contem 7 fases canonicas do funil de vendas, hard-coded
no projeto (nao depende da origem). O sincronizador faz TRUNCATE +
INSERT direto no destino, sem paginar nem ler do CRM.

OBS: este e o equivalente ao 'd_funil' do projeto crd, renomeado para
d_etapa_funil aqui para nao colidir com o d_funil ja existente
(que espelha crm_inquilino_0040.funil).
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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text  # noqa: E402
from etl_utils import destino_engine, retry  # noqa: E402

destino_dwi = destino_engine()

TABELA_DESTINO = "d_etapa_funil"

# Linhas canonicas (id_etapa_funil, nome_etapa_funil, ordem_etapa_funil)
LINHAS = [
    (1, "Leads",            1),
    (2, "Em atendimento",   2),
    (3, "Oportunidade",     3),
    (4, "Visita agendada",  4),
    (5, "Pasta",            5),
    (6, "Venda",            6),
    (7, "Perdido/Descarte", 7),
]


def truncar_destino():
    with destino_dwi.begin() as conn:
        conn.execute(text("TRUNCATE TABLE " + TABELA_DESTINO))


def gravar_linhas():
    sql = text(
        "INSERT INTO " + TABELA_DESTINO +
        " (id_etapa_funil, nome_etapa_funil, ordem_etapa_funil) "
        "VALUES (:id, :nome, :ordem)"
    )
    rows = [{"id": i, "nome": n, "ordem": o} for (i, n, o) in LINHAS]
    with destino_dwi.begin() as conn:
        conn.execute(sql, rows)


def contar_destino():
    with destino_dwi.connect() as conn:
        r = conn.execute(text("SELECT COUNT(*) FROM " + TABELA_DESTINO)).scalar()
        return r or 0


def main():
    print("Carregando " + TABELA_DESTINO + " (dados fixos)...")
    t_ini = time.time()

    retry("truncate destino", truncar_destino)
    print("[info] Destino " + TABELA_DESTINO + " truncado.")

    retry("gravar linhas fixas", gravar_linhas)

    gravado = contar_destino()
    total_t = time.time() - t_ini
    print("OK " + TABELA_DESTINO +
          " | gravado=" + str(gravado) +
          " | esperado=" + str(len(LINHAS)) +
          " | tempo total=" + ("%.1f" % total_t) + "s")

    if gravado != len(LINHAS):
        raise RuntimeError(
            "INCONSISTENCIA: gravado " + str(gravado) +
            " != esperado " + str(len(LINHAS))
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
            destino_dwi.dispose()
        except Exception:
            pass
