import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Camada 2 do fix de timezone: DATE_FORMAT defensivo nas datas pra
// devolver ISO 8601 SEM Z (vide GUIA_DISTRATOS_FILTROS_TIMEZONE.md).
const SQL = `
SELECT * FROM (
    SELECT
        v.id_oportunidade,
        criador.nome_corretor AS criou_visita,
        responsavel.nome_corretor AS responsavel_visita,
        concluiu.nome_corretor AS concluiu_visita,
        DATE_FORMAT(v.data_cadastro,          '%Y-%m-%dT%H:%i:%s') AS data_cadastro,
        DATE_FORMAT(v.data_visita,            '%Y-%m-%dT%H:%i:%s') AS data_visita,
        DATE_FORMAT(v.data_conclusao_visita,  '%Y-%m-%dT%H:%i:%s') AS data_conclusao_visita,
        v.local_visita,
        v.visita_realizada,
        v.tipo_visita,
        e.nome_empreendimento,
        -- Uma linha por OPV (id_oportunidade). Se houver multiplos
        -- cadastros pra mesma oportunidade (remarcacoes, reagendamentos,
        -- etc.), mantem somente o mais RECENTE por data_cadastro.
        -- Empate em data_cadastro: prioriza visita realizada e depois
        -- data_visita mais recente.
        ROW_NUMBER() OVER (
            PARTITION BY v.id_oportunidade
            ORDER BY
                v.data_cadastro DESC,
                CASE WHEN v.visita_realizada = 'Sim' THEN 1 ELSE 2 END,
                v.data_visita DESC
        ) AS rn
    FROM f_visita v
    -- Dedupe de d_corretor nos 3 JOINs. Corretor em N equipes duplica
    -- linhas -- em serie, a multiplicacao vira cubica (ate N^3 vezes).
    LEFT JOIN (
      SELECT id_corretor, MAX(nome_corretor) AS nome_corretor
      FROM d_corretor WHERE id_corretor IS NOT NULL GROUP BY id_corretor
    ) criador     ON v.id_criador_visita     = criador.id_corretor
    LEFT JOIN (
      SELECT id_corretor, MAX(nome_corretor) AS nome_corretor
      FROM d_corretor WHERE id_corretor IS NOT NULL GROUP BY id_corretor
    ) responsavel ON v.id_responsavel_visita = responsavel.id_corretor
    LEFT JOIN (
      SELECT id_corretor, MAX(nome_corretor) AS nome_corretor
      FROM d_corretor WHERE id_corretor IS NOT NULL GROUP BY id_corretor
    ) concluiu    ON v.id_concluiu_visita    = concluiu.id_corretor
    LEFT JOIN d_empreendimento e     ON v.id_empreendimento     = e.id_empreendimento
) t
WHERE rn = 1
ORDER BY data_visita DESC
`;

export async function GET() {
  try {
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/visitas]', err);
    return NextResponse.json({ error: 'Erro ao carregar Visitas.' }, { status: 500 });
  }
}
