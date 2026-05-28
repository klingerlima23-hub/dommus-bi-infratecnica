import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Retorna o timestamp (em UTC, ISO 8601 com "Z") da ultima execucao
 * BEM-SUCEDIDA do ETL, lendo de dw_mpto.meta_etl_execucao.
 *
 * O front-end recebe esse valor e usa new Date(iso).toLocaleString('pt-BR')
 * pra converter automaticamente pro timezone do navegador do usuario.
 *
 * Se a tabela meta_etl_execucao ainda nao existe (ETL nunca rodou apos
 * a introducao da tabela) ou nao ha execucao com status='ok', retorna null.
 */
interface MetaRow {
  concluido_em: string | null;
}

const SQL = `
  SELECT DATE_FORMAT(MAX(concluido_em), '%Y-%m-%dT%H:%i:%sZ') AS concluido_em
  FROM meta_etl_execucao
  WHERE status = 'ok'
`;

export async function GET() {
  try {
    const row = await queryOne<MetaRow>(SQL);
    return NextResponse.json({ atualizado_em: row?.concluido_em ?? null });
  } catch (err) {
    // Falha silenciosa: a Sidebar tem fallback pra esconder a linha
    // se nao houver dado. Loga, mas devolve 200 com null pra nao quebrar
    // o front (a tabela pode nao existir ainda em ambientes legados).
    console.error('[/api/data/etl-status]', err);
    return NextResponse.json({ atualizado_em: null });
  }
}
