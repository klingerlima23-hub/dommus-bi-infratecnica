-- dw_infratecnica.f_visita --
SELECT
	oa.id_oportunidade_atendimento as 'id_visita', -- int
	o.id_empreendimento as 'id_empreendimento', -- 
	oa.id_oportunidade as 'id_oportunidade', -- int
	oa.criado_por as 'id_criador_visita', -- int
	oa.responsavel as 'id_responsavel_visita', -- int
	oa.concluido_por as 'id_concluiu_visita', -- int
	l.nome as 'local_visita', -- varchar(255)
	if(oav.visita_realizada=1,'Sim','Não') as 'visita_realizada',   -- varchar(255)
	concat(oa.data,' ',oa.hora) as 'data_visita', -- date
	oa.concluido_em  as 'data_conclusao_visita',  -- date
	oa.criado_em as 'data_cadastro',  -- date
	oa.atualizado_em as 'data_atualizacao',  -- date
	tv.nome as 'tipo_visita' -- varchar(255)
FROM crm_inquilino_0040.oportunidade o
JOIN crm_inquilino_0040.oportunidade_atendimento oa ON oa.id_oportunidade=o.id_oportunidade and oa.id_tipo_atendimento = 4
left join crm_inquilino_0040.locais as l on oa.id_local = l.id_local
LEFT JOIN crm_inquilino_0040.oportunidade_atendimento_visita oav ON oav.id_oportunidade_atendimento=oa.id_oportunidade_atendimento AND oav.oculto='0' AND oav.ativo='1'
left join crm_inquilino_0040.tipo_visita as tv on oa.id_tipo_visita = tv.id_tipo_visita
-- WHERE oa.id_oportunidade_atendimento = 221186
-- group by oa.id_oportunidade_atendimento
order by oa.criado_em desc;