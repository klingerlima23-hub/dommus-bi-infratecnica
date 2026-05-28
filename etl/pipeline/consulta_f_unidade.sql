-- dw_infratecnica.f_unidade --
select 
	u.id as 'id_unidade', -- int
	u.empreendimento as 'id_empreendimento', -- int
	u.processo as 'id_processo', -- int
	u.descricao as 'descricao', -- varchar(100)
	u.bloco as 'bloco',  -- int
	u.pavimento as 'pavimento', -- int
	u.unidade as 'unidade', -- varchar(255)
	CASE u.disponibilidade
	    WHEN 'D' THEN 'DISPONÍVEL'
	    WHEN 'I' THEN 'INDISPONÍVEL'
	    WHEN 'P' THEN 'PERMUTADA'
	    WHEN 'R' THEN 'RESERVADA'
	    WHEN 'E' THEN 'CONDIÇÃO ESPECIAL'
	    WHEN 'V' THEN 'VENDIDA'
	    WHEN 'C' THEN 'CONFORME'
	    WHEN 'A' THEN 'FINANCIAMENTO ASSINADO'
	    WHEN 'S' THEN 'REGISTRADA'
	    WHEN 'T' THEN 'EM FASE DE DISTRATO'
	    ELSE 'NÃO IDENTIFICADO'
	END AS 'disponibilidade' , -- varchar (100)
	upper(tu.descricao) as 'tipologia', -- varchar (100)
	u.tipo_comercializacao as 'tipo_comercializacao', -- varchar (50)
	if(u.posicao='P', 'POENTE','NASCENTE') as 'posicao', -- varchar (50)
	u.valor as 'valor_venal_atual_padrao', -- deciaml(10,2)
	u.valor_avaliacao as 'valor_avaliacao_padrao', -- deciaml(10,2)
	u.area_privativa_total as 'area_privativa_total', -- deciaml(10,2)
	u.area_exclusiva_total as 'area_exclusiva_total',-- deciaml(10,2)
	u.area_comum_total as 'area_comum_total',-- deciaml(10,2)
	u.area_acessoria_total as 'area_acessoria_total',-- deciaml(10,2)
	u.fracao_ideal as 'fracao_ideal',-- deciaml(10,2)
	u.valor_fracao_ideal as 'valor_fracao_ideal', -- deciaml(10,2)
	u.cadastrado_em as 'data_cadastro', -- datetime
	u.atualizado_em as 'data_atualizacao' -- datetime
from dommus_infratecnica.tb_unidade u
left join dommus_infratecnica.tb_tipo_unidade tu on u.tipo = tu.id
where u.atualizado_em between '{data_inicio}' and '{data_fim}';