import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SQL = `
SELECT
  processo_id,
  processo_id_oportunidade,
  empreendimento_id,
  empreendimento_nome,
  data_distrato,
  motivo_distrato,
  lead_campanha,
  lead_midia,
  lead_origem
FROM f_distrato
WHERE processo_id IS NOT NULL
`;

export async function GET() {
  try {
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/distratos]', err);
    return NextResponse.json({ error: 'Erro ao carregar Distratos.' }, { status: 500 });
  }
}
