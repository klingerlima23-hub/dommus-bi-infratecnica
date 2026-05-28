-- dw_infratecnica.fase_funil --
select
	ff.id_fase_funil as id_fase_funil,
	ff.nome as nome_fase_funil,
	ff.ordem as ordem_fase_funil,
	ff.criado_em as data_cadastro,
	ff.atualizado_em as data_atualizacao
from crm_inquilino_0040.fase_funil as ff
where ff.atualizado_em between '{data_inicio}' and '{data_fim}'