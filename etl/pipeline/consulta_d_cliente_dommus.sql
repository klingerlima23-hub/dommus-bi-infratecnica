-- dw_infratecnica.d_cliente_dommus --
-- Identidade visual do cliente (Infratecnica = id 51).
-- Tabela de UMA linha; sem date filter nem paginacao.
SELECT
    c.id    AS 'id_cliente_dommus', -- int
    c.nome  AS 'nome_cliente_dommus', -- varchar(255)
    c.logo  AS 'logo_cliente_dommus' -- varchar(255)
FROM dommus_homolog_gu.tb_cliente AS c
WHERE c.id = 40
