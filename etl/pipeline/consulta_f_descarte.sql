 -- dw_infratecnica.f_descarte --
SELECT
	od.id_oportunidade_desistencia as 'id_descarte', -- int
	o.id_oportunidade AS 'id_oportunidade', -- int 
	upper(odt.nome) AS 'motivo_descarte', -- text
	trim(upper(od.consideracoes)) as 'consideracoes', -- text
	od.etapa_anterior AS 'id_etapa_anterior', -- int
	od.criado_em AS 'data_cadastro', -- datetime
	od.atualizado_em as 'data_atualizacao', -- datetime
	od.criado_por AS 'id_responsavel', -- int
	o.id_status_oportunidade as 'id_etapa_atual' -- int
FROM crm_inquilino_0040.oportunidade o
JOIN crm_inquilino_0040.oportunidade_desistencia od ON od.id_oportunidade=o.id_oportunidade and od.ativo = '1'
join crm_inquilino_0040.status_oportunidade so on so.id_status_oportunidade=o.id_status_oportunidade
JOIN crm_inquilino_0040.oportunidade_desistencia_tipo odt ON odt.id_desistencia_tipo=od.id_desistencia_tipo
join crm_inquilino_0040.funil_status_oportunidade as sfo ON o.id_status_oportunidade  = sfo.id_status_oportunidade AND sfo.id_funil  = 1 AND sfo.ativo = '1'
where od.criado_em between '{data_inicio}' and '{data_fim}'
group by od.id_oportunidade
ORDER BY od.id_oportunidade