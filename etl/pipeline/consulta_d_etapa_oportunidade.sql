-- dw_infratecnica.d_etapa_oportunidade --
select
    id_status_oportunidade, -- int
    nome, -- varchar(255)
    cor, -- varchar(20)
    tipo, -- varchar(3)
    sla, -- varchar(255)
    sla_expira, -- varchar(255)
    sla_alerta, -- varchar(255)
    ordem, -- int
    oculto,  -- int
    criado_em, -- datetime
    atualizado_em, -- datetime
    ativo -- varchar(3)
from crm_inquilino_0040.status_oportunidade so
-- where atualizado_em between '{data_inicio}' and '{data_fim}';