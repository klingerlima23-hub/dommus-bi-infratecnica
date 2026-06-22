"""
Adiciona id_gerente, id_corretor, id_equipe em dw_infratecnica.f_venda
(BIGINT NULL).

Idempotente: consulta information_schema antes do ALTER e pula colunas
ja existentes. Use sempre que clonar este projeto pra outro cliente, ou
quando recriar o DW do zero.

Rode:  py -3.12 .\\alterar_f_venda_ids.py
"""
# ============================================================
# Guard: garante execucao sob Python 3.12.
# ============================================================
import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    print(f"[guard] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from etl_utils import destino_engine  # noqa: E402
from sqlalchemy import text  # noqa: E402

COLUNAS = [
    ("id_gerente",  "BIGINT NULL", "proponente3_email"),
    ("id_corretor", "BIGINT NULL", "id_gerente"),
    ("id_equipe",   "BIGINT NULL", "id_corretor"),
]

print("Alterando dw_infratecnica.f_venda ...")
eng = destino_engine()
with eng.begin() as conn:
    existentes = {
        r[0]
        for r in conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = 'f_venda'"
        )).fetchall()
    }
    for nome, tipo, depois in COLUNAS:
        if nome in existentes:
            print(f"  [skip] {nome} ja existe")
            continue
        print(f"  [add]  {nome} {tipo} AFTER {depois}")
        conn.execute(text(
            f"ALTER TABLE f_venda ADD COLUMN `{nome}` {tipo} AFTER `{depois}`"
        ))

print("OK. Agora rode: py -3.12 .\\sincroniza_f_venda.py")
