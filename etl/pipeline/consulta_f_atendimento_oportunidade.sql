-- dw_infratecnica.f_atendimento_oportunidade --
SELECT
	oa.id_oportunidade_atendimento as 'id_oportunidade_atendimento',
	ta.nome as 'tipo_atendimento',
	oa.titulo as 'titulo_atendimento',
	oa.observacao as 'observacao_atendimento',
	oa.tarefa_realizada as 'tarefa_realizada',
	oa.data_inicial as 'data_inicial_atendimento',
	oa.data_final as 'data_final_atendimento',
	oa.data as 'data_atendimento',
	-- oa.hora as 'hora_atendimento',
	oa.criado_em as 'data_criacao_atendimento',
	oa.concluido_em as 'data_conclusao_atendimento',
	oa.atualizado_em as 'data_atualizacao_atendimento',
	oa.ativo as 'ativo'
FROM crm_inquilino_0040.oportunidade o
JOIN crm_inquilino_0040.oportunidade_atendimento oa ON oa.id_oportunidade=o.id_oportunidade
JOIN crm_inquilino_0040.tipo_atendimento ta ON ta.id_tipo_atendimento=oa.id_tipo_atendimento
WHERE o.ativo='1'
and oa.atualizado_em between '{data_inicio}' and '{data_fim}'