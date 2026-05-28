import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SQL = `
SELECT
    id_unidade,
    descricao_unidade,
    disponibilidade,
    descricao_disponibilidade,
    id_processo,
    data_contrato,
    nome_empreendimento,
    valor_unidade
FROM f_espelho_de_venda
`;

export async function GET() {
  try {
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/estoque]', err);
    return NextResponse.json({ error: 'Erro ao carregar Estoque.' }, { status: 500 });
  }
}
