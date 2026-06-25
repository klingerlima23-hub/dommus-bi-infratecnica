import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from etl_utils import destino_engine
from sqlalchemy import text

DDL = """
CREATE TABLE IF NOT EXISTS `f_distrato` (
  `processo_id` BIGINT NULL,
  `processo_id_oportunidade` BIGINT NULL,
  `empreendimento_id` BIGINT NULL,
  `empreendimento_nome` VARCHAR(255) NULL,
  `data_distrato` DATE NULL,
  `motivo_distrato` VARCHAR(255) NULL,
  `lead_campanha` VARCHAR(255) NULL,
  `lead_midia` VARCHAR(255) NULL,
  `lead_origem` VARCHAR(255) NULL,
  KEY `idx_f_distrato_processo_id` (`processo_id`),
  KEY `idx_f_distrato_data_distrato` (`data_distrato`),
  KEY `idx_f_distrato_empreendimento_id` (`empreendimento_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

COLUNAS_PATCH = [
    ("empreendimento_id",   "BIGINT NULL"),
    ("empreendimento_nome", "VARCHAR(255) NULL"),
]

eng = destino_engine()
with eng.begin() as conn:
    existe = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.tables "
        "WHERE table_schema = DATABASE() AND table_name = 'f_distrato'"
    )).scalar()
    if existe:
        print("[skip] f_distrato ja existe -- conferindo colunas...")
        cols = {
            r[0] for r in conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = DATABASE() AND table_name = 'f_distrato'"
            )).fetchall()
        }
        for nome, tipo in COLUNAS_PATCH:
            if nome in cols:
                print(f"  [skip] {nome}")
            else:
                print(f"  [add]  {nome} {tipo}")
                conn.execute(text(f"ALTER TABLE f_distrato ADD COLUMN `{nome}` {tipo}"))
    else:
        print("[add]  criando f_distrato...")
        conn.execute(text(DDL))

print("\nProximo passo: py -3.12 .\\sincroniza_f_distrato.py")
