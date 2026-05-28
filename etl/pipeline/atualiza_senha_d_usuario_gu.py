"""
Atualiza (ou cria) a senha de um usuario na tabela dw_infratecnica.d_usuario_gu.

IMPORTANTE: este script trabalha com o SCHEMA LEGADO da tabela em producao,
que tem as colunas:
    id_usuario       BIGINT
    emails_usario    VARCHAR(255)   (typo proposital, schema legado)
    password         VARCHAR(255)
    id_perfil        BIGINT
    perfil_usuario   VARCHAR(255)

A senha e gerada com bcrypt (compativel com bcryptjs do dashboard Next.js).

Uso:
    py -3.12 etl\\pipeline\\atualiza_senha_d_usuario_gu.py
        (modo interativo: pergunta email e senha)

    py -3.12 etl\\pipeline\\atualiza_senha_d_usuario_gu.py ^
        --email alguem@dommus.com.br --senha "MinhaSenha123" --perfil "Gestor Comercial"
        (modo argumentos, util para CI)
"""
from __future__ import annotations

import sys as _sys
if _sys.version_info[:2] != (3, 12):
    import subprocess as _sp
    print(f"[atualiza-senha] re-executando sob Python 3.12 (atual: {_sys.version_info.major}.{_sys.version_info.minor})", flush=True)
    _sys.exit(_sp.call(["py", "-3.12", *_sys.argv]))

import argparse
import getpass
import os
import sys

import mysql.connector

try:
    import bcrypt  # type: ignore
except ImportError:
    print("[erro] modulo 'bcrypt' nao encontrado. Instale com:")
    print("  py -3.12 -m pip install bcrypt")
    sys.exit(1)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import DESTINO  # noqa: E402


def gerar_hash_bcrypt(senha: str) -> str:
    """Gera hash bcrypt compativel com bcryptjs (algoritmo $2b$)."""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(senha.encode("utf-8"), salt).decode("utf-8")


def conectar():
    return mysql.connector.connect(
        user=DESTINO["user"],
        password=DESTINO["password"],
        host=DESTINO["host"],
        port=int(DESTINO["port"]),
        database=DESTINO["database"],
        use_pure=True,
        connection_timeout=30,
        autocommit=True,
    )


def buscar_usuario(cur, email: str):
    cur.execute(
        "SELECT id_usuario, emails_usario, password, id_perfil, perfil_usuario "
        "FROM d_usuario_gu WHERE emails_usario = %s LIMIT 1",
        (email,),
    )
    return cur.fetchone()


def atualizar_senha(cur, email: str, novo_hash: str) -> int:
    cur.execute(
        "UPDATE d_usuario_gu SET password = %s WHERE emails_usario = %s",
        (novo_hash, email),
    )
    return cur.rowcount


def proximo_id(cur) -> int:
    cur.execute("SELECT COALESCE(MAX(id_usuario), 0) + 1 FROM d_usuario_gu")
    row = cur.fetchone()
    return int(row[0]) if row and row[0] else 1


def criar_usuario(cur, email: str, novo_hash: str, perfil: str) -> int:
    novo_id = proximo_id(cur)
    cur.execute(
        "INSERT INTO d_usuario_gu (id_usuario, emails_usario, password, id_perfil, perfil_usuario) "
        "VALUES (%s, %s, %s, %s, %s)",
        (novo_id, email, novo_hash, 0, perfil),
    )
    return novo_id


def main():
    ap = argparse.ArgumentParser(
        description="Atualiza ou cria senha em d_usuario_gu (schema legado)."
    )
    ap.add_argument("--email", help="E-mail do usuario.")
    ap.add_argument("--senha", help="Senha em texto plano (sera bcrypt-hashada).")
    ap.add_argument(
        "--perfil",
        default="Gestor Comercial",
        help="perfil_usuario (so usado se o usuario for criado). Default: 'Gestor Comercial'.",
    )
    ap.add_argument(
        "--criar-se-nao-existir",
        action="store_true",
        help="Cria o usuario se nao existir (em vez de abortar).",
    )
    args = ap.parse_args()

    email = (args.email or "").strip()
    if not email:
        email = input("E-mail: ").strip()
    if not email:
        print("[erro] e-mail vazio.")
        sys.exit(1)

    senha = args.senha or ""
    if not senha:
        senha = getpass.getpass("Nova senha: ")
        senha_conf = getpass.getpass("Confirme a senha: ")
        if senha != senha_conf:
            print("[erro] senhas nao conferem.")
            sys.exit(1)
    if len(senha) < 4:
        print("[erro] senha muito curta (min 4 caracteres).")
        sys.exit(1)

    print(f"[info] gerando hash bcrypt...")
    novo_hash = gerar_hash_bcrypt(senha)
    print(f"[info] hash gerado: {novo_hash[:7]}...{novo_hash[-4:]}")

    print(f"[info] conectando em {DESTINO['host']}:{DESTINO['port']} db={DESTINO['database']}")
    conn = conectar()
    cur = conn.cursor()
    try:
        existente = buscar_usuario(cur, email)
        if existente:
            id_u, em, _pw, id_perfil, perfil_u = existente
            print(f"[info] usuario encontrado: id_usuario={id_u} perfil='{perfil_u}'")
            n = atualizar_senha(cur, email, novo_hash)
            print(f"[ok] senha atualizada ({n} linha(s) afetada(s)).")
        else:
            if not args.criar_se_nao_existir:
                if args.email and args.senha:
                    # modo nao-interativo sem --criar-se-nao-existir: aborta
                    print(f"[erro] usuario '{email}' nao encontrado. Use --criar-se-nao-existir para criar.")
                    sys.exit(2)
                resp = input(
                    f"Usuario '{email}' nao existe. Criar agora com perfil "
                    f"'{args.perfil}'? (s/N): "
                ).strip().lower()
                if resp != "s":
                    print("Abortado.")
                    sys.exit(0)
            novo_id = criar_usuario(cur, email, novo_hash, args.perfil)
            print(f"[ok] usuario criado: id_usuario={novo_id} email='{email}' perfil='{args.perfil}'")
    finally:
        cur.close()
        conn.close()

    print("Pronto. Tente o login no dashboard.")


if __name__ == "__main__":
    main()
