"""
Cria (ou completa) a tabela f_oportunidade_interesse no dw_infratecnica
de forma idempotente:
  - se a tabela nao existe, cria com a DDL completa.
  - se ja existe, confere as colunas conhecidas e adiciona as que faltarem
    (util pra evolucoes futuras -- basta acrescentar entradas em COLUNAS_PATCH).

Rode: py -3.12 .\\criar_tabela_f_oportunidade_interesse.py
"""
# ============================================================
# Guard: garante execucao sob Python 3.12.
# ============================================================
import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from etl_utils import destino_engine  # noqa: E402
from sqlalchemy import text  # noqa: E402

DDL = """
CREATE TABLE IF NOT EXISTS `f_oportunidade_interesse` (
  `id_oportunidade_interesse` BIGINT NULL COMMENT 'PK oportunidade_interesse.id (paginacao)',
  `id_oportunidade`           BIGINT NULL COMMENT 'FK oportunidade (JOIN com f_oportunidade)',
  `valor_estimado`            DECIMAL(20,2) NULL COMMENT 'dados_dinamicos.16',
  `valor_real`                DECIMAL(20,2) NULL COMMENT 'dados_dinamicos.17',
  `tipo_mercado`              VARCHAR(50) NULL  COMMENT 'dados_dinamicos.18 (Privado/Publico)',
  `tipo_segmento`             VARCHAR(100) NULL COMMENT 'dados_dinamicos.19',
  `dados_dinamicos_raw`       JSON NULL          COMMENT 'JSON bruto pra evolucoes futuras',
  KEY `idx_f_oportunidade_interesse_id_oportunidade_interesse` (`id_oportunidade_interesse`),
  KEY `idx_f_oportunidade_interesse_id_oportunidade`           (`id_oportunidade`),
  KEY `idx_f_oportunidade_interesse_tipo_mercado`              (`tipo_mercado`),
  KEY `idx_f_oportunidade_interesse_tipo_segmento`             (`tipo_segmento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

COLUNAS_PATCH = [
    ("id_oportunidade_interesse", "BIGINT NULL"),
    ("id_oportunidade",           "BIGINT NULL"),
    ("valor_estimado",            "DECIMAL(20,2) NULL"),
    ("valor_real",                "DECIMAL(20,2) NULL"),
    ("tipo_mercado",              "VARCHAR(50) NULL"),
    ("tipo_segmento",             "VARCHAR(100) NULL"),
    ("dados_dinamicos_raw",       "JSON NULL"),
]

print("Alterando dw_infratecnica.f_oportunidade_interesse ...")
eng = destino_engine()
with eng.begin() as conn:
    existe = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.tables "
        "WHERE table_schema = DATABASE() AND table_name = 'f_oportunidade_interesse'"
    )).scalar()
    if existe:
        print("  [skip] f_oportunidade_interesse ja existe -- conferindo colunas...")
        cols = {
            r[0] for r in conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = DATABASE() AND table_name = 'f_oportunidade_interesse'"
            )).fetchall()
        }
        for nome, tipo in COLUNAS_PATCH:
            if nome in cols:
                print(f"  [skip] {nome}")
            else:
                print(f"  [add]  {nome} {tipo}")
                conn.execute(text(f"ALTER TABLE f_oportunidade_interesse ADD COLUMN `{nome}` {tipo}"))
    else:
        print("  [add]  criando f_oportunidade_interesse...")
        conn.execute(text(DDL))

print("\nProximo passo: py -3.12 .\\sincroniza_f_oportunidade_interesse.py")
