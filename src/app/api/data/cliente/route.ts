import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ClienteRow {
  id_cliente_dommus: number;
  nome_cliente_dommus: string | null;
  logo_cliente_dommus: string | null;
}

const SQL = `
  SELECT id_cliente_dommus, nome_cliente_dommus, logo_cliente_dommus
  FROM d_cliente_dommus
  LIMIT 1
`;

export async function GET() {
  try {
    const row = await queryOne<ClienteRow>(SQL);
    if (!row) {
      return NextResponse.json(
        { error: 'Cliente nao encontrado em d_cliente_dommus.' },
        { status: 404 },
      );
    }
    return NextResponse.json({
      id: row.id_cliente_dommus,
      nome: row.nome_cliente_dommus ?? '',
      logo: row.logo_cliente_dommus ?? '',
    });
  } catch (err) {
    console.error('[/api/data/cliente]', err);
    return NextResponse.json({ error: 'Erro ao carregar cliente.' }, { status: 500 });
  }
}
