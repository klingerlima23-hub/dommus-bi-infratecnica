-- dw_infratecnica.d_empreendimento --  
select
	e.id as 'id_empreendimento', -- int
	upper(e.nome) as 'nome_empreendimento', -- varchar(255)
	upper(e.bairro) as 'bairro_empreendimento', -- varchar(255)
	upper(e.cidade) as 'cidade_empreendimento', -- varchar(255)
	upper(e.uf) as 'uf_empreendimento', -- varchar (5)
	e.previsao_entrega as 'data_previsao_entrega_empreendimento', -- date
	e.cadastrado_em as 'data_cadastro', -- datetime
	e.atualizado_em as 'data_atualizacao', -- datetime
	e.latitude as 'latitude_empreendimento', -- varchar(100)
	e.longitude as 'longitude_empreendimento', -- varchar(100)
	if(e.ativo='1','SIM', 'NÃO') as 'ativo_empreendimento', -- varchar(5) 
	if(e.status='0','SIM', 'NÃO') as 'status_empreendimento', -- varchar(5)
    e.logradouro as 'logradouro_empreendimento',  -- varchar(100)
    e.numero as 'numero_empreendimento',  -- varchar(10)
    e.cep as 'cep_empreendimento',  -- varchar(10)
    spe.complemento as 'complemento',  -- varchar(100)
    spe.razao_social AS 'razao_social_spe', -- text
    spe.endereco AS 'endereco_spe',  -- text
    spe.bairro AS 'bairro_spe',  -- text
    spe.complemento AS 'complemento_spe',   -- varchar(100)
    spe.cidade AS 'cidade_spe',    -- varchar(100)
    spe.cep AS 'cep_spe',   -- varchar(10)
    spe.uf AS 'uf_spe',   -- varchar(2)
    spe.nire AS 'nire_spe',   -- varchar(10)
    spe.telefone AS 'telefone_spe',   -- varchar(20)
    spe.cadastrado_em AS 'data_cadastro_spe' -- datetime
from dommus_infratecnica.tb_empreendimento AS e
left join dommus_infratecnica.`tb_contratada` spe ON spe.`id`=e.`contratada`	
where e.atualizado_em between '{data_inicio}' and '{data_fim}'