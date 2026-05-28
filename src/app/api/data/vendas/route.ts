import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SQL = `
SELECT
    processo_id,
    processo_unidade_id,
    processo_data_venda,
    processo_cadastrado_em,
    empreendimento_nome,
    equipe_nome,
    analise_credito_financiamento,
    unidade_valor_avaliacao,
    unidade_valor_liquido,
    venda_contabilizado_em,
    etapas_workflow_nome,
    lead_criado_em,
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
