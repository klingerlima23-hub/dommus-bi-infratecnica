-- dw_infratecnica.d_usuario --
SELECT
	CAST(RI.json_externo AS UNSIGNED) AS 'id_usuario', -- int
	TU.descricao AS 'tipo_usuario', -- varchar(255)
	SG.nome AS 'nome_usuario',  -- varchar(255)
	SG.email AS 'email_usuario',  -- varchar(255)
	IF(SG.ativo='0','INATIVO','ATIVO') AS 'situacao_usuario',  -- varchar(255)
	US.cpf AS 'cpf_faturamento',  -- varchar(255)
	US.rg AS 'rg_faturamento',  -- varchar(255)
	US.email AS 'email_faturamento',  -- varchar(255)
	US.telefone1 AS 'telefone1_faturamento',  -- varchar(255)_usuario
	US.telefone2 AS 'telefone2_faturamento',  -- varchar(255)
	URC.data_admissao AS 'data_admissao', -- date
	URC.data_desligamento AS 'data_desligamento', -- date
	URC.creci AS 'creci',  -- varchar(255)
	URC.data_emissao_creci AS 'data_emissao_creci', -- date
	URC.data_vencimento_creci AS 'data_vencimento_creci', -- date
	URC.taxa_comissionamento AS 'taxa_comissionamento',  -- varchar(255)
	URC.data_expedicao_rg AS 'data_expedicao_rg',  -- varchar(255)
	URC.url_foto_perfil AS 'url_foto_perfil', -- text
	US.CADASTRADO_EM AS 'data_cadastro', -- date
	US.ATUALIZADO_EM AS 'data_atualizacao' -- date
FROM dommus_infratecnica.tb_sgg3_autenticacao SG
JOIN dommus_infratecnica.tb_sgg3_tipo_usuario TU ON TU.id=SG.id_tipo_usuario
JOIN dommus_infratecnica.tb_referencia_integracao RI ON RI.id_referencia=SG.id AND RI.referencia='tb_sgg3_autenticacao' AND RI.status='1'
JOIN dommus_infratecnica.tb_parceiro PA ON PA.id=RI.parceiro 
JOIN dommus_infratecnica.tb_sistema_parceiro SP ON SP.id=PA.sistema
JOIN dommus_infratecnica.tb_tipo_sistema TS ON TS.id=SP.tipo_sistema
LEFT JOIN dommus_infratecnica.tb_usuario_sistema US ON US.id=SG.id_referencia
LEFT JOIN dommus_infratecnica.tb_usuario_recursos_humanos URC ON URC.id_usuario=SG.id
WHERE TS.id=6 AND SG.status='1' AND SG.email NOT LIKE '%dommus%'
-- AND US.CADASTRADO_EM between '{data_inicio}' and '{data_fim}'
group by id_usuario;