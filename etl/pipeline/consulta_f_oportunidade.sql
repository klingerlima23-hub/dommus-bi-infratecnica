-- dw_infratecnica.f_oportunidade --
SELECT distinct
    O.criado_em AS 'data_cadastro',
    TRIM(UPPER(E.nome)) AS 'nome_primeiro_envolvido',
    TRIM(UPPER(E.email)) AS 'email_primeiro_envolvido',
    CASE
    -- Telefones válidos com 11 dígitos (DDD + 9 + 8 dígitos)
    WHEN LENGTH(REGEXP_REPLACE(E.celular, '[^0-9]', '')) >= 11 THEN
        CONCAT(
            '(', SUBSTRING(REGEXP_REPLACE(E.celular, '[^0-9]', ''), -11, 2), ') ',
            SUBSTRING(REGEXP_REPLACE(E.celular, '[^0-9]', ''), -9, 5), '-',
            SUBSTRING(REGEXP_REPLACE(E.celular, '[^0-9]', ''), -4)
        )
    -- Telefones fixos com 10 dígitos (DDD + 8)
    WHEN LENGTH(REGEXP_REPLACE(E.celular, '[^0-9]', '')) = 10 THEN
        CONCAT(
            '(', SUBSTRING(REGEXP_REPLACE(E.celular, '[^0-9]', ''), -10, 2), ') ',
            SUBSTRING(REGEXP_REPLACE(E.celular, '[^0-9]', ''), -8, 4), '-',
            SUBSTRING(REGEXP_REPLACE(E.celular, '[^0-9]', ''), -4)
        )
    -- Qualquer outro caso, retorna como está (sem formatação)
    ELSE E.celular
END AS 'telefone_primeiro_envolvido',
CASE 
    WHEN E.cpf IS NULL OR TRIM(E.cpf) = '' THEN NULL
    WHEN LENGTH(TRIM(E.cpf)) = 11 THEN
        CONCAT(
            SUBSTRING(E.cpf, 1, 3), '.', 
            SUBSTRING(E.cpf, 4, 3), '.', 
            SUBSTRING(E.cpf, 7, 3), '-', 
            SUBSTRING(E.cpf, 10, 2)
        )
    ELSE NULL
END as 'cpf_primeiro_envolvido',
    E.rg AS 'rg_primeiro_envolvido',
    E.data_nascimento AS 'dn_primeiro_envolvido',
    E.genero AS 'genero_primeiro_envolvido',
    O.id_funil AS 'id_funil',
    O.id_oportunidade AS 'id_oportunidade',
    O.id_empreendimento AS 'id_empreendimento',
    O.id_equipe_pre_atendimento AS 'id_equipe_pre_atendimento',
    O.id_gerente_pre_atendimento AS 'id_gerente_pre_atendimento',
    O.id_usuario_pre_atendimento AS 'id_usuario_pre_atendimento',
    O.id_equipe_pdv AS 'id_equipe',
    O.id_gerente_pdv AS 'id_gerente',
    O.id_usuario_atendimento AS 'id_corretor',
    O.id_status_oportunidade AS 'id_status_oportunidade',
    O.id_status_oportunidade_anterior AS 'id_status_oportunidade_anterior',
    O.diferenca_criacao_opv_atendimento AS 'sla_corretor',
    NULL AS 'data_primeiro_atendimento',
    O.atualizado_em AS 'data_atualizacao',
    O.data_transferencia AS 'data_transferencia',
    P.id AS 'id_processo',
    EW.id AS 'id_etapa_processo',
    IFNULL(O.data_venda, V.data) AS 'data_venda',
    IFNULL(V.contabilizado_em, O.data_contabilizacao) AS 'data_venda_contabilizada',
    L.id_campanha as 'id_campanha' -- int
FROM crm_inquilino_0040.oportunidade O
    JOIN crm_inquilino_0040.lead_oportunidade LO ON LO.id_oportunidade = O.id_oportunidade 
    JOIN crm_inquilino_0040.lead L ON LO.id_lead = L.id_lead AND L.ativo = '1'
    JOIN crm_inquilino_0040.envolvido_oportunidade EO ON EO.id_oportunidade = O.id_oportunidade AND EO.ativo = '1'
    JOIN crm_inquilino_0040.envolvido E ON EO.id_envolvido = E.id_envolvido AND E.ativo = '1'
    LEFT JOIN dommus_infratecnica.tb_processo P ON P.id_oportunidade = O.id_oportunidade AND P.status = '1'
    LEFT JOIN dommus_infratecnica.tb_venda V ON V.processo = P.id AND V.situacao = 'F'
    LEFT JOIN dommus_infratecnica.tb_etapas_workflow EW ON EW.id = P.etapa_workflow AND EW.status = '1' AND EW.workflow = P.workflow
WHERE O.ativo = '1'
  AND O.criado_em between '{data_inicio}' and '{data_fim}'
GROUP BY O.id_oportunidade