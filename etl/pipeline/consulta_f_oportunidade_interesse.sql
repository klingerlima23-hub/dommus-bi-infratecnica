-- dw_infratecnica.f_oportunidade_interesse --
-- Uma linha por oportunidade_interesse do funil 9 (INFRAPRO).
--
-- A origem tem os dados em JSON (dados_dinamicos) com chaves numericas
-- que sao IDs de campos customizados da oportunidade no CRM Dommus.
-- Extraimos as 4 chaves conhecidas e preservamos o JSON bruto pra
-- que futuras evolucoes nao exijam retrabalho de DDL:
--
--   16 = Valor Estimado (decimal)
--   17 = Valor Real     (decimal)
--   18 = Tipo de Mercado (Privado/Publico)
--   19 = Tipo de Segmento (Agronegocio, Loteamento, Infraestrutura,
--                          Saneamento Basico, Pavimentacao,
--                          Terraplanagem, Drenagem, ...)
--
-- Filtros:
--  * o.id_funil = 9 pra restringir ao pipeline INFRAPRO
--  * dados_dinamicos != {} pra ignorar oportunidades sem nenhum campo
--    customizado preenchido (senao entra ruido)
--
-- JOIN pelo id_oportunidade permite compor com f_oportunidade.
SELECT
    oi.id_oportunidade_interesse                                                     AS 'id_oportunidade_interesse', -- int (PK)
    oi.id_oportunidade                                                               AS 'id_oportunidade',           -- int
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(oi.dados_dinamicos, '$."16"')), '') AS DECIMAL(20,2))
                                                                                     AS 'valor_estimado',            -- decimal(20,2)
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(oi.dados_dinamicos, '$."17"')), '') AS DECIMAL(20,2))
                                                                                     AS 'valor_real',                -- decimal(20,2)
    JSON_UNQUOTE(JSON_EXTRACT(oi.dados_dinamicos, '$."18"'))                         AS 'tipo_mercado',              -- varchar(50)
    JSON_UNQUOTE(JSON_EXTRACT(oi.dados_dinamicos, '$."19"'))                         AS 'tipo_segmento',             -- varchar(100)
    oi.dados_dinamicos                                                               AS 'dados_dinamicos_raw'        -- json
FROM crm_inquilino_0040.oportunidade_interesse AS oi
JOIN crm_inquilino_0040.oportunidade AS o
    ON oi.id_oportunidade = o.id_oportunidade
WHERE o.id_funil = 9
  AND oi.dados_dinamicos <> JSON_OBJECT();
