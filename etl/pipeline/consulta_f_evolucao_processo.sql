-- dw_infratecnica.f_evolucao_processo --
select
	e.id,
	e.processo         as 'id_processo',         -- int
	e.etapa_original   as 'id_etapa_anterior',   -- int
	e.etapa_workflow   as 'id_etapa_atual',      -- int
	e.data_hora        as 'data_cadastro'        -- datetime
from dommus_infratecnica.view_controle_sla_mais_recentes as e
where e.data_hora between '{data_inicio}' and '{data_fim}'
order by e.processo, e.data_hora
