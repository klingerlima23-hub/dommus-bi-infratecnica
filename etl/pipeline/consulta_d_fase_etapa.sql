SELECT
    e.id   AS id_fase_etapa,
    f.id   AS id_fase,
    f.nome AS fase_da_etapa
FROM dommus_infratecnica.tb_etapas_workflow e
LEFT JOIN dommus_infratecnica.tb_etapas_workflow f
       ON f.workflow = e.workflow
      -- AND f.nivel    = e.nivel
      AND f.subnivel = 0;
