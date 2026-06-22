-- dw_infratecnica.d_corretor --
SELECT
	CAST(RI.json_externo AS UNSIGNED) AS 'id_corretor',
	SG.id                             AS 'id_corretor_rk', -- int
	eq.id as 'id_equipe',
	TU.descricao AS 'tipo_corretor',
	upper(SG.nome) AS 'nome_corretor',
	lower(SG.email) AS 'email_corretor',
	IF(SG.ativo='0','INATIVO','ATIVO') AS 'situacao_corretor',
		CASE
	    WHEN US.cpf IS NULL THEN NULL
	    WHEN LENGTH(US.cpf) = 11 THEN 
	        CONCAT(
	            SUBSTR(LPAD(US.cpf, 11, '0'), 1, 3), '.', 
	            SUBSTR(LPAD(US.cpf, 11, '0'), 4, 3), '.', 
	            SUBSTR(LPAD(US.cpf, 11, '0'), 7, 3), '-', 
	            SUBSTR(LPAD(US.cpf, 11, '0'), 10, 2)
	        )
	    WHEN LENGTH(US.cpf) = 14 THEN 
	        CONCAT(
	            SUBSTR(LPAD(US.cpf, 14, '0'), 1, 2), '.', 
	            SUBSTR(LPAD(US.cpf, 14, '0'), 3, 3), '.', 
	            SUBSTR(LPAD(US.cpf, 14, '0'), 6, 3), '/', 
	            SUBSTR(LPAD(US.cpf, 14, '0'), 9, 4), '-', 
	            SUBSTR(LPAD(US.cpf, 14, '0'), 13, 2)
	        )
	    ELSE US.cpf
	END AS 'cpf_faturamento', -- varchar(30)
	US.rg AS 'rg_faturamento',
	lower(US.email) AS 'email_faturamento',
	CASE
    WHEN US.telefone1 IS NULL THEN NULL
    WHEN LENGTH(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', '')) = 11 THEN
        -- celular: (11) 97843-6647
        CONCAT(
            '(', SUBSTRING(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', ''), 1, 2), ') ',
            SUBSTRING(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', ''), 3, 5), '-',
            SUBSTRING(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', ''), 8, 4)
        )
    WHEN LENGTH(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', '')) = 10 THEN
        -- fixo: (11) 3265-4321
        CONCAT(
            '(', SUBSTRING(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', ''), 1, 2), ') ',
            SUBSTRING(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', ''), 3, 4), '-',
            SUBSTRING(REPLACE(REPLACE(US.telefone1, '+55', ''), ' ', ''), 7, 4)
        )
    ELSE US.telefone1
END AS 'telefone1_faturamento',  -- varchar(30)
	CASE
    WHEN US.telefone2 IS NULL THEN NULL
    WHEN LENGTH(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', '')) = 11 THEN
        -- celular: (11) 97843-6647
        CONCAT(
            '(', SUBSTRING(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', ''), 1, 2), ') ',
            SUBSTRING(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', ''), 3, 5), '-',
            SUBSTRING(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', ''), 8, 4)
        )
    WHEN LENGTH(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', '')) = 10 THEN
        -- fixo: (11) 3265-4321
        CONCAT(
            '(', SUBSTRING(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', ''), 1, 2), ') ',
            SUBSTRING(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', ''), 3, 4), '-',
            SUBSTRING(REPLACE(REPLACE(US.telefone2, '+55', ''), ' ', ''), 7, 4)
        )
    ELSE US.telefone2
END AS 'telefone2_faturamento',  -- varchar(30)
	URC.data_admissao AS 'data_admissao',
	URC.data_desligamento AS 'data_desligamento',
	URC.creci AS 'creci',
	URC.data_emissao_creci AS 'data_emissao_creci',
	URC.data_vencimento_creci AS 'data_vencimento_creci',
	URC.taxa_comissionamento AS 'taxa_comissionamento',
	URC.data_expedicao_rg AS 'data_expedicao_rg',
	URC.url_foto_perfil AS 'url_foto_perfil',
	US.CADASTRADO_EM AS 'data_cadastro',
	US.ATUALIZADO_EM AS 'data_atualizacao'
FROM dommus_infratecnica.tb_sgg3_autenticacao SG
JOIN dommus_infratecnica.tb_sgg3_tipo_usuario TU ON TU.id=SG.id_tipo_usuario
JOIN dommus_infratecnica.tb_referencia_integracao RI ON RI.id_referencia=SG.id AND RI.referencia='tb_sgg3_autenticacao' AND RI.status='1'
JOIN dommus_infratecnica.tb_parceiro PA ON PA.id=RI.parceiro 
JOIN dommus_infratecnica.tb_sistema_parceiro SP ON SP.id=PA.sistema
JOIN dommus_infratecnica.tb_tipo_sistema TS ON TS.id=SP.tipo_sistema
LEFT JOIN dommus_infratecnica.tb_usuario_sistema US ON US.id=SG.id_referencia
LEFT JOIN dommus_infratecnica.tb_usuario_recursos_humanos URC ON URC.id_usuario=SG.id
LEFT JOIN dommus_infratecnica.tb_equipe_usuario eu ON eu.usuario = SG.id AND eu.tipo_acesso = 'C' and eu.ativo = 'S' AND eu.status = '1'
LEFT JOIN dommus_infratecnica.tb_equipe_empreendimento ee ON ee.id = eu.equipe_empreendimento
LEFT JOIN dommus_infratecnica.tb_equipe eq ON eq.id = ee.equipe AND eq.status = '1'
WHERE TS.id=6 AND SG.status='1' AND SG.email NOT LIKE '%dommus%'
-- and TU.id in (8,7)
-- and RI.json_externo = 23169
-- AND US.ATUALIZADO_EM between '{data_inicio}' and '{data_fim}'
group by id_corretor,eq.id;