# Projeto `crm_inquilino_0040_infratecnica_v1` — Infratecnica (Dommus, modelo de referência)

Documentação técnica do projeto **Infratecnica v1** — cliente Dommus #0040. Este é o **padrão arquitetural de referência** para todos os projetos Dommus que combinam ETL + dashboard web.

| | |
|---|---|
| **Versão do documento** | **1.2.0** |
| **Data de publicação** | 09/05/2026 |
| **Autor** | Klinger Lima (`klinger.lima@dommus.tec.br`) |
| **Cliente** | Dommus #0040 — Infratecnica |
| **Status** | **Padrão de referência** — modelo arquitetural para os demais inquilinos Dommus |
| **Repositório local** | `D:\Dommus\dommus_etl\crm_inquilino_0040_infratecnica_v1` |

---

## ⚡ Como usar este arquivo (HANDOFF)

Quando abrir um novo chat sobre este projeto:

1. *"Antes de qualquer coisa, lê o arquivo `D:\Dommus\dommus_etl\crm_inquilino_0040_infratecnica_v1\crm_inquilino_0040_infratecnica_v1.md` pra ficar com todo o contexto."*
2. Toda mudança nova reflita na **Seção 11 — Histórico de mudanças** + bump de versão na **Seção 13**.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Stack técnica](#2-stack-técnica)
3. [Estrutura de arquivos](#3-estrutura-de-arquivos)
4. [Banco de dados — `dw_infratecnica`](#4-banco-de-dados--dw_infratecnica)
5. [Pipeline ETL](#5-pipeline-etl)
6. [Dashboard Next.js](#6-dashboard-nextjs)
7. [Como rodar localmente](#7-como-rodar-localmente)
8. [Credenciais](#8-credenciais)
9. [Pendências e backlog](#9-pendências-e-backlog)
10. [Convenções e padrões](#10-convenções-e-padrões)
11. [Histórico de mudanças](#11-histórico-de-mudanças)
12. [Registro de solicitações de mudança (CR Log)](#12-cr-log)
13. [Histórico de versões deste documento](#13-histórico-de-versões-deste-documento)

---

## 1. Visão geral

Plataforma única que cobre **ETL** (CRM Dommus → DW próprio) + **Dashboard analítico** (Next.js 14 + Tailwind + Recharts) com login JWT.

**Páginas do dashboard** (em `src/app/dashboard/`):
- `vendas/` — Aba Vendas (KPIs + gráficos + tabela; toggle Visão Atual / Funil de Venda com 5 etapas)
- `estoque/` — Aba Estoque
- `visitas/` — Aba Visitas
- `lead/` — Aba Lead com sub-abas (Visão Geral + Funil & Investimento)

**Por que é o modelo de referência?**

- Foi o primeiro projeto Dommus a unificar ETL + dashboard em **uma única pasta** (sem dashboard separado)
- Define a estrutura `etl/pipeline/`, `src/app/`, `src/lib/`, `src/components/` que os demais devem seguir
- Define as convenções de auth (jose JWT + bcryptjs), DB pool (mysql2), filtros (URL search params), gráficos (Recharts)

---

## 2. Stack técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| ETL | Python 3.12 + SQLAlchemy + mysql-connector-python (use_pure=True) | — |
| Dashboard | Next.js | 14.2.15 (App Router) |
| UI | Tailwind CSS + Radix UI | 3.x |
| Gráficos | Recharts | 2.13.x |
| Auth (Edge) | jose (JWT) | 5.9.x |
| Auth (Node) | bcryptjs | 2.4.x |
| MySQL client | mysql2 | 3.11.x |
| Icons | lucide-react | 0.452.x |
| Banco destino | MySQL `18.209.74.87:3310/dw_infratecnica` | — |

---

## 3. Estrutura de arquivos

```
crm_inquilino_0040_infratecnica_v1/
├── crm_inquilino_0040_infratecnica_v1.md      ← este arquivo
├── README.md
├── package.json (Next.js scripts: dev/build/start)
├── tsconfig.json, tailwind.config.ts, next.config.js, postcss.config.js
│
├── etl/pipeline/                              ← ETL completo
│   ├── config.py                              ← credenciais + paths
│   ├── etl_utils.py (compartilhado)           ← engine factory, retry, paginação
│   ├── criar_dw.py + criar_dw_infratecnica.sql ← DDL
│   ├── consulta_d_*.sql (≈ 14 dimensões)
│   ├── consulta_f_*.sql (≈ 12 fatos)
│   ├── sincroniza_d_*.py + sincroniza_f_*.py
│   ├── atualiza_senha_d_usuario_gu.py         ← cria/reset usuário admin
│   └── pipeline_executa.py                    ← orquestrador (subprocess)
│
├── public/                                    ← logos Dommus
│
└── src/                                        ← Next.js
    ├── app/
    │   ├── layout.tsx, page.tsx, globals.css
    │   ├── login/                              ← tela de login
    │   ├── dashboard/                          ← hub + 4 sub-páginas
    │   │   ├── layout.tsx (sidebar logo+user+ações+footer)
    │   │   ├── page.tsx
    │   │   ├── vendas/page.tsx
    │   │   ├── estoque/page.tsx
    │   │   ├── visitas/page.tsx
    │   │   └── lead/page.tsx (sub-abas: visão geral + funil & investimento)
    │   └── api/
    │       ├── auth/login/route.ts, logout/route.ts
    │       └── data/{vendas,estoque,visitas,lead,funil,oportunidade}/route.ts
    ├── components/
    │   ├── KPI.tsx, Filters.tsx, Charts.tsx, Table.tsx
    │   └── Sidebar.tsx
    ├── lib/
    │   ├── auth.ts (jose JWT, Edge-safe)
    │   ├── passwords.ts (bcryptjs, Node-only)
    │   ├── db.ts (MySQL pool)
    │   └── filters.ts (parser de filtros via URL)
    └── middleware.ts (protege /dashboard/*, /api/data/*)
```

---

## 4. Banco de dados — `dw_infratecnica`

### Dimensões (15)

`d_cliente_dommus` (identidade visual), `d_funil`, `d_canal` (se existir), `d_midia`, `d_origem`, `d_campanha`, `d_empreendimento`, `d_fase_funil`, `d_status_funil`, `d_fase_etapa`, `d_etapa_oportunidade`, `d_equipe`, `d_corretor`, `d_gerente`, `d_usuario`, `d_usuario_gu` (auth do dashboard).

> **`d_cliente_dommus`** — tabela de UMA linha (filtrada por `tb_cliente.id = 51`). Colunas: `id_cliente_dommus`, `nome_cliente_dommus`, `logo_cliente_dommus` (URL absoluta). Consumida pela API `/api/data/cliente` para alimentar a logo da Sidebar dinamicamente. Substituiu o asset estático `public/logo/logo_infratecnica.png`.

### Fatos (12)

`f_lead`, `f_visita`, `f_oportunidade`, `f_atendimento_oportunidade`, `f_descarte`, `f_funil`, `f_investimento`, `f_unidade`, `f_espelho_de_venda`, `f_venda`, `f_evolucao_processo`, `f_historico_etapa_processo`.

### Auth

`d_usuario_gu` armazena email + hash (suporta **bcrypt + SHA-256 + SHA-512**) + `tipo_usuario`.

---

## 5. Pipeline ETL

Mesma arquitetura do `magikjc` (ver `crm_inquilino_0120_magikjc.md` para detalhes profundos):

- **TRUNCATE + FULL LOAD** com keyset pagination
- **Mitigação 6 camadas contra erro 2013** (driver puro, SESSION_INIT, pool_recycle, retry com backoff, page-size adaptativa, guard Python 3.12)
- **Pipeline orquestrador** roda cada `sincroniza_*.py` como subprocess isolado

**Comando completo:**
```powershell
cd D:\Dommus\dommus_etl\crm_inquilino_0040_infratecnica_v1\etl\pipeline
py -3.12 pipeline_executa.py
```

---

## 6. Dashboard Next.js

### 6.1. Auth

- `middleware.ts` valida o cookie `infratecnica_session` (jose) em `/dashboard/*` e `/api/data/*`
- `/api/auth/login` autentica contra `d_usuario_gu` com bcryptjs (também aceita SHA-256/SHA-512 legado)
- Cookie httpOnly + secure (em prod), 24h
- **Gate de loading** entre login e dashboard (UX premium)

### 6.2. Sidebar

Logo Dommus → bloco do usuário (nome/email/tipo) → ações (Sair) → footer (copyright). Toggle de tema discreto.

### 6.3. Aba Vendas (referência de padrão UI)

- Sub-menu acima dos filtros que filtra os cards
- Filtros de data (default: mês atual)
- **Toggle "Visão Atual / Funil de Venda"** — alterna entre snapshot atual e funil com 5 etapas hardcoded (Cadastro/Pasta/Venda baseado em `d_fase_etapa`)
- Stacked bar Corretor/Equipe/Empreendimento por Etapa
- Gráfico período com eixo X exato (sem horário)
- Legenda horizontal centralizada com fonte menor

### 6.4. Aba Lead (sub-abas)

- **Visão Geral** — KPIs e gráficos
- **Funil & Investimento** — sub-aba avançada
  - Cards 6-em-uma-linha (altura uniforme 8.5rem via CSS)
  - Filtros adicionais (Etapa Funil)
  - Card "Leads Perdidos"
  - Toggle exibir/ocultar legenda de "Etapas agregadas"
  - Tabela detalhe abaixo dos gráficos
  - JOINs por `d_usuario` (não mais `d_corretor`/`d_gerente`)
  - Funil consistente com cards (UNION transições + etapa atual)

---

## 7. Como rodar localmente

```powershell
# ETL
cd D:\Dommus\dommus_etl\crm_inquilino_0040_infratecnica_v1
py -3.12 -m pip install sqlalchemy mysql-connector-python pandas
py -3.12 etl\pipeline\pipeline_executa.py

# Dashboard (após renomeação do v002 → v1, apagar .next se existir antes)
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
# (porta default Next.js: 3000)
```

---

## 8. Credenciais

| Recurso | Onde está |
|---|---|
| MySQL `dw_infratecnica` | `etl/pipeline/config.py` (mesmo padrão dos demais Dommus) |
| Origem CRM `dommus_infratecnica` | idem |
| JWT_SECRET | `.env.local` (criar a partir de `.env.local.example` se existir) |

> Padrão de email/assinatura para projetos Dommus: **`klinger.lima@dommus.tec.br`**

---

## 9. Pendências e backlog

| # | Item | Prioridade |
|---|---|---|
| **A** | Apagar `.next/` (cache do build com paths antigos `_v002`) antes do próximo `npm run dev` | Baixa (auto-resolve no primeiro build) |
| **B** | Atualizar campo `name` no `package.json` de `crm-inquilino-0040-infratecnica-v002` para `crm-inquilino-0040-infratecnica-v1` | Baixa |
| **C** | Validar smoke-test pós renomeio (login + dashboard + API) | Média |

---

## 10. Convenções e padrões

### 10.1. Identidade

- Cliente Dommus → **`klinger.lima@dommus.tec.br`**
- Doc tem nome igual ao diretório (`crm_inquilino_0040_infratecnica_v1.md`)

### 10.2. Versionamento de pasta (padrão Dommus)

`_v1` (sem zero-padding). Padronizado em 09/05/2026 a partir do `_v002`/`_v0001` legado.

### 10.3. Versionamento do doc (SemVer)

`MAJOR.MINOR.PATCH` — ver Seção 13.

### 10.4. Guard universal de Python 3.12 nos scripts ETL

Todo script `.py` em `etl/pipeline/` deve ter, no topo (após docstring e `from __future__` se houver, antes de qualquer outro `import`), o seguinte bloco:

```python
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
```

Justificativa: o ETL roda em servidor local agendado; o alias `python` pode resolver pra versão errada (sem `pandas`/`sqlalchemy`). O guard re-executa sob 3.12 antes de qualquer import pesado.

### 10.5. Tipos de coluna ao criar nova dimensão/fato

Ao criar nova tabela no DW, **consultar os tipos anotados na consulta de origem** (comentários `-- int`, `-- varchar(255)`, etc) e refletir fielmente na DDL. Exemplo: `c.id as id_cliente_dommus, -- int` → `INT NULL` na DDL.

---

## 11. Histórico de mudanças

### Genesis (anterior a 05/2026)

- Setup completo Next.js 14 + Tailwind ([#126])
- Lib de DB (MySQL pool) + SQL loader + auth (bcrypt + JWT) ([#127])
- Login page + API `/api/auth/login` ([#128])
- Dashboard layout (sidebar logo+user+ações + tabs nav) ([#129])
- Component library: KPI, BarChart, LineChart, HBar, Table, Filters ([#130])
- Aba Vendas (KPIs + gráficos + tabela) ([#131])
- Aba Estoque ([#132])
- Aba Visitas ([#133])
- Aba Lead com sub-abas (Visão Geral + Funil & Investimento) ([#134])
- ETL completo migrado pra `etl/pipeline/` ([#140])
- Aba Vendas: toggle Visão Atual/Funil de Venda + 5 etapas ([#141])
- d_usuario_gu para autenticação + tipo_usuario ([#145])
- Auth: suporte a SHA-256 e SHA-512 (legado) ([#110])

### 09/05/2026 — Padronização

- ✅ Renomeada pasta `_v002` → `_v1` (padrão Dommus)
- ✅ Publicada esta documentação inicial

### 09/05/2026 — Guard universal de Python 3.12

- ✅ **Todos os 34 scripts `.py`** em `etl/pipeline/` agora têm o **guard de Python 3.12** no topo (após docstring/`from __future__`, antes de qualquer outro import). Se invocados com `python` resolvendo para outra versão (3.14, 3.11, etc), o guard re-executa o próprio script sob `py -3.12`.
- ✅ **Justificativa:** o projeto será desplegado em servidor local onde o ETL rodará agendado, e `python` no PATH pode resolver para versão errada (sem `pandas`, `sqlalchemy`, etc instalados). Guard garante reprodutibilidade independente do alias usado.
- ✅ Migração feita por script idempotente (`add_guard.py`) — pode rodar de novo sem efeitos colaterais.
- ✅ Validação: `python -m py_compile` em todos os 34 arquivos passou.
- ✅ Inserido como pattern nos novos scripts: **toda nova ferramenta Python deste projeto deve ter o guard**.

### 09/05/2026 — Logo dinâmica via `d_cliente_dommus`

- ✅ Nova dimensão **`d_cliente_dommus`** no DW (DDL em `criar_dw_infratecnica.sql`).
- ✅ Novo SQL de origem **`consulta_d_cliente_dommus.sql`** (filtra `tb_cliente.id = 51`).
- ✅ Novo script ETL **`sincroniza_d_cliente_dommus.py`** (TRUNCATE+INSERT direto, sem keyset/data).
- ✅ Etapa adicionada como **primeira dimensão** no orquestrador `etl_inquilino_0040_infratecnica_executa_pipeline.py`.
- ✅ Nova rota **`/api/data/cliente`** (`src/app/api/data/cliente/route.ts`) protegida pelo middleware.
- ✅ Sidebar agora consome a logo dinamicamente do DW (não usa mais `public/logo/logo_infratecnica.png`).
- ✅ Adaptação de schema legado de `d_usuario_gu` na rota de login (`emails_usario` → `email`, `id_usuario` → `id_usuario_gu`).
- ✅ Criado utilitário `atualiza_senha_d_usuario_gu.py` (gera bcrypt compatível com bcryptjs).
- ✅ Criado `diagnostico_d_usuario_gu.py` para inspecionar o schema real da tabela.

---

## 12. CR Log

Esta seção mensura a carga de manutenção solicitada pelo cliente Infratecnica.

| Indicador | Valor |
|---|---|
| Total de CRs atendidas | A levantar |
| Última CR atendida | A levantar |

| # | Data | Solicitante | Descrição resumida | Versão doc | Status |
|---|---|---|---|---|---|
| 01–N | (legado) | Vários | Resgatar do histórico de Git/WhatsApp/e-mail conforme houver tempo. | — | ✅ aplicada |

---

## 13. Histórico de versões deste documento

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| **1.0.0** | 09/05/2026 | Klinger Lima | Publicação inicial. Cobre todo o estado atual do projeto pós-renomeio `_v002` → `_v1`. Estabelece este projeto como modelo de referência arquitetural para os demais inquilinos Dommus que adotarão ETL + dashboard unificados. |
| **1.1.0** | 09/05/2026 | Klinger Lima | Adicionada dimensão **`d_cliente_dommus`** (identidade visual do cliente) e endpoint `/api/data/cliente`. Sidebar passa a consumir a logo dinamicamente do DW, dispensando o asset estático `public/logo/logo_infratecnica.png`. Adaptação de schema legado em `d_usuario_gu` na rota de login. Novos utilitários: `atualiza_senha_d_usuario_gu.py` e `diagnostico_d_usuario_gu.py`. |
| **1.2.0** | 09/05/2026 | Klinger Lima | **Guard universal de Python 3.12**: todos os 34 scripts `.py` em `etl/pipeline/` agora re-executam sob `py -3.12` quando invocados em outra versão. Necessário para deploy do ETL em servidor local com múltiplas versões de Python. Adicionada Seção 10.4 (regra) e Seção 10.5 (tipos de coluna a partir da consulta de origem). |

---

**Última atualização:** 09/05/2026 (v1.2.0)
**Mantido por:** Klinger Lima (`klinger.lima@dommus.tec.br`) — Dommus
