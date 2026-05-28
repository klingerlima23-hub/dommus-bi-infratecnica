-- dw_infratecnica.f_funil --
-- Uma linha por (oportunidade, status_destino) com a ultima transicao.
-- Filtro de janela em l.criado_em via {data_inicio}/{data_fim}.
-- OBS: este SELECT usa GROUP BY (id_oportunidade, id_etapa_destino), por isso
-- a paginacao keyset por uma unica PK NAO e aplicavel - o sincronizador
-- correspondente faz leitura unica (sem construir_sql_paginado).
select
    cso.id_oportunidade                       as id_oportunidade,
    coalesce(cso.id_status_origem, 0)         as id_etapa_origem,
    cso.id_status_destino                     as id_etapa_destino,
    o.id_status_oportunidade                  as id_etapa_atual,
    case
        -- Leads
        when cso.id_status_destino in (19, 16)             then 1
        -- Em atendimento
        when cso.id_status_destino in (11, 59, 23)         then 2
        -- Oportunidade
        when cso.id_status_destino in (26)                 then 3
        -- Visita agendada (inclui Agendamento PQ + Visita Agendada + Visita Realizada)
        when cso.id_status_destino in (4, 56, 57)          then 4
        -- Pasta (Cadastro Completo, Proposta em Analise, Aprovacao Bancaria, Aguardando liberacao)
        when cso.id_status_destino in (20, 58, 18, 22)     then 5
        -- Venda
        when cso.id_status_destino in (8)                  then 6
        -- Perdido / Descarte (Venda Perdida, Venda Perdida B.B, Sem interesse ML, Desistencia PC)
        when cso.id_status_destino in (9, 38, 29, 55)      then 7
    end                                       as id_etapa_funil,
    l.criado_em                               as data_lead,
    l.id_campanha                             as id_campanha,
    l.id_origem                               as id_origem,
    l.id_midia                                as id_midia,
    o.id_gerente_pdv                          as id_gerente_pdv,
    o.id_equipe_pdv                           as id_equipe_pdv,
    o.id_usuario_atendimento                  as id_corretor,
    o.id_processo                             as id_processo,
    o.id_empreendimento                       as id_empreendimento
from crm_inquilino_0040.controle_status_oportunidade cso
join crm_inquilino_0040.oportunidade o
    on cso.id_oportunidade = o.id_oportunidade
join crm_inquilino_0040.lead_oportunidade lo
    on lo.id_oportunidade = o.id_oportunidade
join crm_inquilino_0040.lead l
    on lo.id_lead = l.id_lead
where l.criado_em between '{data_inicio}' and '{data_fim}'
group by cso.id_oportunidade, cso.id_status_destino
order by id_etapa_funil asc
