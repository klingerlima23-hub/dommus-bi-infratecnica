"""
Utilitarios compartilhados dos scripts ETL.

Centraliza:
- Factory de engines com SESSION_INIT + read/write timeouts no socket.
- origem_engine() / destino_engine(): singletons que leem credenciais
  de config.py (ORIGEM / DESTINO). Nenhum script precisa repetir
  credencial nem chamar criar_engine() diretamente.
- retry com OperationalError, DisconnectionError e InterfaceError.
- construir_sql_paginado: injeta keyset pagination em qualquer SQL,
  com ou sem WHERE descomentado.
- ler_pagina_adaptativa: reduz page_size automaticamente no erro 2013.
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

import time

import pandas as pd
from sqlalchemy import create_engine, event, text
from sqlalchemy.exc import OperationalError, DisconnectionError, InterfaceError

from config import ORIGEM, DESTINO  # noqa: E402


SESSION_INIT = (
    "SET SESSION net_read_timeout=7200, net_write_timeout=7200, "
    "wait_timeout=28800, interactive_timeout=28800, max_execution_time=0"
)


def criar_engine(user, password, host, port, database):
    engine = create_engine(
        f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}",
        connect_args={
            "connection_timeout": 60,
            "use_pure": True,
        },
        pool_size=5, max_overflow=5, pool_recycle=1800, pool_pre_ping=True,
    )

    @event.listens_for(engine, "connect")
    def _set_session_timeouts(dbapi_conn, conn_record):
        cursor = dbapi_conn.cursor()
        try:
            cursor.execute(SESSION_INIT)
        finally:
            cursor.close()

    return engine


_origem_engine = None
_destino_engine = None


def origem_engine():
    global _origem_engine
    if _origem_engine is None:
        _origem_engine = criar_engine(**ORIGEM)
    return _origem_engine


def destino_engine():
    global _destino_engine
    if _destino_engine is None:
        _destino_engine = criar_engine(**DESTINO)
    return _destino_engine


def dispose_engines():
    global _origem_engine, _destino_engine
    for e in (_origem_engine, _destino_engine):
        if e is not None:
            try:
                e.dispose()
            except Exception:
                pass
    _origem_engine = None
    _destino_engine = None


RETRIABLE_EXC = (OperationalError, DisconnectionError, InterfaceError)


def eh_2013(exc):
    s = str(exc)
    return "2013" in s or "Lost connection" in s


def retry(descricao, fn, *args, max_retries=5, backoff_base=3, **kwargs):
    for attempt in range(max_retries):
        try:
            return fn(*args, **kwargs)
        except RETRIABLE_EXC as e:
            if attempt == max_retries - 1:
                print("[error] " + descricao + ": falhou apos " + str(max_retries) + " tentativas")
                raise
            sleep_s = backoff_base * (2 ** attempt)
            print(
                "[warn] " + descricao + ": retry " + str(attempt + 1) + "/" + str(max_retries) +
                " em " + str(sleep_s) + "s (" + e.__class__.__name__ + ")"
            )
            time.sleep(sleep_s)


def _find_last_kw_depth0(sql, keywords):
    """Encontra a ULTIMA ocorrencia de qualquer keyword em depth=0
    (fora de strings, comentarios -- e /* */, e subqueries entre ()).
    Retorna (indice, keyword) ou (-1, None)."""
    depth = 0
    last_idx = -1
    last_kw = None
    i = 0
    n = len(sql)
    upper = sql.upper()
    keywords_upper = [kw.upper() for kw in keywords]

    while i < n:
        c = sql[i]
        if c in ("'", '"', '`'):
            quote = c
            i += 1
            while i < n:
                if sql[i] == "\\" and i + 1 < n:
                    i += 2
                    continue
                if sql[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if c == '-' and i + 1 < n and sql[i + 1] == '-':
            while i < n and sql[i] != "\n":
                i += 1
            continue
        if c == '/' and i + 1 < n and sql[i + 1] == '*':
            i += 2
            while i + 1 < n and not (sql[i] == '*' and sql[i + 1] == '/'):
                i += 1
            i += 2
            continue
        if c == '(':
            depth += 1
            i += 1
            continue
        if c == ')':
            depth -= 1
            i += 1
            continue
        if depth == 0:
            matched = False
            for idx_kw, kw_u in enumerate(keywords_upper):
                if upper.startswith(kw_u, i):
                    before_ok = i == 0 or not (sql[i - 1].isalnum() or sql[i - 1] == '_')
                    end = i + len(kw_u)
                    after_ok = end >= n or not (sql[end].isalnum() or sql[end] == '_')
                    if before_ok and after_ok:
                        last_idx = i
                        last_kw = keywords[idx_kw]
                        i = end
                        matched = True
                        break
            if matched:
                continue
        i += 1
    return last_idx, last_kw


def construir_sql_paginado(sql_original, pk_qualified):
    """
    Injeta keyset pagination em SQL.
    - Se o SQL JA tem WHERE (em depth 0, fora de strings/comentarios/subqueries),
      adiciona "AND pk_qualified > :last_id".
    - Se NAO tem WHERE (caso dos .sql onde o WHERE esta comentado),
      insere "WHERE pk_qualified > :last_id".
    A clausula e injetada ANTES de GROUP BY / HAVING (se existir) e o
    "ORDER BY pk_qualified ASC LIMIT :page_size" e adicionado ao final.
    """
    sql = sql_original.strip().rstrip(";").rstrip()
    order_idx, _ = _find_last_kw_depth0(sql, ["ORDER BY"])
    sql_sem_order = sql[:order_idx].rstrip() if order_idx >= 0 else sql

    group_idx, _ = _find_last_kw_depth0(sql_sem_order, ["GROUP BY"])
    having_idx, _ = _find_last_kw_depth0(sql_sem_order, ["HAVING"])
    cut_candidates = [x for x in (group_idx, having_idx) if x >= 0]
    cut_idx = min(cut_candidates) if cut_candidates else -1

    sql_antes_corte = sql_sem_order[:cut_idx] if cut_idx >= 0 else sql_sem_order
    where_idx, _ = _find_last_kw_depth0(sql_antes_corte, ["WHERE"])
    tem_where = where_idx >= 0

    if tem_where:
        clausula = "\n  AND " + pk_qualified + " > :last_id"
    else:
        clausula = "\nWHERE " + pk_qualified + " > :last_id"

    order_limit = "\nORDER BY " + pk_qualified + " ASC\nLIMIT :page_size"

    if cut_idx >= 0:
        return (
            sql_sem_order[:cut_idx].rstrip()
            + clausula
            + "\n"
            + sql_sem_order[cut_idx:]
            + order_limit
        )
    return sql_sem_order + clausula + order_limit


def ler_pagina(engine, sql_paginado, last_id, page_size):
    """Le uma pagina (bind params last_id e page_size)."""
    with engine.connect() as conn:
        return pd.read_sql(
            text(sql_paginado),
            conn,
            params={"last_id": last_id, "page_size": page_size},
        )


def ler_pagina_adaptativa(engine, sql_paginado, last_id, page_size,
                          page_size_min, descricao="ler pagina"):
    """
    Le uma pagina reduzindo page_size pela metade a cada 2013
    ate atingir page_size_min. Retorna (df, ps_corrente).
    """
    ps = page_size
    tentativa = 0
    while True:
        tentativa += 1
        try:
            df = retry(
                descricao + " ps=" + str(ps),
                ler_pagina, engine, sql_paginado, last_id, ps,
            )
            return df, ps
        except RETRIABLE_EXC as e:
            if eh_2013(e) and ps > page_size_min:
                novo_ps = max(page_size_min, ps // 2)
                print(
                    "[warn] " + descricao + ": erro 2013 com ps=" + str(ps) +
                    ", reduzindo para ps=" + str(novo_ps) +
                    " (tentativa adaptativa #" + str(tentativa) + ")"
                )
                ps = novo_ps
                time.sleep(3)
            else:
                raise
