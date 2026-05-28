SELECT
	o.id_oportunidade,
    l.id_lead,
    upper(l.nome) AS nome_lead,
    lower(l.email) as email_lead,
    CASE
    -- Telefones válidos com 11 dígitos (DDD + 9 + 8 dígitos)
    WHEN LENGTH(REGEXP_REPLACE(l.telefone, '[^0-9]', '')) >= 11 THEN
        CONCAT(
            '(', SUBSTRING(REGEXP_REPLACE(l.telefone, '[^0-9]', ''), -11, 2), ') ',
            SUBSTRING(REGEXP_REPLACE(l.telefone, '[^0-9]', ''), -9, 5), '-',
            SUBSTRING(REGEXP_REPLACE(l.telefone, '[^0-9]', ''), -4)
        )
    -- Telefones fixos com 10 dígitos (DDD + 8)
    WHEN LENGTH(REGEXP_REPLACE(l.telefone, '[^0-9]', '')) = 10 THEN
        CONCAT(
            '(', SUBSTRING(REGEXP_REPLACE(l.telefone, '[^0-9]', ''), -10, 2), ') ',
            SUBSTRING(REGEXP_REPLACE(l.telefone, '[^0-9]', ''), -8, 4), '-',
            SUBSTRING(REGEXP_REPLACE(l.telefone, '[^0-9]', ''), -4)
        )
    -- Qualquer outro caso, retorna como está (sem formatação)
    ELSE l.telefone
	END AS 'telefone_lead',
    l.id_empreendimento,
    l.id_campanha,
    l.id_midia,
    l.id_origem,
    l.id_canal,
    l.criado_em AS data_cadastro,
    l.atualizado_em as data_atualizacao,
    l.informacoes_adicionais,
    o.criado_em as 'data_distribuicao'
FROM crm_inquilino_0040.lead l
join crm_inquilino_0040.lead_oportunidade as lo on lo.id_lead = l.id_lead and lo.ativo = '1'
join crm_inquilino_0040.oportunidade as o on lo.id_oportunidade = o.id_oportunidade and o.ativo = '1'
WHERE l.ativo = '1'
and o.atualizado_em between '{data_inicio}' and '{data_fim}'
group by l.id_lead,o.id_oportunidade;