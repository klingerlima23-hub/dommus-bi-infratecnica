-- dw_infratecnica.d_origem --
select
	o.id_origem as 'id_origem', -- int
	upper(o.origem) as 'nome_origem', -- varchar(255)
	o.criado_em as 'data_cadastro', -- datetime
	o.atualizado_em as 'data_atualizacao', -- datetime
	if(o.ativo='0','NÃO','SIM') as 'ativo'
from crm_inquilino_0040.origem as o
where o.atualizado_em between '{data_inicio}' and '{data_fim}'