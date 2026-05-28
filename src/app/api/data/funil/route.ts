import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SQL_FUNIL = `
SELECT
    f.id_oportunidade,
    f.id_etapa_origem,
    f.id_etapa_destino,
    f.id_etapa_atual,
    f.id_etapa_funil,
    ef.nome_etapa_funil,
    ef.ordem_etapa_funil,
    f.data_lead,
    f.id_campanha,
    cmp.nome_campanha,
    f.id_origem,
    org.nome_origem,
    f.id_midia,
    m.nome_midia,
    f.id_gerente_pdv,
    g.nome_gerente,
    f.id_equipe_pdv,
    eq.nome_equipe,
    f.id_corretor,
    c.nome_corretor,
    f.id_processo,
    f.id_empreendimento,
    e.nome_empreendimento
FROM f_funil f
LEFT JOIN d_etapa_funil    ef  ON f.id_etapa_funil    = ef.id_etapa_funil
LEFT JOIN d_midia          m   ON f.id_midia          = m.id_midia
LEFT JOIN d_origem         org ON f.id_origem         = org.id_origem
LEFT JOIN d_campanha       cmp ON f.id_campanha       = cmp.id_campanha
LEFT JOIN d_empreendimento e   ON f.id_empreendimento = e.id_empreendimento
LEFT JOIN d_corretor       c   ON f.id_corretor       = c.id_corretor
LEFT JOIN d_gerente        g   ON f.id_gerente_pdv    = g.id_gerente
LEFT JOIN d_equipe         eq  ON f.id_equipe_pdv     = eq.id_equipe
`;

const SQL_INVESTIMENTO = `
SELECT
    i.id_midia_custo,
    i.valor_investimento,
    i.id_midia,
    m.nome_midia,
    i.id_campanha,
    i.id_empreendimento,
    e.nome_empreendimento,
    i.data_investimento
FROM f_investimento i
LEFT JOIN d_midia          m ON i.id_midia          = m.id_midia
LEFT JOIN d_empreendimento e ON i.id_empreendimento = e.id_empreendimento
`;

export async function GET() {
  try {
    const [funil, investimento] = await Promise.all([query(SQL_FUNIL), query(SQL_INVESTIMENTO)]);
    return NextResponse.json({ funil, investimento });
  } catch (err) {
    console.error('[/api/data/funil]', err);
    return NextResponse.json({ error: 'Erro ao carregar Funil & Investimento.' }, { status: 500 });
  }
}
