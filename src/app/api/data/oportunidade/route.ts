import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// JOIN direto com d_campanha via f_oportunidade.id_campanha.
// (No modelo Infratecnica, id_campanha foi denormalizado para f_oportunidade
// pelo ETL -- nao precisamos passar por f_lead como no BNR.)
// Camada 2 do fix de timezone: forca DATETIMEs como string ISO 8601
// SEM sufixo Z. O JS no front faz new Date() e interpreta como horario
// LOCAL -- nao ha conversao UTC<->BR. Vide GUIA_DISTRATOS_FILTROS_TIMEZONE.md.
const SQL = `
SELECT
    o.id_oportunidade,
    DATE_FORMAT(o.data_cadastro,           '%Y-%m-%dT%H:%i:%s') AS data_distribuicao,
    o.nome_primeiro_envolvido AS lead_nome,
    o.email_primeiro_envolvido AS lead_email,
    o.telefone_primeiro_envolvido AS lead_telefone,
    o.id_equipe_pre_atendimento,
    e.nome_empreendimento,
    g.nome_gerente,
    c.nome_corretor,
    etp.ordem AS ordem_status_oportunidade,
    etp.nome AS status_oportunidade,
    o.id_processo,
    DATE_FORMAT(o.data_venda,              '%Y-%m-%dT%H:%i:%s') AS data_venda,
    DATE_FORMAT(o.data_venda_contabilizada,'%Y-%m-%dT%H:%i:%s') AS data_venda_contabilizada,
    o.id_campanha,
    cmp.nome_campanha
FROM f_oportunidade AS o
LEFT JOIN d_empreendimento e ON o.id_empreendimento = e.id_empreendimento
LEFT JOIN d_gerente g ON o.id_gerente = g.id_gerente
LEFT JOIN d_corretor c ON o.id_corretor = c.id_corretor
LEFT JOIN d_etapa_oportunidade etp ON o.id_status_oportunidade = etp.id_status_oportunidade
LEFT JOIN d_campanha cmp ON o.id_campanha = cmp.id_campanha
ORDER BY o.id_oportunidade
`;

export async function GET() {
  try {
    const rows = await query(SQL);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error('[/api/data/oportunidade]', err);
    return NextResponse.json({ error: 'Erro ao carregar Oportunidades.' }, { status: 500 });
  }
}
