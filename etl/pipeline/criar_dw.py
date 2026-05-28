"""
Aplica o DDL criar_dw_infratecnica.sql no servidor de destino.

Usa as credenciais DESTINO do config.py (usuario/senha/host/port) mas
conecta SEM database default - porque o banco ainda nao existe.

Executa o arquivo SQL statement por statement (respeitando aspas,
strings escapadas, comentarios de linha e de bloco).

Uso:
    python criar_dw.py
    python criar_dw.py --drop    # remove o banco antes de recriar
    python criar_dw.py --arquivo outro_ddl.sql

Seguro para rodar mais de uma vez: todos os CREATE usam IF NOT EXISTS.
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
    print(f"[etl_utils] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import argparse
import os
import re
import sys
import time

import mysql.connector
from mysql.connector import errorcode

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import DESTINO  # noqa: E402

SQL_DEFAULT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "criar_dw_infratecnica.sql",
)
DB_DESTINO = DESTINO.get("database", "dw_infratecnica")


# ---------- split de SQL respeitando strings e comentarios ----------

def split_statements(sql):
    """Quebra o SQL em statements por ';' ignorando: strings 'single',
    "double", backtick, comentarios -- ate fim de linha, /* ... */."""
    stmts = []
    buf = []
    i = 0
    n = len(sql)
    while i < n:
        c = sql[i]

        # comentario de linha
        if c == "-" and i + 1 < n and sql[i + 1] == "-":
            while i < n and sql[i] != "\n":
                i += 1
            continue

        # comentario de bloco
        if c == "/" and i + 1 < n and sql[i + 1] == "*":
            i += 2
            while i + 1 < n and not (sql[i] == "*" and sql[i + 1] == "/"):
                i += 1
            i += 2
            continue

        # strings
        if c in ("'", '"', "`"):
            q = c
            buf.append(c)
            i += 1
            while i < n:
                buf.append(sql[i])
                if sql[i] == "\\" and i + 1 < n:
                    buf.append(sql[i + 1])
                    i += 2
                    continue
                if sql[i] == q:
                    i += 1
                    break
                i += 1
            continue

        if c == ";":
            stmt = "".join(buf).strip()
            if stmt:
                stmts.append(stmt)
            buf = []
            i += 1
            continue

        buf.append(c)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        stmts.append(tail)
    return stmts


def resumir_statement(stmt, maxlen=90):
    s = re.sub(r"\s+", " ", stmt).strip()
    return s[:maxlen] + (" ..." if len(s) > maxlen else "")


# ---------- conexao ----------

def conectar(com_database=False):
    cfg = {
        "user":     DESTINO["user"],
        "password": DESTINO["password"],
        "host":     DESTINO["host"],
        "port":     int(DESTINO["port"]),
        "use_pure": True,
        "connection_timeout": 30,
        "autocommit": True,
    }
    if com_database:
        cfg["database"] = DB_DESTINO
    return mysql.connector.connect(**cfg)


def drop_database():
    print("[drop] removendo banco " + DB_DESTINO + " ...")
    conn = conectar(com_database=False)
    try:
        cur = conn.cursor()
        cur.execute("DROP DATABASE IF EXISTS `" + DB_DESTINO + "`")
        cur.close()
        print("[drop] ok.")
    finally:
        conn.close()


def aplicar(arquivo):
    print("[info] lendo DDL: " + arquivo)
    with open(arquivo, "r", encoding="utf-8") as f:
        sql_raw = f.read()

    stmts = split_statements(sql_raw)
    print("[info] " + str(len(stmts)) + " statements encontrados.")

    # Conecta sem database (porque pode ainda nao existir).
    conn = conectar(com_database=False)
    cur = conn.cursor()
    conn_db_ativo = False

    try:
        ok = 0
        falhas = 0
        t0 = time.time()
        for idx, stmt in enumerate(stmts, start=1):
            resumo = resumir_statement(stmt)
            up = stmt.lstrip().upper()
            try:
                cur.execute(stmt)
                # Consome resultados se houver (ex: SET)
                try:
                    cur.fetchall()
                except mysql.connector.errors.InterfaceError:
                    pass

                if up.startswith("USE "):
                    conn_db_ativo = True
                elif up.startswith("CREATE DATABASE"):
                    # seleciona o recem criado para os CREATE TABLE
                    cur.execute("USE `" + DB_DESTINO + "`")
                    conn_db_ativo = True

                ok += 1
                print(f"  [{idx:3d}/{len(stmts)}] OK  {resumo}")
            except mysql.connector.Error as e:
                falhas += 1
                print(f"  [{idx:3d}/{len(stmts)}] ERR {e.errno} {e.msg}")
                print(f"         stmt: {resumo}")
                # erros fatais que devem abortar
                if e.errno in (
                    errorcode.ER_ACCESS_DENIED_ERROR,
                    errorcode.ER_BAD_DB_ERROR,
                    errorcode.CR_CONN_HOST_ERROR,
                ):
                    raise

        dt = time.time() - t0
        print("")
        print("=" * 60)
        print(f"Concluido em {dt:.1f}s | ok={ok} falhas={falhas}")
        print("=" * 60)

        # Verificacao final
        cur.execute("USE `" + DB_DESTINO + "`")
        cur.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = %s ORDER BY table_name",
            (DB_DESTINO,),
        )
        tabelas = [r[0] for r in cur.fetchall()]
        print(f"\nBanco `{DB_DESTINO}` contem {len(tabelas)} tabelas:")
        for t in tabelas:
            print("  - " + t)

        if falhas:
            print("\n[warn] houve " + str(falhas) + " falhas - revise o log acima.")
            sys.exit(2)

    finally:
        cur.close()
        conn.close()


def main():
    ap = argparse.ArgumentParser(description="Aplica DDL no DW destino.")
    ap.add_argument("--arquivo", default=SQL_DEFAULT,
                    help="Caminho do .sql (default: criar_dw_infratecnica.sql)")
    ap.add_argument("--drop", action="store_true",
                    help="DROP DATABASE antes de recriar (cuidado!)")
    args = ap.parse_args()

    print(
        "Aplicando DDL em "
        + DESTINO["host"] + ":" + str(DESTINO["port"])
        + " (user=" + DESTINO["user"] + ", db=" + DB_DESTINO + ")"
    )

    if args.drop:
        resp = input(
            "Confirmar DROP DATABASE `" + DB_DESTINO + "`? (digite 'sim'): "
        )
        if resp.strip().lower() != "sim":
            print("Abortado.")
            return
        drop_database()

    aplicar(args.arquivo)


if __name__ == "__main__":
    main()
