"""
Pipeline orquestrador do projeto dw_infratecnica.

Executa, em ordem logica (dimensoes -> fatos), os 20 scripts
sincroniza_*.py do subset focado no dashboard Marketing + Vendas.

Cada script roda como subprocess independente - se um falhar, o
pipeline aborta via check=True.

Tambem registra cada execucao em meta_etl_execucao (auditoria), com
timestamps em UTC, pra o front-end exibir "Atualizado em ...".
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

import os, sys, subprocess
from time import sleep

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import BASE_DIR  # noqa: E402

# Imports tardios so aqui pra meta_etl (etl_utils carrega config completa).
# Usados pelas funcoes _meta_etl_* abaixo. Se falhar (ex.: sem credenciais),
# o pipeline continua rodando normalmente -- a auditoria so e desabilitada.
try:
    from etl_utils import destino_engine  # noqa: E402
    from sqlalchemy import text  # noqa: E402
    _META_ETL_DISPONIVEL = True
except Exception as _e:
    print(f"[meta_etl] desabilitado (etl_utils nao disponivel): {_e}")
    _META_ETL_DISPONIVEL = False

DIR = BASE_DIR


# ============================================================
# Registro de execucao do ETL (meta_etl_execucao)
# Cria a tabela se nao existir; grava inicio (status='em_progresso')
# e atualiza no fim (status='ok' ou 'erro'). Todos os timestamps
# sao gravados em UTC via UTC_TIMESTAMP() do MySQL pra o front-end
# poder converter pro timezone do usuario corretamente.
# ============================================================
def _meta_etl_ensure_table():
    if not _META_ETL_DISPONIVEL:
        return
    eng = destino_engine()
    ddl = """
    CREATE TABLE IF NOT EXISTS meta_etl_execucao (
      id BIGINT NOT NULL AUTO_INCREMENT,
      iniciado_em DATETIME NOT NULL,
      concluido_em DATETIME NULL,
      status VARCHAR(20) DEFAULT 'em_progresso',
      scripts_executados INT DEFAULT 0,
      scripts_pulados INT DEFAULT 0,
      PRIMARY KEY (id),
      KEY idx_concluido_em (concluido_em)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    try:
        with eng.begin() as conn:
            conn.execute(text(ddl))
    except Exception as e:
        print(f"[meta_etl] falha ao criar tabela: {e}")


def _meta_etl_inicio():
    if not _META_ETL_DISPONIVEL:
        return None
    try:
        eng = destino_engine()
        with eng.begin() as conn:
            result = conn.execute(text(
                "INSERT INTO meta_etl_execucao (iniciado_em, status) "
                "VALUES (UTC_TIMESTAMP(), 'em_progresso')"
            ))
            return result.lastrowid
    except Exception as e:
        print(f"[meta_etl] falha ao registrar inicio: {e}")
        return None


def _meta_etl_fim(exec_id, executados, pulados, status='ok'):
    if not _META_ETL_DISPONIVEL or exec_id is None:
        return
    try:
        eng = destino_engine()
        with eng.begin() as conn:
            conn.execute(text(
                "UPDATE meta_etl_execucao "
                "SET concluido_em = UTC_TIMESTAMP(), "
                "    status = :status, "
                "    scripts_executados = :exec_count, "
                "    scripts_pulados = :pul_count "
                "WHERE id = :id"
            ), {
                "status": status,
                "exec_count": executados,
                "pul_count": pulados,
                "id": exec_id,
            })
    except Exception as e:
        print(f"[meta_etl] falha ao registrar fim: {e}")


def run(script):
    print("----- Executando " + script + " -----")
    # usa sys.executable para herdar a mesma versao do Python que rodou o pipeline
    # (chame com `py -3.12 etl_inquilino_..._pipeline.py` para forcar 3.12)
    subprocess.run(["py", "-3.12", os.path.join(DIR, script)], check=True)


print("Atualizando dw_infratecnica...")

# registra inicio da execucao em meta_etl_execucao (UTC)
_meta_etl_ensure_table()
_exec_id = _meta_etl_inicio()
_executados = 0


def _run(script):
    """Wrapper que conta scripts executados pra auditoria em meta_etl_execucao."""
    global _executados
    run(script)
    _executados += 1


try:
    # ==================== DIMENSOES ====================
    # Identidade do cliente (logo + nome) -- alimenta a Sidebar via /api/cliente
    _run("sincroniza_d_cliente_dommus.py")

    # Dimensoes simples (sem dependencias hierarquicas)
    _run("sincroniza_d_funil.py")
    _run("sincroniza_d_etapa_funil.py")
    _run("sincroniza_d_midia.py")
    _run("sincroniza_d_origem.py")
    _run("sincroniza_d_campanha.py")
    _run("sincroniza_d_empreendimento.py")

    # Dimensoes hierarquicas
    _run("sincroniza_d_fase_funil.py")
    _run("sincroniza_d_fase_etapa.py")
    _run("sincroniza_d_status_funil.py")
    _run("sincroniza_d_etapa_oportunidade.py")

    # Dimensoes de pessoas / times
    _run("sincroniza_d_equipe.py")
    _run("sincroniza_d_gerente.py")
    _run("sincroniza_d_corretor.py")
    _run("sincroniza_d_usuario.py")
    # _run("sincroniza_d_usuario_gu.py")

    # ==================== FATOS ====================
    # Captacao / oportunidade
    _run("sincroniza_f_lead.py")
    _run("sincroniza_f_oportunidade.py")
    _run("sincroniza_f_atendimento_oportunidade.py")
    _run("sincroniza_f_visita.py")
    _run("sincroniza_f_descarte.py")
    _run("sincroniza_f_funil.py")
    _run("sincroniza_f_investimento.py")
    _run("sincroniza_f_evolucao_processo.py")
    _run("sincroniza_f_historico_etapa_processo.py")

    # Unidade / venda
    _run("sincroniza_f_unidade.py")
    _run("sincroniza_f_espelho_de_venda.py")
    _run("sincroniza_f_venda.py")
except Exception:
    # marca erro em meta_etl_execucao mas re-raise pra preservar o comportamento atual
    _meta_etl_fim(_exec_id, _executados, 0, status='erro')
    raise

# tudo OK -- registra fim em meta_etl_execucao (status='ok')
_meta_etl_fim(_exec_id, _executados, 0, status='ok')

print("Atualizacao concluida.")

sleep(5)
