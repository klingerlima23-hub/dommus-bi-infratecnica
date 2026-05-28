-- dw_infratecnica.f_investimento --
-- Uma linha por midia_custo (com sua respectiva campanha/empreendimento).
-- PK paginacao: mc.id_midia_custo (alias 'id_midia_custo').
select
    mc.id_midia_custo                                  as id_midia_custo,
    mc.custo_estimado                                  as valor_investimento,
    mc.id_midia                                        as id_midia,
    cm.id_campanha                                     as id_campanha,
    ce.id_empreendimento                               as id_empreendimento,
    CONCAT(mc.ano, '-', mc.mes, '-01')                 as data_investimento
from crm_inquilino_0040.midia_custo mc
left join crm_inquilino_0040.campanha_midia cm
    on mc.id_midia = cm.id_midia
left join crm_inquilino_0040.campanha_empreendimento ce
    on cm.id_campanha = ce.id_campanha
where mc.custo_estimado_total != 0
  and cm.id_campanha is not null
group by mc.id_midia_custo, mc.mes
