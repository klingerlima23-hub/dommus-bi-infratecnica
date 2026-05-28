-- dw_infratecnica.f_espelho_de_venda --
SELECT
    te.id AS 'id_empreendimento', -- int
    te.nome as 'nome_empreendimento', -- varchar(255)
    tu.id AS 'id_unidade', -- int
    tu.descricao AS 'descricao_unidade', -- varchar(50)
    IF((TRUE OR tu.disponibilidade = 'D'), tu.disponibilidade,tudi.id_unidade_disponibilidade) as 'disponibilidade',  -- varchar(10)
    IF((TRUE OR tu.disponibilidade = 'D'), tud.descricao, tudi.descricao) AS 'descricao_disponibilidade', -- varchar(100)
    IF((TRUE OR tu.disponibilidade = 'D'), tp.id, "**********") AS 'id_processo', -- int
    IF((TRUE OR tu.disponibilidade = 'D'), tp.data_venda, "**********") AS 'data_contrato', -- date
    tu.atualizado_em as 'data_atualizacao', -- datetime
    tu.cadastrado_em as 'data_cadastro', -- datetime
    tvp.valor as 'valor_unidade' -- decimal(10,2)
FROM dommus_infratecnica.tb_unidade tu
LEFT JOIN dommus_infratecnica.tb_processo tp ON tp.id = tu.processo
LEFT JOIN (dommus_infratecnica.tb_venda tv JOIN dommus_infratecnica.tb_tipo_negociacao ttn ON tv.tipo = ttn.id) ON tv.processo = tp.id AND tv.situacao = 'F' AND (ttn.tipo IN ('V','D') OR tv.cessao_direitos = 'S')
LEFT JOIN dommus_infratecnica.tb_valor_negociacao_unidade tvnu ON tvnu.unidade = tu.id AND tvnu.status = '1' AND ttn.id = tvnu.tipo_negociacao
LEFT JOIN dommus_infratecnica.tb_valor_negociacao_unidade tvp ON tvp.unidade = tu.id AND tvp.padrao = 'S' AND tvp.status = '1'
LEFT JOIN dommus_infratecnica.tb_equipe_empreendimento tee ON tee.equipe = tp.equipe AND tee.empreendimento = tp.empreendimento
INNER JOIN dommus_infratecnica.tb_unidade_disponibilidade tud ON tud.id_unidade_disponibilidade = tu.disponibilidade
LEFT JOIN dommus_infratecnica.tb_unidade_disponibilidade tudi ON tudi.id_unidade_disponibilidade = 'I'
INNER JOIN dommus_infratecnica.tb_empreendimento te ON tu.empreendimento = te.id
INNER JOIN dommus_infratecnica.tb_empreendimento_config tec ON te.id = tec.id_empreendimento
LEFT JOIN dommus_infratecnica.tb_analise_credito tacv ON tv.analise_credito = tacv.id
LEFT JOIN dommus_infratecnica.tb_analise_credito tacp ON tacp.id = tp.analise_credito
LEFT JOIN dommus_infratecnica.tb_avaliacao_banco_unidade tabu ON tabu.banco = IF(tacv.banco IS NULL, tacp.banco, tacv.banco) AND tabu.unidade = tu.id AND tabu.status = '1'
LEFT JOIN dommus_infratecnica.tb_avaliacao_banco_unidade tap ON tap.padrao = 'S' AND tap.unidade = tu.id AND tap.status = '1'
LEFT JOIN dommus_infratecnica.tb_proponente tpp ON tp.proponente1 = tpp.id
LEFT JOIN dommus_infratecnica.tb_etapas_workflow tew ON tp.etapa_workflow = tew.id
LEFT JOIN dommus_infratecnica.tb_tipo_unidade ttu ON tu.tipo = ttu.id
LEFT JOIN dommus_infratecnica.tb_equipe teq ON teq.id = tp.grupo_usuario
LEFT JOIN dommus_infratecnica.tb_sgg3_autenticacao tcor ON tcor.id = tp.corretor
LEFT JOIN dommus_infratecnica.tb_sgg3_autenticacao tger ON tger.id = tp.gerente
LEFT JOIN dommus_infratecnica.tb_tipo_permuta ttp ON ttp.id = tu.motivo_permuta
LEFT JOIN dommus_infratecnica.tb_faixa_financiamento tff ON tff.id = IF(tacv.faixa_financiamento IS NULL, tacp.faixa_financiamento, tacv.faixa_financiamento)
LEFT JOIN dommus_infratecnica.tb_nome_bloco tnb ON tnb.empreendimento = tu.empreendimento AND tnb.modulo = tu.modulo AND tnb.bloco = tu.bloco
LEFT JOIN dommus_infratecnica.tb_coordenadas_unidade tcu ON tcu.unidade_id = tu.id AND tcu.tipo_coordenada = tec.tipo_espelho
WHERE tu.atualizado_em between '{data_inicio}' AND '{data_fim}'
AND tu.disponibilidade NOT IN ('N')
AND tu.status = '1'
AND tu.modulo IS NOT NULL
GROUP BY tu.id
ORDER BY tu.atualizado_em desc,tu.id;