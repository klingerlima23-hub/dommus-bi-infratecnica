-- dw_infratecnica.d_usuario_gu --
-- Origem: dommus_infratecnica.tb_sgg3_autenticacao + tb_sgg3_tipo_usuario
-- Filtra apenas usuarios ativos do tipo 3 (perfil de acesso ao dashboard)
SELECT
    a.id           AS id_usuario,       -- int (PK)
    a.email        AS emails_usario,    -- varchar(255)
    a.autenticacao AS password,         -- varchar(255)
    tu.id          AS id_perfil,        -- int
    tu.descricao   AS perfil_usuario    -- varchar(255)
FROM dommus_infratecnica.tb_sgg3_autenticacao AS a
JOIN dommus_infratecnica.tb_sgg3_tipo_usuario AS tu ON a.id_tipo_usuario = tu.id
WHERE a.ativo = 1
  AND tu.id = 3
