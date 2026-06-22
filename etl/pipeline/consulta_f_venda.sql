-- dw_infratecnica.f_vendas --
WITH
      DescontoVenda AS (
          SELECT
              fp.item_venda,
              SUM(df.valor) AS total_desconto
          FROM dommus_infratecnica.tb_fluxo_pagamento fp
          JOIN dommus_infratecnica.tb_detalhamento_fluxo df
              ON df.fluxo_pagamento = fp.id
          JOIN dommus_infratecnica.tb_tipo_parcela tp
              ON tp.id = df.id_tipo_parcela
              AND tp.id_grupo_tipo_parcela = 7
          GROUP BY fp.item_venda
      ),
      ProponenteRenda AS (
          SELECT
              p.id,
              p.nome,
              p.cpf,
              pr.empresa,
              pr.telefone_fixo,
              COALESCE(pr.outra_profissao, pf.descricao) AS profissao
          FROM dommus_infratecnica.tb_proponente p
          LEFT JOIN dommus_infratecnica.tb_proponente_renda pr
              ON p.id = pr.proponente
              AND pr.status = '1'
              AND pr.oculto = 'N'
          LEFT JOIN dommus_infratecnica.tb_profissao pf
              ON pf.id = pr.profissao
      ),
      AnaliseCredito AS (
          SELECT
              ac.id,
              ac.banco,
              ac.data,
              ac.validade,
              ac.valor_avaliado,
              ac.aprovacao,
              ac.fgts,
              ac.subsidio,
              ac.financiamento,
              ac.parcela_financiamento,
              ac.custas_financiadas,
              ac.renda_validada_banco,
              ac.renda_validada_coban,
              ac.desconto_financiamento,
              ac.condicionado,
              ac.tabela_financiamento,
              ac.tipo
          FROM dommus_infratecnica.tb_analise_credito ac
      ),
      DatasDistrato AS (
          SELECT
              ld.id_referencia,
              MAX(CASE WHEN ld.campo_afetado = 'situacao' AND ld.valor_posterior IN ('A', 'S')
                    THEN DATE_FORMAT(ld.cadastrado_em, '%d/%m/%Y') END) AS data_autorizacao,
              MAX(CASE WHEN ld.campo_afetado = 'situacao' AND ld.valor_posterior = 'F'
                    THEN DATE_FORMAT(ld.cadastrado_em, '%d/%m/%Y') END) AS data_finalizacao
          FROM dommus_infratecnica.tb_log_distrato ld
          GROUP BY ld.id_referencia
      )
    SELECT
      p.id AS 'processo_id', -- int
      p.n_proponentes AS 'quantidade_proponentes', -- int
      p.unidade AS 'processo_unidade_id', -- int
      p.data_venda  AS 'processo_data_venda', -- date
      p.cadastrado_em  AS 'processo_cadastrado_em', -- datetime
      p.atualizado_em  AS 'processo_atualizado_em', -- datetime
      p.data_registro AS 'processo_data_registro', -- datetime
      p.agendamento_entrevista AS 'processo_agendamento_entrevista', -- datetime
      p.agendamento_assinatura AS 'processo_agendamento_assinatura', -- datetime
      CASE
        WHEN p.aprovacao_assinatura_ccv = 'A' THEN 'APROVADO'
        WHEN p.aprovacao_assinatura_ccv = 'R' THEN 'REPROVADO'
        WHEN p.aprovacao_assinatura_ccv = 'E' THEN 'EM ANÁLISE'
        WHEN p.aprovacao_assinatura_ccv = 'C' THEN 'CARREGADO'
        ELSE 'NÃO INFORMADO' END AS 'processo_aprovacao_assinatura_ccv', -- varchar(20)
      CASE
        WHEN p.aprovacao_assinatura_formularios = 'A' THEN 'APROVADO'
        WHEN p.aprovacao_assinatura_formularios = 'R' THEN 'REPROVADO'
        WHEN p.aprovacao_assinatura_formularios = 'E' THEN 'EM ANÁLISE'
        WHEN p.aprovacao_assinatura_formularios = 'C' THEN 'CARREGADO'
        ELSE 'NÃO INFORMADO' END AS 'processo_aprovacao_assinatura_formularios', -- varchar(20)
      IF(p.ativo_inativo = 1, 'ATIVO', 'INATIVO')    AS 'processo_status', -- varchar(10)
      p.evolucao                                     AS 'processo_evolucao', -- int 
      p.pendencias                                   AS 'processo_pendencias', -- int
      p.alertas                                      AS 'processo_alertas', -- int
      p.codigo_relacionamento                        AS 'processo_codigo_relacionamento',
      CASE
        WHEN p.documentacao_validada = 'S' THEN 'SIM'
        WHEN p.documentacao_validada = 'N' THEN 'NÃO' ELSE 'NÃO INFORMADO' END AS 'processo_documentacao_validada', -- varchar(4)
      p.data_distrato  AS 'processo_data_distrato', -- date
        dd.data_autorizacao AS 'processo_data_autorizacao_distrato', -- date
        dd.data_finalizacao  AS 'processo_data_finalizacao_distrato', -- date
        MAX(cp.data_hora)      AS 'processo_data_solicitacao_distrato', -- date
      p.data_assinatura_contrato_if                  AS 'processo_data_assinatura_contrato_if', -- date
      p.agencia_financiamento                        AS 'processo_agencia_financiamento', -- varchar(15)
      p.conta_financiamento                          AS 'processo_conta_financiamento', -- varchar(20)
      p.numero_contrato_if                           AS 'processo_numero_contrato_if', -- varchar(30)
      p.data_liberacao_recurso 						 AS 'processo_data_liberacao_recurso', -- date
      IF(p.data_entrega_contrato_registrado_cliente IS NULL, '',p.data_entrega_contrato_registrado_cliente) AS 'processo_data_entrega_contrato_registrado_cliente', -- date
      p.data_liberacao_registro 					 AS 'processo_data_liberacao_registro', -- date
      p.data_entrega_contrato_registrado_banco 		 AS 'processo_data_entrega_contrato_registrado_banco', -- date
      p.recurso_liberado  							 AS 'processo_recurso_liberado', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.data, AC2.data)                                  AS 'analise_credito_data', -- date
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.validade, AC2.validade)                          AS 'analise_credito_validade', -- date
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.valor_avaliado, AC2.valor_avaliado)              AS 'analise_credito_valor_avaliado', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.aprovacao, AC2.aprovacao)                        AS 'analise_credito_aprovacao', -- varchar (4)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.fgts, AC2.fgts)                                  AS 'analise_credito_fgts', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.subsidio, AC2.subsidio)                          AS 'analise_credito_subsidio', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.financiamento, AC2.financiamento)                AS 'analise_credito_financiamento', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.parcela_financiamento, AC2.parcela_financiamento) AS 'analise_credito_parcela_financiamento', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.custas_financiadas, AC2.custas_financiadas)      AS 'analise_credito_custas_financiadas', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.renda_validada_banco, AC2.renda_validada_banco)  AS 'analise_credito_renda_validada_banco', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.renda_validada_coban, AC2.renda_validada_coban)  AS 'analise_credito_renda_validada_coban', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.desconto_financiamento, AC2.desconto_financiamento) AS 'analise_credito_desconto_financiamento', -- decimal(10,2)
      IF(AC1.tipo IN(2,3) AND AC2.id IS NULL, AC1.condicionado, AC2.condicionado) AS 'analise_credito_condicionado', -- varchar(2)
      CASE
        WHEN AC1.tipo = 3 AND AC1.tabela_financiamento = 'P' THEN 'PRICE'
        WHEN AC1.tipo = 3 AND AC1.tabela_financiamento = 'S' THEN 'SAC'
        WHEN AC1.tipo = 3 AND AC1.tabela_financiamento = 'I' THEN 'IPCA'
        WHEN AC1.tipo = 4 AND AC2.tabela_financiamento = 'P' THEN 'PRICE'
        WHEN AC1.tipo = 4 AND AC2.tabela_financiamento = 'S' THEN 'SAC'
        WHEN AC1.tipo = 4 AND AC2.tabela_financiamento = 'I' THEN 'IPCA'
        ELSE ''
      END                                                                       AS 'analise_credito_tabela_financiamento', -- varchar(10)
      IF(AC1.tipo = 4, AC1.valor_avaliado, '')                                  AS 'critica_analise_credito_valor_avaliado', -- decimal(10,2)
      IF(AC1.tipo = 4, AC1.data, '')                                            AS 'critica_analise_credito_data', -- date
      IF(AC1.tipo = 4, AC1.validade, '')                                        AS 'critica_analise_credito_validade', -- decimal(10,2)
      IF(AC1.tipo = 4, AC1.fgts, '')                                            AS 'critica_analise_credito_fgts', -- -- decimal(10,2)
      IF(AC1.tipo = 4, AC1.subsidio, '')                                        AS 'critica_analise_credito_subsidio', -- decimal(10,2)
      IF(AC1.tipo = 4, AC1.financiamento, '')                                   AS 'critica_analise_credito_financiamento', -- decimal(10,2)
      CASE
        WHEN AC1.tipo IN(2,3) AND AC1.aprovacao = 'A' THEN 'APROVADA'
        WHEN AC1.tipo IN(2,3) AND AC1.aprovacao = 'R' THEN 'REPROVADA'
        WHEN AC1.tipo IN(2,3) AND AC1.aprovacao = 'A' AND AC1.condicionado = 'S' THEN 'CONDICIONADA'
        WHEN AC2.tipo IN(2,3) AND AC2.aprovacao = 'A' THEN 'APROVADA'
        WHEN AC2.tipo IN(2,3) AND AC2.aprovacao = 'R' THEN 'REPROVADA'
        WHEN AC2.tipo IN(2,3) AND AC2.aprovacao = 'A' AND AC2.condicionado = 'S' THEN 'CONDICIONADA'  ELSE '' END AS 'aprovacao_analise_credito', -- varchar(12)
      b.nome                                                    				AS 'banco_nome',  -- varchar(130)
      p.empreendimento 															AS 'empreendimento_id', -- int
      e.nome                                                    				AS 'empreendimento_nome',  -- varchar(255)
      IF(eb.codigo_apf IS NULL  OR eb.codigo_apf = '', 'NÃO', 'SIM')            AS 'empreendimento_demanda_minima',  -- varchar(5)
      ew.nome                                                   				AS 'etapas_workflow_nome',  -- varchar(130)
      fase.id_fase_etapa                                                        AS 'id_fase_etapa', -- int
      fase.id_fase                                                              AS 'id_fase', -- int
      fase.ordem_fase_etapa                                                     AS 'ordem_fase_etapa', -- int
      eq.nome                                                            		AS 'equipe_nome',  -- varchar(255)
      p1.id                                                                     AS 'proponente1_id', -- int
      p1.nome                                                                   AS 'proponente1_nome',  -- varchar(255)
      CONCAT(SUBSTR(LPAD(p1.cpf,11,'0'),1,3), '.', SUBSTR(p1.cpf,4,3), '.', SUBSTR(p1.cpf,7,3), '-', SUBSTR(p1.cpf,10,2)) AS 'proponente1_cpf',  -- varchar(20)
      p1.renda                                                                  AS 'proponente1_renda', -- decimal(10,2)
      p1.data_nascimento                           								AS 'proponente1_data_nascimento', -- date
      IF(p1.genero = 'M', 'MASCULINO', 'FEMININO')                              AS 'proponente1_genero',  -- varchar(10)
      TRUNCATE(DATEDIFF(NOW(), p1.data_nascimento) / 365, 0)                    AS 'proponente1_idade', -- int
      CASE p1.situacao_cadastral  WHEN 'R' THEN 'REGULAR' WHEN 'I' THEN 'IRREGULAR' ELSE '' END  AS 'proponente1_regularidade', --  -- varchar(12)
      pr1.empresa                                               				AS 'proponente1_nome_empresa',  -- varchar(255)
      CASE
		  WHEN LENGTH(pr1.telefone_fixo) = 10 THEN
		    CONCAT('(', SUBSTRING(pr1.telefone_fixo, 1, 2), ') ', SUBSTRING(pr1.telefone_fixo, 3, 4), '-', SUBSTRING(pr1.telefone_fixo, 7, 4))
		  WHEN LENGTH(pr1.telefone_fixo) = 11 THEN
		    CONCAT('(', SUBSTRING(pr1.telefone_fixo, 1, 2), ') ', SUBSTRING(pr1.telefone_fixo, 3, 5), '-', SUBSTRING(pr1.telefone_fixo, 8, 4))
		  ELSE
		    pr1.telefone_fixo 
		END AS 'proponente1_telefone_empresa',  -- varchar(20)
      (
        SELECT 
            IF(LENGTH(pc.valor) = 11, 
                CONCAT('(', SUBSTR(pc.valor,1,2), ') ', SUBSTR(pc.valor,3,5), '-', SUBSTR(pc.valor,8,4)), 
            pc.valor)
        FROM dommus_infratecnica.tb_proponente_contato pc 
        WHERE pc.tipo_contato='S' 
        AND pc.referencia_contato='21' 
        AND pc.status='1' 
        AND pc.oculto='N' 
        AND pc.proponente=p1.id 
        LIMIT 1
      ) 													  AS 'proponente1_celular',  -- varchar(20)
      pr1.profissao                   						  AS 'proponente1_profissao',  -- varchar(255)
      IF(LENGTH(pe1.cep) = 8, CONCAT(SUBSTR(pe1.cep,1,5), '-', SUBSTR(pe1.cep,6,3)), pe1.cep) AS 'proponente1_cep',  -- varchar(12)
      pe1.logradouro AS 'proponente1_logradouro', -- varchar(255)
	  pe1.numero AS 'proponente1_numero',  -- varchar(12)
	  pe1.bairro AS 'proponente1_bairro',  -- varchar(255)
	  pe1.cidade AS 'proponente1_cidade',  -- varchar(255)
	  pe1.uf AS 'proponente1_uf',  -- varchar(4)
	  lower((SELECT pc.valor FROM dommus_infratecnica.tb_proponente_contato pc WHERE pc.tipo_contato='E' AND pc.referencia_contato='21' AND pc.status='1' AND pc.oculto='N' AND pc.proponente=p1.id LIMIT 1)) AS 'proponente1_email',  -- varchar(255)
      p2.nome                         						  AS 'proponente2_nome',  -- varchar(255)
      CONCAT(SUBSTR(LPAD(p2.cpf,11,'0'),1,3), '.', SUBSTR(p2.cpf,4,3), '.', SUBSTR(p2.cpf,7,3), '-', SUBSTR(p2.cpf,10,2)) AS 'proponente2_cpf',  -- varchar(20)
      pr2.profissao                   						  AS 'proponente2_profissao',  -- varchar(255)
      lower((SELECT pc.valor FROM dommus_infratecnica.tb_proponente_contato pc WHERE pc.tipo_contato='E' AND pc.referencia_contato='21' AND pc.status='1' AND pc.oculto='N' AND pc.proponente=p2.id LIMIT 1)) AS 'proponente2_email',  -- varchar(255)
      p3.nome                         						  AS 'proponente3_nome',  -- varchar(255)
      CONCAT(SUBSTR(LPAD(p3.cpf,11,'0'),1,3), '.', SUBSTR(p3.cpf,4,3), '.', SUBSTR(p3.cpf,7,3), '-', SUBSTR(p3.cpf,10,2)) AS 'proponente3_cpf',  -- varchar(20)
      pr3.profissao                   						  AS 'proponente3_profissao',  -- varchar(255)
      lower((SELECT pc.valor FROM dommus_infratecnica.tb_proponente_contato pc WHERE pc.tipo_contato='E' AND pc.referencia_contato='21' AND pc.status='1' AND pc.oculto='N' AND pc.proponente=p3.id LIMIT 1)) AS 'proponente3_email',  -- varchar(255)
      p.gerente                                               AS 'id_gerente',    -- int
      p.corretor                                              AS 'id_corretor',   -- int
      p.equipe                                                AS 'id_equipe',     -- int
      g.nome                                                  AS 'gerente_nome',  -- varchar(255)
      c.nome                                                  AS 'corretor_nome', -- varchar(255)
      oc.nome                                                 AS 'operador_coban_nome', -- varchar(255)
      od.nome                                                 AS 'operador_despachante_nome', -- varchar(255)
      tu.descricao                                            AS 'tipo_unidade_descricao', -- varchar(100)
      IF(u.descricao IS NOT NULL, u.descricao, 'INEXISTENTE') AS 'unidade_descricao', -- varchar(255)
      u.modulo                                                AS 'unidade_modulo', -- int
      u.bloco                                                 AS 'unidade_bloco', -- int
      u.unidade                                               AS 'unidade_unidade', -- varchar(20)
      ff.descricao                                            AS 'unidade_faixa_financiamento', -- varchar(100)
      CASE
        WHEN vnu1.valor > 0.00 THEN vnu1.valor
        WHEN vnu1.valor IS NULL AND u.id IS NOT NULL THEN tvnu.valor ELSE 0.00 END AS 'unidade_valor', -- decimal(10,2)
     /* CASE
        WHEN vnu1.valor > 0.00
        THEN vnu1.valor - IFNULL((SELECT SUM(df.valor) FROM dommus_infratecnica.tb_fluxo_pagamento as fp JOIN dommus_infratecnica.tb_detalhamento_fluxo df ON df.`fluxo_pagamento` = fp.`id` JOIN dommus_infratecnica.tb_tipo_parcela tp ON tp.`id` = df.`id_tipo_parcela` AND tp.`id_grupo_tipo_parcela` = 7 WHERE fp.item_venda = iv.id),0) WHEN vnu1.valor IS NULL AND u.id IS NOT NULL
        THEN tvnu.valor - IFNULL( (SELECT  SUM(df.valor) FROM dommus_infratecnica.tb_fluxo_pagamento as fp JOIN dommus_infratecnica.tb_detalhamento_fluxo df ON df.`fluxo_pagamento` = fp.`id` JOIN dommus_infratecnica.tb_tipo_parcela tp ON tp.`id` = df.`id_tipo_parcela` AND tp.`id_grupo_tipo_parcela` = 7 WHERE fp.item_venda = iv.id),0)ELSE 0.00 END - IFNULL(iv.valor_cupom, 0) AS 'unidade_valor_liquido', -- decimal(10,2)
      */
