# BI Comercial Infratecnica — v002

Réplica moderna do dashboard Streamlit (`crm_inquilino_0040_infratecnica`) em **Next.js + TypeScript + Tailwind + Recharts**.

A lógica de negócio (KPIs, gráficos, filtros) é idêntica ao v001 — só a camada de apresentação foi modernizada.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui patterns
- Recharts para visualizações
- mysql2 (pool) ligando direto no DW `dw_infratecnica`
- bcryptjs + jose (JWT em cookie httpOnly) para auth contra `d_usuario_gu`

## Estrutura

```
src/
├── app/
│   ├── login/                  # Tela de login
│   ├── dashboard/
│   │   ├── layout.tsx          # Sidebar + tabs nav (auth gate aqui)
│   │   ├── vendas/             # Aba Vendas
│   │   ├── estoque/            # Aba Estoque
│   │   ├── visitas/            # Aba Visitas
│   │   └── lead/               # Aba Lead com sub-abas
│   ├── api/
│   │   ├── auth/{login,logout}/
│   │   └── data/{vendas,estoque,visitas,oportunidade,funil}/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── kpi/KPICard.tsx
│   ├── charts/{BarChart,HBarChart,StackedHBarChart,PeriodChart,PieChart,FunnelChart,ChartCard}.tsx
│   ├── filters/{DateRangeFilter,SelectFilter,MultiSelectFilter,RadioGroup}.tsx
│   ├── tables/DataTable.tsx
│   └── layout/{Sidebar,TabNav,SectionTitle}.tsx
├── lib/
│   ├── db.ts                   # Pool MySQL singleton
│   ├── auth.ts                 # bcrypt/SHA-512/SHA-256/MD5 + JWT
│   ├── format.ts               # fmtInt, fmtMoeda, fmtPct, bucketDate, groupByCount/Sum
│   ├── paleta.ts               # Cores Dommus
│   ├── utils.ts                # cn() helper
│   └── sql.ts                  # Loader de arquivos .sql (não usado na v002 inicial)
├── middleware.ts               # Protege /dashboard/* e /api/data/*
└── public/logo/logo_infratecnica.png
```

## Setup local

```bash
npm install
cp .env.example .env.local
# editar .env.local com as credenciais reais
npm run dev
```

A app sobe em http://localhost:3000.

### Variáveis de ambiente

```env
DB_HOST=18.209.74.87
DB_PORT=3310
DB_USER=klinger.lima
DB_PASSWORD=*****
DB_DATABASE=dw_infratecnica
JWT_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/5531999999999
```

## Deploy na Vercel

1. Importe o repo na Vercel
2. Configure as env vars acima em **Project → Settings → Environment Variables**
3. Deploy automático a cada push em `main`

⚠ **Atenção:** o MySQL DW (`18.209.74.87:3310`) precisa aceitar conexões dos IPs de egress da Vercel. Veja https://vercel.com/docs/concepts/edge-network/regions para a lista atualizada de IPs e libere no Security Group AWS.

### Cold start

Vercel é serverless — cada cold start cria conexão nova com MySQL. O `mysql2` pool guarda no `globalThis` para reuso dentro da função. Não é zero-overhead mas é aceitável para dashboard interno.

## Equivalência v001 → v002

| Streamlit (v001) | Next.js (v002) |
|---|---|
| `tela_login()` | `src/app/login/page.tsx` + `/api/auth/login` |
| `_verificar_credenciais()` | `verifyPassword()` em `lib/auth.ts` |
| `_render_user_info_sidebar()` | `components/layout/Sidebar.tsx` |
| `st.tabs()` | `components/layout/TabNav.tsx` |
| `card()` (HTML inline) | `components/kpi/KPICard.tsx` |
| `grafico_dimensao_stacked_etapa()` | `StackedHBarChart` |
| `grafico_periodo()` | `PeriodChart` (ComposedChart) |
| `grafico_por_dimensao()` | `HBarChart` |
| `carregar_f_*()` | `/api/data/*` (route handlers) |
| `filtrar_por_metrica()` | `aplicarMetrica()` em `vendas/page.tsx` |
| `CASE_MAP_FASE` (Funil) | `CASE_MAP_FASE` em `_FunilInvestimento.tsx` |

## Status

- ✅ Auth + middleware
- ✅ Layout dashboard (sidebar + tabs + FAB)
- ✅ Aba Vendas (KPIs + 7 gráficos + tabela)
- ✅ Aba Estoque (4 KPIs + pie + hbar + tabela)
- ✅ Aba Visitas (2 KPIs + pies + hbars + tabela)
- ✅ Aba Lead Visão Geral (6 KPIs + 4 gráficos + tabela)
- ✅ Aba Lead Funil & Investimento (6 KPIs + funil + tabela origem + 4 dimensões + tabela detalhe)

## Próximos passos

- [ ] `npm install && npm run build` localmente para validar
- [ ] Configurar env vars na Vercel e fazer 1º deploy
- [ ] Liberar IPs Vercel no Security Group MySQL
- [ ] (Opcional) Domínio custom em `Vercel → Domains` (ex: `bi.dommus.com.br`)
- [ ] Comparar lado-a-lado com v001 e ajustar diferenças visuais sutis
