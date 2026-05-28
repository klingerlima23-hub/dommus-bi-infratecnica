SELECT
	eq.id as 'id_equipe', -- int
	eq.nome as 'nome_equipe', -- varchar(255)
	CASE
        WHEN eq.TIPO = 'P' THEN 'PDV'
        WHEN eq.TIPO = 'C' THEN 'COBAN'
        WHEN eq.TIPO = 'B' THEN 'BACK OFFICE'
        WHEN eq.TIPO = 'D' THEN 'DESPACHANTE'
        WHEN eq.TIPO = 'A' THEN 'PRÉ-ATENDIMENTO'
        ELSE 'Tipo desconhecido'
    END AS 'tipo_equipe',
	r.id as 'id_regional', -- int
	null as 'interna_externa', -- varchar(3)
	eq.cadastrado_em as 'data_cadastro', -- datetime
	eq.atualizado_em as 'data_atualizacao' -- datetime
FROM dommus_infratecnica.tb_equipe eq
left join dommus_infratecnica.tb_rede_pdv as r on eq.rede = r.id
-- where eq.cadastrado_em between '{data_inicio}' and '{data_fim}'
group by eq.id;