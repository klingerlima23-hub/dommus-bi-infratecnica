-- dw_infratecnica.f_historico_etapa_processo --
-- Origem: dommus_infratecnica.tb_controle_sla (historico COMPLETO de transicoes de etapa).
-- PK paginacao: e.id (alias 'id').
SELECT
    e.id,
    e.processo                         AS id_processo,
    e.etapa_original                   AS id_etapa_workflow_anterior,
    ewanterior.nome                    AS etapa_workflow_anterior,
    e.etapa_workflow                   AS id_etapa_workflow_atual,
    ewatual.nome                       AS etapa_workflow_atual,
    e.data_hora                        AS cadastrado_em
FROM dommus_infratecnica.tb_controle_sla AS e
LEFT JOIN dommus_infratecnica.tb_etapas_workflow ewatual
       ON e.etapa_workflow = ewatual.id
LEFT JOIN dommus_infratecnica.tb_etapas_workflow ewanterior
       ON e.etapa_original = ewanterior.id
WHERE (e.etapa_original != e.etapa_workflow OR e.etapa_original IS NULL)
    -- AND e.processo = 31
    -- AND e.data_hora BETWEEN '{data_inicio}' AND '{data_fim}'
ORDER BY e.processo, e.data_hora
