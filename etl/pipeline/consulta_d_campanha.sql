-- dw_infratecnica.d_campanha --
select
	c.id_campanha as 'id_campanha',
	upper(c.nome) as 'nome_campanha',
	c.criado_em as 'data_cadastro',
	c.atualizado_em as 'data_atualizacao',
	c.ativo as 'ativo'
from crm_inquilino_0040.campanha as c
-- Full load: filtro `atualizado_em BETWEEN` removido pelo mesmo motivo
-- de d_midia (NULL BETWEEN x AND y => NULL, excluindo campanhas nunca
-- atualizadas e quebrando JOIN em fatos que referenciam id_campanha).
