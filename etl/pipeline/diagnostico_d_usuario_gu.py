"""
Diagnostico rapido: mostra a estrutura atual da tabela d_usuario_gu no DW
e o numero de linhas que ela contem. Nao altera nada.

Uso:
    py -3.12 etl\pipeline\diagnostico_d_usuario_gu.py
"""
from __future__ import annotations

import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    print(f"[diag] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import os, sys
import mysql.connector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import DESTINO  # noqa: E402

cfg = {
    "user": DESTINO["user"],
    "password": DESTINO["password"],
    "host": DESTINO["host"],
    "port": int(DESTINO["port"]),
    "database": DESTINO["database"],
    "use_pure": True,
    "connection_timeout": 30,
}

print(f"Conectando em {cfg['host']}:{cfg['port']} db={cfg['database']} user={cfg['user']}")

conn = mysql.connector.connect(**cfg)
cur = conn.cursor()

print("\n--- SHOW COLUMNS FROM d_usuario_gu ---")
cur.execute("SHOW COLUMNS FROM d_usuario_gu")
for row in cur.fetchall():
    print(row)

print("\n--- SELECT COUNT(*) FROM d_usuario_gu ---")
cur.execute("SELECT COUNT(*) FROM d_usuario_gu")
print(cur.fetchone())

print("\n--- SELECT * FROM d_usuario_gu LIMIT 3 ---")
try:
    cur.execute("SELECT * FROM d_usuario_gu LIMIT 3")
    cols = [d[0] for d in cur.description]
    print("colunas:", cols)
    for row in cur.fetchall():
        # mascara o hash de senha (qualquer coluna que se chame password/senha)
        masked = []
        for c, v in zip(cols, row):
            if c.lower() in ("password", "senha", "password_hash") and v:
                s = str(v)
                masked.append(s[:6] + "..." + s[-4:] if len(s) > 12 else "***")
            else:
                masked.append(v)
        print(masked)
except Exception as e:
    print("erro no SELECT *:", e)

cur.close()
conn.close()
print("\nOK.")
