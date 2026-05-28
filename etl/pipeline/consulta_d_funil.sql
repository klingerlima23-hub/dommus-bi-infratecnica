-- dw_infratecnica.d_funil --
select
	f.id_funil as 'id_funil',
	upper(f.nome) as 'nome_funil',
	f.criado_em as 'data_cadastro',
	f.atualizado_em as 'data_atualizacao'
from crm_inquilino_0040.funil f
where f.atualizado_em between '{data_inicio}' and '{data_fim}'