CASE
      WHEN v.valor_negociacao_unidade > 0.00
        THEN v.valor_negociacao_unidade - IFNULL(
        (SELECT
            SUM(df.valor)
          FROM
            dommus_infratecnica.tb_fluxo_pagamento fp
            JOIN dommus_infratecnica.tb_detalhamento_fluxo df
              ON df.fluxo_pagamento = fp.id
            JOIN dommus_infratecnica.tb_tipo_parcela tp
              ON tp.id = df.id_tipo_parcela
              AND tp.id_grupo_tipo_parcela = 7
          WHERE fp.item_venda = iv.id),
          0
        )
        WHEN vnu1.valor > 0.00
        THEN vnu1.valor - IFNULL(
        (SELECT
            SUM(df.valor)
          FROM
            dommus_infratecnica.tb_fluxo_pagamento fp
            JOIN dommus_infratecnica.tb_detalhamento_fluxo df
              ON df.fluxo_pagamento = fp.id
            JOIN dommus_infratecnica.tb_tipo_parcela tp
              ON tp.id = df.id_tipo_parcela
              AND tp.id_grupo_tipo_parcela = 7
          WHERE fp.item_venda = iv.id),
          0
        )
        WHEN vnu1.valor IS NULL
        AND u.id IS NOT NULL
        THEN tvnu.valor - IFNULL(
        (SELECT
            SUM(df.valor)
          FROM
            dommus_infratecnica.tb_fluxo_pagamento fp
            JOIN dommus_infratecnica.tb_detalhamento_fluxo df
              ON df.fluxo_pagamento = fp.id
            JOIN dommus_infratecnica.tb_tipo_parcela tp
              ON tp.id = df.id_tipo_parcela
              AND tp.id_grupo_tipo_parcela = 7
          WHERE fp.item_venda = iv.id),
          0
        )
        ELSE 0.00
      END - IFNULL(iv.valor_cupom, 0) AS unidade_valor_liquido,
      abu.valor_avaliacao 											  AS 'unidade_valor_avaliacao', -- decimal(10,2)
      IF(u.processo IS NOT NULL AND u.processo > 0,u.descricao, '')   AS 'unidade_disponibilidade', -- varchar(255)
      IF(u.processo IS NOT NULL AND u.processo > 0,'SIM', 'NÃO')      AS 'venda_gerada', -- varchar(6)
      v.data                 AS 'venda_data', -- date
      v.contabilizado_em     AS 'venda_contabilizado_em', -- date
      p.pendencias           AS 'pendencias_abertas', -- int
      pdc.cadastrado_em      AS 'pendencia_cadastrado_em', -- datetime
      pdc.prazo_limite       AS 'pendencia_prazo_limite', -- datetime
      mpdc.descricao         AS 'pendencia_motivo', -- varchar(255)cls
      ci.descricao           AS 'categoria_interacao_descricao', -- varchar(100)
      mc.descricao           AS 'distrato_motivo', -- varchar(255)
      tn.descricao           AS 'tipo_negociacao', -- varchar(255)
      COALESCE(p1.renda, 0) + COALESCE(p2.renda, 0) + COALESCE(p3.renda, 0)     AS 'processo_renda_bruta', -- decimal(10,2)
      p.id_oportunidade               AS 'processo_id_oportunidade', -- decimal(10,2)
      iv.valor                        AS 'item_venda_valor', -- decimal (10,2)
      tac.descricao                   AS 'processo_tipo_analise_credito', -- varchar(255)
      v.valor_negociacao_unidade      AS 'venda_valor_negociacao_unidade', -- decimal (10,2)
      dv.total_desconto               AS 'desconto_total_venda', -- decimal (15,2),
      l.criado_em as lead_criado_em, -- datetime
      c2.nome as lead_campanha, -- varchar(255)
      m.descricao as lead_midia, -- varchar(255)
      og.origem as lead_origem -- varchar(255)
      FROM dommus_infratecnica.tb_processo as p
      LEFT JOIN dommus_infratecnica.tb_venda  as v ON p.id = v.processo AND v.situacao = 'F'
      LEFT JOIN dommus_infratecnica.tb_tipo_negociacao as tn ON v.tipo = tn.id AND tn.tipo in ('V','D') -- and tn.tipo_analise_credito in ('2','3')
      LEFT JOIN AnaliseCredito AC1 ON p.analise_credito = AC1.id
      LEFT JOIN AnaliseCredito AC2 ON v.analise_credito = AC2.id
      LEFT JOIN dommus_infratecnica.tb_tipo_analise_credito as tac ON AC1.tipo = tac.id AND tac.status = '1' AND tac.oculto = 'N'
      LEFT JOIN dommus_infratecnica.tb_banco as b ON AC1.banco = b.id
      LEFT JOIN dommus_infratecnica.tb_unidade as u ON p.unidade = u.id
      LEFT JOIN dommus_infratecnica.tb_faixa_financiamento as ff ON u.faixa_financiamento = ff.numeracao
      LEFT JOIN dommus_infratecnica.tb_empreendimento as e ON p.empreendimento = e.id
      LEFT JOIN dommus_infratecnica.tb_empreendimento_banco as eb ON eb.empreendimento = e.id AND eb.modulo = u.modulo
      LEFT JOIN dommus_infratecnica.tb_etapas_workflow as ew ON p.etapa_workflow = ew.id
      LEFT JOIN (
          SELECT
              e.id     AS id_fase_etapa,
              ew2.id   AS id_fase,
              ew2.nome AS fase_da_etapa,
              DENSE_RANK() OVER (ORDER BY ew2.id) AS ordem_fase_etapa
          FROM dommus_infratecnica.tb_etapas_workflow e
          LEFT JOIN dommus_infratecnica.tb_etapas_workflow ew2
                 ON ew2.workflow = e.workflow
                AND ew2.nivel    = e.nivel
                AND ew2.id       = e.id   -- diagonal: 1 linha por id_fase_etapa
      ) fase ON fase.id_fase_etapa = ew.id
      LEFT JOIN dommus_infratecnica.tb_equipe as eq ON p.equipe = eq.id
      INNER JOIN dommus_infratecnica.tb_proponente as p1 ON p.proponente1 = p1.id
      LEFT JOIN dommus_infratecnica.tb_proponente as p2 ON p.proponente2 = p2.id
      LEFT JOIN dommus_infratecnica.tb_proponente as p3 ON p.proponente3 = p3.id
      LEFT JOIN dommus_infratecnica.tb_proponente_endereco as pe1 ON pe1.id = (SELECT id FROM dommus_infratecnica.tb_proponente_endereco WHERE proponente = p1.id AND status = '1' AND oculto = 'N' LIMIT 1)
      LEFT JOIN dommus_infratecnica.tb_sgg3_autenticacao as g ON p.gerente = g.id
      LEFT JOIN dommus_infratecnica.tb_sgg3_autenticacao as c ON p.corretor = c.id
      LEFT JOIN dommus_infratecnica.tb_sgg3_autenticacao as oc ON p.operador_coban = oc.id
      LEFT JOIN dommus_infratecnica.tb_sgg3_autenticacao as od ON p.operador_despachante = od.id
      LEFT JOIN dommus_infratecnica.tb_tipo_unidade as tu ON u.tipo = tu.id
      LEFT JOIN dommus_infratecnica.tb_unidade_disponibilidade as ud ON u.disponibilidade = ud.id_unidade_disponibilidade
      LEFT JOIN dommus_infratecnica.tb_distrato as d ON p.id_distrato = d.id
      LEFT JOIN dommus_infratecnica.tb_cancelamento_processo as cp ON d.id_cancelamento_processo = cp.id
      LEFT JOIN dommus_infratecnica.tb_motivo_cancelamento as mc ON mc.id = cp.motivo
      LEFT JOIN DatasDistrato as dd ON p.id_distrato = dd.id_referencia
      LEFT JOIN dommus_infratecnica.tb_pendencia as pdc ON p.id = pdc.processo AND pdc.pausar_processo = 'S' AND pdc.status = '1' AND ((concluido_em IS NULL AND validar_solucao != 'S')OR (validar_solucao = 'S' AND validado_em IS NULL))
      LEFT JOIN dommus_infratecnica.tb_motivo_pendencia as mpdc ON mpdc.id = pdc.motivo
      LEFT JOIN dommus_infratecnica.tb_categoria_interacao as ci ON mpdc.categoria = ci.id
      LEFT OUTER JOIN dommus_infratecnica.tb_valor_negociacao_unidade as vnu1 ON vnu1.unidade = u.id AND vnu1.tipo_negociacao = v.tipo AND vnu1.status = '1' AND vnu1.oculto = 'N'
      LEFT OUTER JOIN dommus_infratecnica.tb_valor_negociacao_unidade as tvnu ON tvnu.unidade = u.id AND tvnu.padrao = 'S'  AND tvnu.status = '1' AND tvnu.oculto = 'N'
      LEFT OUTER JOIN dommus_infratecnica.tb_avaliacao_banco_unidade as abu ON abu.unidade = u.id AND abu.banco  = COALESCE(AC1.banco, 1) AND abu.status = '1' AND abu.oculto = 'N'
      LEFT JOIN dommus_infratecnica.tb_item_venda as iv ON iv.id = v.item_venda_entrada
      LEFT JOIN DescontoVenda dv ON v.item_venda_entrada = dv.item_venda
      LEFT JOIN ProponenteRenda pr1 ON p.proponente1 = pr1.id
      LEFT JOIN ProponenteRenda pr2 ON p.proponente2 = pr2.id
      LEFT JOIN ProponenteRenda pr3 ON p.proponente3 = pr3.id
      left join crm_inquilino_0040.oportunidade as o on p.id_oportunidade = o.id_oportunidade and o.ativo = '1'
      left join crm_inquilino_0040.lead_oportunidade as lo on o.id_oportunidade = lo.id_oportunidade and lo.ativo = '1'
      left join crm_inquilino_0040.lead as l on lo.id_lead = l.id_lead and l.ativo = '1'
      left join crm_inquilino_0040.campanha as c2 on l.id_campanha = c2.id_campanha
      left join crm_inquilino_0040.midia as m on l.id_midia = m.id_midia
      left join crm_inquilino_0040.origem as og on l.id_origem = og.id_origem
      WHERE p.status = 1
      AND p.atualizado_em IS NOT NULL
      AND p.ativo_inativo IN (0,1)
      -- AND p.criado_em between '{data_inicio}' AND '{data_fim}'
      GROUP BY p.id
      ORDER BY v.data DESC, p.id DESC;