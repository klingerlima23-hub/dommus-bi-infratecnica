import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Ranking de Vendas -- uma linha por processo de venda elegivel.
 *
 * JOIN deduplicado com d_corretor: a consulta_d_corretor tem
 * GROUP BY id_corretor, eq.id, ou seja, um corretor que esta em N
 * equipes aparece N vezes na tabela. Sem dedupe, cada venda seria
 * multiplicada por N. A subquery agrupa por id_corretor_rk (SG.id) e
 * pega MAX(nome_corretor) / MAX(url_foto_perfil) -- como sao iguais
 * para o mesmo SG.id, o MAX e' deterministico e barato.
 *
 * LEFT JOIN por seguranca (se nao casar, cai no corretor_nome de
 * f_venda + iniciais como fallback no front).
 *
 * O front agrupa por id_corretor e calcula VGV total / qtd vendas /
 * ticket medio. O filtro de periodo pode usar processo_data_venda
 * OU venda_contabilizado_em (toggle na UI).
 */
const SQL = `
SELECT
  v.processo_id,
  v.id_corretor,
  COALESCE(d.nome_corretor, v.corretor_nome)       AS corretor_nome,
  d.url_foto_perfil                                AS url_foto_perfil,
  v.id_gerente,
  v.gerente_nome,
  v.id_equipe,
  v.equipe_nome,
  v.empreendimento_nome,
  v.unidade_descricao,
  v.processo_cadastrado_em,
  v.processo_data_venda,
  v.venda_data,
  v.venda_contabilizado_em,
  v.etapas_workflow_nome                           AS etapa_atual,
  v.lead_origem,
  v.lead_campanha,
  v.lead_midia,
  v.unidade_valor,
  v.unidade_valor_liquido,
  v.processo_unidade_id
FROM f_venda v
LEFT JOIN (
  SELECT
    id_corretor_rk,
    MAX(nome_corretor)   AS nome_corretor,
    MAX(url_foto_perfil) AS url_foto_perfil
  FROM d_corretor
  WHERE id_corretor_rk IS NOT NULL
  GROUP BY id_corretor_rk
) d ON d.id_corretor_rk = v.id_corretor
WHERE v.id_corretor IS NOT NULL
  AND (v.processo_data_venda IS NOT NULL OR v.venda_contabilizado_em IS NOT NULL)
`;

// Diagnostico: aceita ?debug=1 e retorna contagens em cada nivel de
// filtragem -- assim conseguimos ver SEM precisar acessar o DW direto
// onde o dataset esta sumindo (sem dados? sem id_corretor? sem datas?).
const SQL_DEBUG = `
SELECT
  (SELECT COUNT(*) FROM f_venda)                                                                                  AS total_f_venda,
  (SELECT COUNT(*) FROM f_venda WHERE id_corretor IS NOT NULL)                                                    AS com_id_corretor,
  (SELECT COUNT(*) FROM f_venda WHERE venda_contabilizado_em IS NOT NULL)                                         AS com_contabilizado,
  (SELECT COUNT(*) FROM f_venda WHERE processo_data_venda IS NOT NULL)                                            AS com_processo_data_venda,
  (SELECT COUNT(*) FROM f_venda WHERE venda_data IS NOT NULL)                                                     AS com_venda_data,
  (SELECT COUNT(*) FROM f_venda WHERE id_corretor IS NOT NULL AND venda_contabilizado_em IS NOT NULL)             AS com_id_e_contab,
  (SELECT COUNT(*) FROM f_venda WHERE id_corretor IS NOT NULL AND (processo_data_venda IS NOT NULL OR venda_contabilizado_em IS NOT NULL)) AS passa_where,
  (SELECT COUNT(*) FROM d_corretor)                                                                               AS total_d_corretor,
  (SELECT COUNT(*) FROM d_corretor WHERE id_corretor_rk IS NOT NULL)                                              AS d_corretor_com_rk
`;

export async function GET(req: Request) {
  const debug = new URL(req.url).searchParams.get('debug') === '1';
  try {
    if (debug) {
      const meta = await query(SQL_DEBUG);
      const sample = await query(
        'SELECT processo_id, id_gerente, id_corretor, id_equipe, corretor_nome, gerente_nome, equipe_nome FROM f_venda WHERE venda_contabilizado_em IS NOT NULL ORDER BY venda_contabilizado_em DESC LIMIT 5',
      );
      // DESCRIBE pra confirmar quais colunas REALMENTE existem na f_venda atual
      const cols = await query('SHOW COLUMNS FROM f_venda LIKE "%corretor%"');
      // Sample do d_corretor pra ver os tipos
      const dc = await query('SELECT id_corretor, id_corretor_rk, nome_corretor FROM d_corretor WHERE id_corretor_rk IS NOT NULL LIMIT 3');
      return NextResponse.json({ meta: meta[0], sample, cols, dc });
    }
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/ranking-vendas]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
