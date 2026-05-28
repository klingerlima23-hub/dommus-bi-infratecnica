-- dw_infratecnica.d_midia --
select
	m.id_midia as 'id_midia',
	upper(m.descricao) as 'nome_midia',
	m.criado_em as 'data_cadastro',
	m.atualizado_em as 'data_atualizacao',
	if(m.ativo='0','NÃO','SIM') as 'ativo'
from crm_inquilino_0040.midia as m
where m.atualizado_em between '{data_inicio}' and '{data_fim}'