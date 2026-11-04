-- dw_infratecnica.d_origem --
select
	o.id_origem as 'id_origem', -- int
	upper(o.origem) as 'nome_origem', -- varchar(255)
	o.criado_em as 'data_cadastro', -- datetime
	o.atualizado_em as 'data_atualizacao', -- datetime
	if(o.ativo='0','NÃO','SIM') as 'ativo'
from crm_inquilino_0040.origem as o
-- Full load: filtro `atualizado_em BETWEEN` removido pelo mesmo motivo
-- de d_midia (NULL BETWEEN x AND y => NULL, excluindo origens nunca
-- atualizadas e quebrando JOIN em fatos que referenciam id_origem).