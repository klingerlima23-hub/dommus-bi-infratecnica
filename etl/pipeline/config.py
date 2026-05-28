"""
Configuracao centralizada do projeto ETL dw_infratecnica.

Le credenciais a partir de:
1. st.secrets (quando rodando no Streamlit Cloud)
2. BASE_DIR/.streamlit/secrets.toml (parse direto, indep. da cwd)
3. Variaveis de ambiente DB_ORIGEM_* / DB_DESTINO_* (quando rodando local com .env)
4. Fallback dict vazio (causa erro depois - melhor que silently usar credencial errada)
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
    print(f"[guard] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os


# ---------- diretorios ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQL_DIR = BASE_DIR


def caminho_sql(nome):
    """Monta caminho absoluto de um .sql a partir do nome."""
    if not nome.lower().endswith(".sql"):
        nome = nome + ".sql"
    return os.path.join(SQL_DIR, nome)


def _read_credentials(group: str) -> dict:
    """Le credenciais de um grupo (origem/destino).

    Ordem de procura:
      1) st.secrets[group]                                  - rodando dentro do Streamlit Cloud
      2) BASE_DIR/.streamlit/secrets.toml (parse direto)    - rodando local, indep. da cwd
      3) variaveis de ambiente DB_<GROUP>_USER/PASSWORD/HOST/PORT/DATABASE
      4) dict vazio (causa erro depois - melhor que silently usar credencial errada)
    """
    # 1) st.secrets (Streamlit Cloud)
    try:
        import streamlit as st
        if hasattr(st, "secrets") and group in st.secrets:
            return dict(st.secrets[group])
    except Exception:
        pass

    # 2) Local: parsear .streamlit/secrets.toml direto, ancorado em BASE_DIR
    try:
        secrets_path = os.path.join(BASE_DIR, ".streamlit", "secrets.toml")
        if os.path.isfile(secrets_path):
            try:
                import tomllib  # Python 3.11+
            except ImportError:
                import tomli as tomllib  # fallback
            with open(secrets_path, "rb") as f:
                data = tomllib.load(f)
            if group in data:
                return dict(data[group])
    except Exception:
        pass

    # 3) Variaveis de ambiente DB_<GROUP>_*
    prefix = "DB_" + group.upper() + "_"
    env_keys = ("USER", "PASSWORD", "HOST", "PORT", "DATABASE")
    if any(os.environ.get(prefix + k) for k in env_keys):
        return {
            "user":     os.environ.get(prefix + "USER", ""),
            "password": os.environ.get(prefix + "PASSWORD", ""),
            "host":     os.environ.get(prefix + "HOST", ""),
            "port":     os.environ.get(prefix + "PORT", ""),
            "database": os.environ.get(prefix + "DATABASE", ""),
        }

    return {}


# ---------- credenciais (carregadas dinamicamente) ----------
ORIGEM = _read_credentials("origem")
DESTINO = _read_credentials("destino")
