-- dw_infratecnica.d_campanha --
select
	c.id_campanha as 'id_campanha',
	upper(c.nome) as 'nome_campanha',
	c.criado_em as 'data_cadastro',
	c.atualizado_em as 'data_atualizacao',
	c.ativo as 'ativo'
from crm_inquilino_0040.campanha as c
where c.atualizado_em between '{data_inicio}' and '{data_fim}'
