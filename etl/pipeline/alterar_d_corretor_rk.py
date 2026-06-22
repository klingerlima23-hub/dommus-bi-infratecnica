"""
Adiciona id_corretor_rk em dw_infratecnica.d_corretor (BIGINT NULL).

A coluna guarda SG.id (tb_sgg3_autenticacao.id) -- chave que casa com
f_venda.id_corretor pra montar o ranking. Sem ela o JOIN do endpoint
/api/data/ranking-vendas nao acha nome/foto do corretor.

Idempotente: consulta information_schema antes do ALTER.

Rode:  py -3.12 .\\alterar_d_corretor_rk.py
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

print("Alterando dw_infratecnica.d_corretor ...")
eng = destino_engine()
with eng.begin() as conn:
    existe = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.columns "
        "WHERE table_schema = DATABASE() "
        "  AND table_name = 'd_corretor' "
        "  AND column_name = 'id_corretor_rk'"
    )).scalar()
    if existe:
        print("  [skip] id_corretor_rk ja existe")
    else:
        print("  [add]  id_corretor_rk BIGINT NULL AFTER id_corretor")
        conn.execute(text(
            "ALTER TABLE d_corretor "
            "ADD COLUMN `id_corretor_rk` BIGINT NULL AFTER `id_corretor`"
        ))

print("OK. Agora rode: py -3.12 .\\sincroniza_d_corretor.py")
