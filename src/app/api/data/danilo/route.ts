import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Dashboard Danilo -- oportunidades do funil id=9 (contratos comercial).
 *
 * Restrito a id_funil = 9 conforme regra de negocio. Enriquece com nome
 * de empreendimento, gerente, corretor e etapa via JOINs nas dimensoes
 * ja existentes no DW. NAO cria tabela nova -- so' consulta.
 *
 * DATE_FORMAT nas datas: camada 2 do fix de timezone (evita conversao
 * UTC->BR no driver mysql2 devolvendo eventos no mes errado).
 */
// LEFT JOIN com f_oportunidade_interesse pra trazer os campos derivados
// do JSON dados_dinamicos (valor_estimado / valor_real / tipo_mercado /
// tipo_segmento). Uma oportunidade tipicamente tem 1 interesse, mas a
// tabela e' um-para-muitos -- em caso de multiplos registros pra mesma
// oportunidade, o LEFT JOIN pega o mais recente por id (MAX subquery).
const SQL = `
SELECT
    o.id_oportunidade,
    o.id_funil,
    o.nome_primeiro_envolvido               AS lead_nome,
    o.email_primeiro_envolvido              AS lead_email,
    o.telefone_primeiro_envolvido           AS lead_telefone,
    o.id_empreendimento,
    e.nome_empreendimento,
    o.id_gerente,
    g.nome_gerente,
    o.id_corretor,
    c.nome_corretor,
    o.id_equipe,
    o.id_status_oportunidade,
    etp.nome                                AS status_oportunidade,
    etp.ordem                               AS ordem_status,
    o.id_processo,
    o.id_campanha,
    cmp.nome_campanha,
    DATE_FORMAT(o.data_cadastro,           '%Y-%m-%dT%H:%i:%s') AS data_cadastro,
    DATE_FORMAT(o.data_atualizacao,        '%Y-%m-%dT%H:%i:%s') AS data_atualizacao,
    DATE_FORMAT(o.data_primeiro_atendimento,'%Y-%m-%dT%H:%i:%s') AS data_primeiro_atendimento,
    DATE_FORMAT(o.data_venda,              '%Y-%m-%dT%H:%i:%s') AS data_venda,
    DATE_FORMAT(o.data_venda_contabilizada,'%Y-%m-%dT%H:%i:%s') AS data_venda_contabilizada,
    DATEDIFF(NOW(), o.data_atualizacao)     AS dias_sem_atualizacao,
    oi.valor_estimado,
    oi.valor_real,
    oi.tipo_mercado,
    oi.tipo_segmento
FROM f_oportunidade AS o
LEFT JOIN d_empreendimento e       ON o.id_empreendimento         = e.id_empreendimento
LEFT JOIN d_gerente g              ON o.id_gerente                = g.id_gerente
LEFT JOIN d_corretor c             ON o.id_corretor               = c.id_corretor
LEFT JOIN d_etapa_oportunidade etp ON o.id_status_oportunidade    = etp.id_status_oportunidade
LEFT JOIN d_campanha cmp           ON o.id_campanha               = cmp.id_campanha
LEFT JOIN (
    SELECT oi_inner.*
    FROM f_oportunidade_interesse oi_inner
    INNER JOIN (
        SELECT id_oportunidade, MAX(id_oportunidade_interesse) AS max_id
        FROM f_oportunidade_interesse
        GROUP BY id_oportunidade
    ) latest
      ON latest.id_oportunidade = oi_inner.id_oportunidade
     AND latest.max_id          = oi_inner.id_oportunidade_interesse
) oi ON oi.id_oportunidade = o.id_oportunidade
WHERE o.id_funil = 9
ORDER BY o.data_atualizacao DESC
`;

export async function GET() {
  try {
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/danilo]', err);
    return NextResponse.json({ error: 'Erro ao carregar dashboard Danilo.' }, { status: 500 });
  }
}
