-- dw_infratecnica.d_status_funil --
select
	fso.id_funil_status_oportunidade as id_status_funil,
	fso.id_funil,
	fso.id_status_oportunidade,
	fso.id_fase_funil,
	fso.ordem as ordem_Status,
	fso.criado_em as data_cadastro,
	fso.atualizado_em as data_atualizacao
from crm_inquilino_0040.funil_status_oportunidade fso
where fso.atualizado_em between '{data_inicio}' and '{data_fim}'