import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Funil de Venda — 5 etapas baseadas em f_venda + f_historico_etapa_processo.
 *
 * Retorna 1 linha por processo, com flags booleanas indicando se o processo
 * ja passou pelas etapas-chave em algum momento (EXISTS contra f_historico_etapa_processo).
 *
 * Venda contabilizada: usa a coluna `venda_contabilizado_em` da propria
 * tabela f_venda (populada pelo ETL via tb_venda.contabilizado_em do CRM).
 * E' o sinal real de venda contabilizada -- nao precisamos inferir por
 * processo_unidade_id como o codigo legado tentava fazer.
 *
 * O collation utf8mb4_unicode_ci e case+accent-insensitive, entao os LIKE
 * abaixo casam variacoes como "INSTITUICAO" vs "INSTITUIÇÃO" e a digitacao
 * "FICHA CADASTARL" (typo na origem) automaticamente.
 */
const SQL = `
SELECT
  v.processo_id                       AS id_processo,
  v.processo_cadastrado_em,
  v.empreendimento_nome,
  v.equipe_nome,
  v.gerente_nome,
  v.corretor_nome,
  v.lead_campanha,
  v.lead_origem,
  v.lead_midia,
  v.analise_credito_financiamento,
  v.unidade_valor_liquido,
  v.processo_data_venda,
  v.processo_unidade_id,
  v.venda_contabilizado_em,
  v.etapas_workflow_nome              AS etapa_atual,
  CASE WHEN v.venda_contabilizado_em IS NOT NULL THEN 1 ELSE 0 END AS is_venda,
  CASE WHEN EXISTS (
    SELECT 1 FROM f_historico_etapa_processo h
    WHERE h.id_processo = v.processo_id
      AND h.etapa_workflow_atual LIKE '%ficha cadast%completa%'
  ) THEN 1 ELSE 0 END AS reached_pastas,
  CASE WHEN EXISTS (
    SELECT 1 FROM f_historico_etapa_processo h
    WHERE h.id_processo = v.processo_id
      AND h.etapa_workflow_atual LIKE 'aprovado pela institui%financeira%'
  ) THEN 1 ELSE 0 END AS reached_aprovado_if,
  CASE WHEN EXISTS (
    SELECT 1 FROM f_historico_etapa_processo h
    WHERE h.id_processo = v.processo_id
      AND h.etapa_workflow_atual LIKE '%contrato%compra%venda%gerado%'
  ) THEN 1 ELSE 0 END AS reached_contrato
FROM f_venda v
`;

export async function GET() {
  try {
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/funil-venda]', err);
    return NextResponse.json({ error: 'Erro ao carregar Funil de Venda.' }, { status: 500 });
  }
}
