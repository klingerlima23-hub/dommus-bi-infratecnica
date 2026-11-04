-- dw_infratecnica.d_midia --
-- Full load: TRUNCATE + INSERT. O filtro `atualizado_em BETWEEN` foi
-- removido porque `NULL BETWEEN x AND y` resolve pra NULL (nao true)
-- no MySQL, deixando de fora midias criadas e nunca atualizadas
-- (atualizado_em IS NULL). Isso quebrava JOINs em f_funil / f_lead
-- (nome_midia vinha NULL mesmo pra id_midia referenciados).
select
	m.id_midia as 'id_midia',
	upper(m.descricao) as 'nome_midia',
	m.criado_em as 'data_cadastro',
	m.atualizado_em as 'data_atualizacao',
	if(m.ativo='0','NÃO','SIM') as 'ativo'
from crm_inquilino_0040.midia as m