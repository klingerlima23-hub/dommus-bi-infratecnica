import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SQL = `
SELECT * FROM (
    SELECT
        v.id_oportunidade,
        criador.nome_corretor AS criou_visita,
        responsavel.nome_corretor AS responsavel_visita,
        concluiu.nome_corretor AS concluiu_visita,
        v.data_cadastro,
        v.data_visita,
        v.data_conclusao_visita,
        v.local_visita,
        v.visita_realizada,
        v.tipo_visita,
        e.nome_empreendimento,
        ROW_NUMBER() OVER (
            PARTITION BY v.id_oportunidade, DATE(v.data_visita)
            ORDER BY
                CASE WHEN v.visita_realizada = 'Sim' THEN 1 ELSE 2 END,
                v.data_visita DESC
        ) AS rn
    FROM f_visita v
    LEFT JOIN d_corretor criador     ON v.id_criador_visita     = criador.id_corretor
    LEFT JOIN d_corretor responsavel ON v.id_responsavel_visita = responsavel.id_corretor
    LEFT JOIN d_corretor concluiu    ON v.id_concluiu_visita    = concluiu.id_corretor
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
