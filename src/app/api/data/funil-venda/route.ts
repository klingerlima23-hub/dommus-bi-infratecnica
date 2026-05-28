import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Funil de Venda — 5 etapas baseadas em f_venda + f_historico_etapa_processo.
 *
 * Replica a logica do Streamlit Infratecnica (dashboard.py:render_vendas_funil_de_venda).
 * Cada linha = 1 processo. Sobre uma unica cohorte filtrada por
 * processo_cadastrado_em no periodo, o front conta:
 *   - Cadastro     = todas as linhas
 *   - Pastas       = linhas com reached_pastas = 1
 *   - Aprovado IF  = linhas com reached_aprovado_if = 1
 *   - Contrato     = linhas com reached_contrato = 1
 *   - Venda        = linhas com is_venda = 1 (processo_unidade_id > 0
 *                                              AND processo_data_venda IS NOT NULL)
 *
 * `venda_contabilizado_em` e retornado apenas para exibicao na tabela
 * detalhada -- nao e' usado como driver de cohorte.
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
  CASE WHEN v.processo_unidade_id > 0 AND v.processo_data_venda IS NOT NULL THEN 1 ELSE 0 END AS is_venda,
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
