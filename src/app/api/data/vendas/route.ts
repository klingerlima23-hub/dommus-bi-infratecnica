import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Camada 2 do fix de timezone: DATE_FORMAT nos DATETIMEs devolve string
// ISO 8601 SEM Z pra o JS no front interpretar como horario LOCAL (BR)
// e nao converter pra UTC (empurrando datas pro dia anterior).
// vide GUIA_DISTRATOS_FILTROS_TIMEZONE.md
const SQL = `
SELECT
    processo_id,
    processo_unidade_id,
    DATE_FORMAT(processo_data_venda,     '%Y-%m-%dT%H:%i:%s') AS processo_data_venda,
    DATE_FORMAT(processo_cadastrado_em,  '%Y-%m-%dT%H:%i:%s') AS processo_cadastrado_em,
    empreendimento_nome,
    equipe_nome,
    analise_credito_financiamento,
    unidade_valor_avaliacao,
    unidade_valor_liquido,
    DATE_FORMAT(venda_contabilizado_em,  '%Y-%m-%dT%H:%i:%s') AS venda_contabilizado_em,
    etapas_workflow_nome,
    DATE_FORMAT(lead_criado_em,          '%Y-%m-%dT%H:%i:%s') AS lead_criado_em,
    lead_campanha,
    lead_origem,
    lead_midia,
    gerente_nome,
    corretor_nome,
    tipo_negociacao
FROM f_venda
`;

export async function GET() {
  try {
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/vendas]', err);
    return NextResponse.json({ error: 'Erro ao carregar Vendas.' }, { status: 500 });
  }
}
