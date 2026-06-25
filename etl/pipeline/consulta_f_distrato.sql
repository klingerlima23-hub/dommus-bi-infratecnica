-- dw_infratecnica.f_distrato --
-- Uma linha por processo distratado (tb_processo.id_distrato preenchido).
-- LEFT JOINs com lead/campanha/midia/origem para enriquecer com a fonte
-- do contato original (pode ser NULL se a oportunidade nao tem lead vivo).
SELECT
  p.id                AS 'processo_id', -- int
  p.id_oportunidade   AS 'processo_id_oportunidade', -- int
  p.empreendimento    AS 'empreendimento_id', -- int
  e.nome              AS 'empreendimento_nome', -- varchar(255)
  p.data_distrato     AS 'data_distrato', -- date
  mc.descricao        AS 'motivo_distrato', -- varchar(255)
  c2.nome             AS 'lead_campanha', -- varchar(255)
  m.descricao         AS 'lead_midia', -- varchar(255)
  og.origem           AS 'lead_origem' -- varchar(255)
FROM dommus_infratecnica.tb_processo AS p
JOIN dommus_infratecnica.tb_distrato AS d
  ON p.id_distrato = d.id
JOIN dommus_infratecnica.tb_cancelamento_processo AS cp
  ON d.id_cancelamento_processo = cp.id
JOIN dommus_infratecnica.tb_motivo_cancelamento AS mc
  ON cp.motivo = mc.id
LEFT JOIN dommus_infratecnica.tb_empreendimento AS e
  ON p.empreendimento = e.id
LEFT JOIN crm_inquilino_0040.lead_oportunidade AS lo
  ON lo.id_oportunidade = p.id_oportunidade AND lo.ativo = '1'
LEFT JOIN crm_inquilino_0040.lead AS l
  ON lo.id_lead = l.id_lead AND l.ativo = '1'
LEFT JOIN crm_inquilino_0040.campanha AS c2
  ON l.id_campanha = c2.id_campanha
LEFT JOIN crm_inquilino_0040.midia AS m
  ON l.id_midia = m.id_midia
LEFT JOIN crm_inquilino_0040.origem AS og
  ON l.id_origem = og.id_origem
WHERE p.status = 1
  AND p.id_distrato IS NOT NULL
  -- AND p.data_distrato BETWEEN '{data_inicio}' AND '{data_fim}'
GROUP BY p.id
ORDER BY p.id;
