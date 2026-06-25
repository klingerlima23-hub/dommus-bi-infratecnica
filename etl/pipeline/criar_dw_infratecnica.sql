-- ============================================================
-- dw_infratecnica -- DDL gerada a partir do dw_magikjc
-- 17 tabelas: 10 dimensoes + 7 fatos
-- Rodar no host destino MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS `dw_infratecnica`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `dw_infratecnica`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------- d_corretor ----------
CREATE TABLE IF NOT EXISTS `d_corretor` (
  `id_corretor` BIGINT NULL,
  `id_corretor_rk` BIGINT NULL COMMENT 'ranking incremental do corretor',
  `id_equipe` BIGINT NULL,
  `tipo_corretor` VARCHAR(255) NULL,
  `nome_corretor` VARCHAR(255) NULL,
  `email_corretor` VARCHAR(255) NULL,
  `situacao_corretor` VARCHAR(255) NULL,
  `cpf_faturamento` VARCHAR(20) NULL,
  `rg_faturamento` VARCHAR(30) NULL COMMENT 'varchar(30)',
  `email_faturamento` VARCHAR(255) NULL,
  `telefone1_faturamento` VARCHAR(30) NULL COMMENT 'fixo: (11) 3265-4321',
  `telefone2_faturamento` VARCHAR(30) NULL COMMENT 'fixo: (11) 3265-4321',
  `data_admissao` VARCHAR(30) NULL COMMENT 'varchar(30)',
  `data_desligamento` DATETIME NULL,
  `creci` VARCHAR(255) NULL,
  `data_emissao_creci` DATETIME NULL,
  `data_vencimento_creci` DATETIME NULL,
  `taxa_comissionamento` DECIMAL(15,2) NULL,
  `data_expedicao_rg` DATETIME NULL,
  `url_foto_perfil` VARCHAR(500) NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL
,
  KEY `idx_d_corretor_id_corretor` (`id_corretor`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_empreendimento ----------
CREATE TABLE IF NOT EXISTS `d_empreendimento` (
  `id_empreendimento` BIGINT NULL,
  `nome_empreendimento` BIGINT NULL COMMENT 'int',
  `bairro_empreendimento` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `cidade_empreendimento` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `uf_empreendimento` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `data_previsao_entrega_empreendimento` VARCHAR(5) NULL COMMENT 'varchar (5)',
  `data_cadastro` DATE NULL COMMENT 'date',
  `data_atualizacao` DATETIME NULL COMMENT 'datetime',
  `latitude_empreendimento` DATETIME NULL COMMENT 'datetime',
  `longitude_empreendimento` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `ativo_empreendimento` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `status_empreendimento` VARCHAR(5) NULL COMMENT 'varchar(5)',
  `logradouro_empreendimento` VARCHAR(5) NULL COMMENT 'varchar(5)',
  `numero_empreendimento` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `cep_empreendimento` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `complemento` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `razao_social_spe` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `endereco_spe` TEXT NULL COMMENT 'text',
  `bairro_spe` TEXT NULL COMMENT 'text',
  `complemento_spe` TEXT NULL COMMENT 'text',
  `cidade_spe` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `cep_spe` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `uf_spe` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `nire_spe` VARCHAR(2) NULL COMMENT 'varchar(2)',
  `telefone_spe` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `data_cadastro_spe` DATETIME NULL COMMENT 'datetime'
,
  KEY `idx_d_empreendimento_id_empreendimento` (`id_empreendimento`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_midia ----------
CREATE TABLE IF NOT EXISTS `d_midia` (
  `id_midia` BIGINT NULL,
  `nome_midia` VARCHAR(255) NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL,
  `ativo` VARCHAR(10) NULL
,
  KEY `idx_d_midia_id_midia` (`id_midia`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_campanha ----------
CREATE TABLE IF NOT EXISTS `d_campanha` (
  `id_campanha` BIGINT NULL,
  `nome_campanha` VARCHAR(255) NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL,
  `ativo` VARCHAR(3) NULL
,
  KEY `idx_d_campanha_id_campanha` (`id_campanha`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_origem ----------
CREATE TABLE IF NOT EXISTS `d_origem` (
  `id_origem` BIGINT NULL,
  `nome_origem` VARCHAR(255) NULL COMMENT 'o.origem (varchar)',
  `data_cadastro` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `data_atualizacao` DATETIME NULL COMMENT 'datetime',
  `ativo` DATETIME NULL COMMENT 'datetime'
,
  KEY `idx_d_origem_id_origem` (`id_origem`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_funil ----------
CREATE TABLE IF NOT EXISTS `d_funil` (
  `id_funil` BIGINT NULL,
  `nome_funil` VARCHAR(255) NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL
,
  KEY `idx_d_funil_id_funil` (`id_funil`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_status_funil ----------
CREATE TABLE IF NOT EXISTS `d_status_funil` (
  `id_status_funil` BIGINT NULL,
  `id_funil` BIGINT NULL,
  `id_status_oportunidade` BIGINT NULL,
  `id_fase_funil` BIGINT NULL,
  `ordem_status` VARCHAR(255) NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL
,
  KEY `idx_d_status_funil_id_status_funil` (`id_status_funil`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_etapa_oportunidade ----------
CREATE TABLE IF NOT EXISTS `d_etapa_oportunidade` (
  `id_status_oportunidade` BIGINT NULL,
  `nome` BIGINT NULL COMMENT 'int',
  `cor` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `tipo` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `sla` VARCHAR(3) NULL COMMENT 'varchar(3)',
  `sla_expira` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `sla_alerta` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `ordem` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `oculto` BIGINT NULL COMMENT 'int',
  `criado_em` BIGINT NULL COMMENT 'int',
  `atualizado_em` DATETIME NULL COMMENT 'datetime',
  `ativo` VARCHAR(3) NULL COMMENT 'varchar(3)'
,
  KEY `idx_d_etapa_oportunidade_id_status_oportunidade` (`id_status_oportunidade`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_equipe ----------
CREATE TABLE IF NOT EXISTS `d_equipe` (
  `id_equipe` BIGINT NULL,
  `nome_equipe` VARCHAR(255) NULL COMMENT 'eq.nome (varchar)',
  `tipo_equipe` VARCHAR(50) NULL COMMENT 'PDV/COBAN/BACK OFFICE/DESPACHANTE/PRE-ATENDIMENTO',
  `id_regional` BIGINT NULL,
  `interna_externa` VARCHAR(3) NULL COMMENT 'I/E (placeholder)',
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL
,
  KEY `idx_d_equipe_id_equipe` (`id_equipe`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_gerente ----------
CREATE TABLE IF NOT EXISTS `d_gerente` (
  `id_gerente` BIGINT NULL,
  `tipo_gerente` VARCHAR(255) NULL,
  `nome_gerente` VARCHAR(255) NULL,
  `email_gerente` VARCHAR(255) NULL,
  `situacao_gerente` VARCHAR(255) NULL,
  `cpf_faturamento` VARCHAR(20) NULL,
  `rg_faturamento` VARCHAR(30) NULL COMMENT 'varchar(30)',
  `email_faturamento` VARCHAR(255) NULL,
  `telefone1_faturamento` VARCHAR(30) NULL COMMENT 'fixo: (11) 3265-4321',
  `telefone2_faturamento` VARCHAR(30) NULL COMMENT 'fixo: (11) 3265-4321',
  `data_admissao` VARCHAR(30) NULL COMMENT 'varchar(30)',
  `data_desligamento` DATETIME NULL,
  `creci` VARCHAR(255) NULL,
  `data_emissao_creci` DATETIME NULL,
  `data_vencimento_creci` DATETIME NULL,
  `taxa_comissionamento` DECIMAL(15,2) NULL,
  `data_expedicao_rg` DATETIME NULL,
  `url_foto_perfil` VARCHAR(500) NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL
,
  KEY `idx_d_gerente_id_gerente` (`id_gerente`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_fase_funil ----------
CREATE TABLE IF NOT EXISTS `d_fase_funil` (
  `id_fase_funil` BIGINT NULL,
  `nome_fase_funil` VARCHAR(255) NULL,
  `ordem_fase_funil` VARCHAR(255) NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL
,
  KEY `idx_d_fase_funil_id_fase_funil` (`id_fase_funil`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_venda ----------
CREATE TABLE IF NOT EXISTS `f_venda` (
  `processo_id` BIGINT NULL COMMENT 'int',
  `quantidade_proponentes` BIGINT NULL COMMENT 'int',
  `processo_unidade_id` BIGINT NULL COMMENT 'int',
  `processo_data_venda` DATE NULL COMMENT 'date',
  `processo_cadastrado_em` DATETIME NULL COMMENT 'datetime',
  `processo_atualizado_em` DATETIME NULL COMMENT 'datetime',
  `processo_data_registro` DATETIME NULL COMMENT 'datetime',
  `processo_agendamento_entrevista` DATETIME NULL COMMENT 'datetime',
  `processo_agendamento_assinatura` DATETIME NULL COMMENT 'datetime',
  `processo_aprovacao_assinatura_ccv` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `processo_aprovacao_assinatura_formularios` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `processo_status` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `processo_evolucao` BIGINT NULL COMMENT 'int',
  `processo_pendencias` BIGINT NULL COMMENT 'int',
  `processo_alertas` BIGINT NULL COMMENT 'int',
  `processo_codigo_relacionamento` VARCHAR(255) NULL,
  `processo_documentacao_validada` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `processo_data_distrato` DATE NULL COMMENT 'date',
  `processo_data_autorizacao_distrato` VARCHAR(20) NULL COMMENT 'date string dd/mm/yyyy',
  `processo_data_finalizacao_distrato` VARCHAR(20) NULL COMMENT 'date string dd/mm/yyyy',
  `processo_data_solicitacao_distrato` DATETIME NULL COMMENT 'datetime',
  `processo_data_assinatura_contrato_if` DATE NULL COMMENT 'date',
  `processo_agencia_financiamento` VARCHAR(15) NULL COMMENT 'varchar(15)',
  `processo_conta_financiamento` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `processo_numero_contrato_if` VARCHAR(30) NULL COMMENT 'varchar(30)',
  `processo_data_liberacao_recurso` DATE NULL COMMENT 'date',
  `processo_data_entrega_contrato_registrado_cliente` VARCHAR(30) NULL COMMENT 'date or empty string',
  `processo_data_liberacao_registro` DATE NULL COMMENT 'date',
  `processo_data_entrega_contrato_registrado_banco` DATE NULL COMMENT 'date',
  `processo_recurso_liberado` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_data` DATE NULL COMMENT 'date',
  `analise_credito_validade` DATE NULL COMMENT 'date',
  `analise_credito_valor_avaliado` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_aprovacao` VARCHAR(10) NULL COMMENT 'varchar(4)',
  `analise_credito_fgts` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_subsidio` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_financiamento` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_parcela_financiamento` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_custas_financiadas` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_renda_validada_banco` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_renda_validada_coban` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `analise_credito_desconto_financiamento` VARCHAR(30) NULL COMMENT 'decimal or empty string',
  `analise_credito_condicionado` VARCHAR(4) NULL COMMENT 'varchar(2)',
  `analise_credito_tabela_financiamento` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `critica_analise_credito_valor_avaliado` VARCHAR(30) NULL COMMENT 'decimal or empty string',
  `critica_analise_credito_data` VARCHAR(30) NULL COMMENT 'date or empty string',
  `critica_analise_credito_validade` VARCHAR(30) NULL COMMENT 'decimal or empty string',
  `critica_analise_credito_fgts` VARCHAR(30) NULL COMMENT 'decimal or empty string',
  `critica_analise_credito_subsidio` VARCHAR(30) NULL COMMENT 'decimal or empty string',
  `critica_analise_credito_financiamento` VARCHAR(30) NULL COMMENT 'decimal or empty string',
  `aprovacao_analise_credito` VARCHAR(20) NULL COMMENT 'varchar(12)',
  `banco_nome` VARCHAR(130) NULL COMMENT 'varchar(130)',
  `empreendimento_id` BIGINT NULL COMMENT 'int',
  `empreendimento_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `empreendimento_demanda_minima` VARCHAR(5) NULL COMMENT 'varchar(5)',
  `etapas_workflow_nome` VARCHAR(130) NULL COMMENT 'varchar(130)',
  `id_fase_etapa` BIGINT NULL COMMENT 'int',
  `id_fase` BIGINT NULL COMMENT 'int',
  `ordem_fase_etapa` BIGINT NULL COMMENT 'int',
  `equipe_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente1_id` BIGINT NULL COMMENT 'int',
  `proponente1_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente1_cpf` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `proponente1_renda` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `proponente1_data_nascimento` DATE NULL COMMENT 'date',
  `proponente1_genero` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `proponente1_idade` BIGINT NULL COMMENT 'int',
  `proponente1_regularidade` VARCHAR(12) NULL COMMENT 'varchar(12)',
  `proponente1_nome_empresa` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente1_telefone_empresa` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `proponente1_celular` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `proponente1_profissao` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente1_cep` VARCHAR(12) NULL COMMENT 'varchar(12)',
  `proponente1_logradouro` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente1_numero` VARCHAR(12) NULL COMMENT 'varchar(12)',
  `proponente1_bairro` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente1_cidade` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente1_uf` VARCHAR(4) NULL COMMENT 'varchar(4)',
  `proponente1_email` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente2_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente2_cpf` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `proponente2_profissao` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente2_email` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente3_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente3_cpf` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `proponente3_profissao` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `proponente3_email` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `id_gerente` BIGINT NULL COMMENT 'int',
  `id_corretor` BIGINT NULL COMMENT 'int',
  `id_equipe` BIGINT NULL COMMENT 'int',
  `gerente_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `corretor_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `operador_coban_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `operador_despachante_nome` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `tipo_unidade_descricao` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `unidade_descricao` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `unidade_modulo` BIGINT NULL COMMENT 'int',
  `unidade_bloco` BIGINT NULL COMMENT 'int',
  `unidade_unidade` VARCHAR(20) NULL COMMENT 'varchar(20)',
  `unidade_faixa_financiamento` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `unidade_valor` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `unidade_valor_liquido` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `unidade_valor_avaliacao` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `unidade_disponibilidade` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `venda_gerada` VARCHAR(6) NULL COMMENT 'varchar(6)',
  `venda_data` DATE NULL COMMENT 'date',
  `venda_contabilizado_em` DATETIME NULL COMMENT 'datetime',
  `pendencias_abertas` BIGINT NULL COMMENT 'int',
  `pendencia_cadastrado_em` DATETIME NULL COMMENT 'datetime',
  `pendencia_prazo_limite` DATETIME NULL COMMENT 'datetime',
  `pendencia_motivo` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `categoria_interacao_descricao` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `distrato_motivo` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `tipo_negociacao` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `processo_renda_bruta` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `processo_id_oportunidade` BIGINT NULL COMMENT 'int',
  `item_venda_valor` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `processo_tipo_analise_credito` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `venda_valor_negociacao_unidade` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)',
  `desconto_total_venda` DECIMAL(15,2) NULL COMMENT 'decimal(15,2)',
  `lead_criado_em` DATETIME NULL COMMENT 'datetime',
  `lead_campanha` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `lead_midia` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `lead_origem` VARCHAR(255) NULL COMMENT 'varchar(255)'
,
  KEY `idx_f_venda_processo_id` (`processo_id`),
  KEY `idx_f_venda_empreendimento_id` (`empreendimento_id`),
  KEY `idx_f_venda_id_fase_etapa` (`id_fase_etapa`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_oportunidade ----------
CREATE TABLE IF NOT EXISTS `f_oportunidade` (
  `data_cadastro` DATETIME NULL,
  `nome_primeiro_envolvido` VARCHAR(255) NULL,
  `email_primeiro_envolvido` VARCHAR(255) NULL,
  `telefone_primeiro_envolvido` VARCHAR(30) NULL COMMENT 'Qualquer outro caso, retorna como está (sem formatação)',
  `cpf_primeiro_envolvido` VARCHAR(20) NULL,
  `rg_primeiro_envolvido` VARCHAR(255) NULL,
  `dn_primeiro_envolvido` INT NULL,
  `genero_primeiro_envolvido` VARCHAR(255) NULL,
  `id_funil` BIGINT NULL,
  `id_oportunidade` BIGINT NULL,
  `id_empreendimento` BIGINT NULL,
  `id_equipe_pre_atendimento` BIGINT NULL,
  `id_gerente_pre_atendimento` BIGINT NULL,
  `id_usuario_pre_atendimento` BIGINT NULL,
  `id_equipe` BIGINT NULL,
  `id_gerente` BIGINT NULL,
  `id_corretor` BIGINT NULL,
  `id_status_oportunidade` BIGINT NULL,
  `id_status_oportunidade_anterior` BIGINT NULL,
  `sla_corretor` INT NULL,
  `data_primeiro_atendimento` DATETIME NULL,
  `data_atualizacao` DATETIME NULL,
  `data_transferencia` DATETIME NULL,
  `id_processo` BIGINT NULL,
  `id_etapa_processo` BIGINT NULL,
  `data_venda` DATETIME NULL,
  `data_venda_contabilizada` DATETIME NULL,
  `id_campanha` BIGINT NULL,
  
  KEY `idx_f_oportunidade_id_oportunidade` (`id_oportunidade`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_lead ----------
CREATE TABLE IF NOT EXISTS `f_lead` (
  `id_oportunidade` BIGINT NULL,
  `id_lead` BIGINT NULL,
  `nome_lead` VARCHAR(255) NULL,
  `email_lead` VARCHAR(255) NULL,
  `telefone_lead` VARCHAR(30) NULL COMMENT 'Qualquer outro caso, retorna como está (sem formatação)',
  `id_empreendimento` BIGINT NULL,
  `id_campanha` BIGINT NULL,
  `id_midia` BIGINT NULL,
  `id_origem` BIGINT NULL,
  `id_canal` BIGINT NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL,
  `informacoes_adicionais` VARCHAR(255) NULL,
  `data_distribuicao` DATETIME NULL,

  KEY `idx_f_lead_id_lead` (`id_lead`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_espelho_de_venda ----------
CREATE TABLE IF NOT EXISTS `f_espelho_de_venda` (
  `id_empreendimento` BIGINT NULL,
  `nome_empreendimento` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `id_unidade` BIGINT NULL COMMENT 'int',
  `disponibilidade` VARCHAR(10) NULL COMMENT 'varchar(10)',
  `descricao_unidade` VARCHAR(50) NULL COMMENT 'varchar(50)',
  `descricao_disponibilidade` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `id_processo` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `data_contrato` DATE NULL COMMENT 'date',
  `data_atualizacao` DATETIME NULL COMMENT 'datetime',
  `data_cadastro` DATETIME NULL COMMENT 'datetime',
  `valor_unidade` DECIMAL(15,2) NULL COMMENT 'decimal(10,2)'
,
  KEY `idx_f_espelho_de_venda_id_unidade` (`id_unidade`),
  KEY `idx_f_espelho_de_venda_id_empreendimento` (`id_empreendimento`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_unidade ----------
CREATE TABLE IF NOT EXISTS `f_unidade` (
  `id_unidade` BIGINT NULL,
  `id_empreendimento` BIGINT NULL COMMENT 'int',
  `id_processo` BIGINT NULL COMMENT 'int',
  `descricao` BIGINT NULL COMMENT 'int',
  `bloco` VARCHAR(100) NULL COMMENT 'varchar(100)',
  `pavimento` BIGINT NULL COMMENT 'int',
  `unidade` BIGINT NULL COMMENT 'int',
  `disponibilidade` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `tipologia` VARCHAR(100) NULL COMMENT 'varchar (100)',
  `tipo_comercializacao` VARCHAR(100) NULL COMMENT 'varchar (100)',
  `posicao` VARCHAR(50) NULL COMMENT 'varchar (50)',
  `valor_venal_atual_padrao` VARCHAR(50) NULL COMMENT 'varchar (50)',
  `valor_avaliacao_padrao` DECIMAL(15,2) NULL COMMENT 'deciaml(10,2)',
  `area_privativa_total` DECIMAL(15,4) NULL COMMENT 'deciaml(10,2)',
  `area_exclusiva_total` DECIMAL(15,4) NULL COMMENT 'deciaml(10,2)',
  `area_comum_total` DECIMAL(15,4) NULL COMMENT 'deciaml(10,2)',
  `area_acessoria_total` DECIMAL(15,4) NULL COMMENT 'deciaml(10,2)',
  `fracao_ideal` DECIMAL(15,4) NULL COMMENT 'deciaml(10,2)',
  `valor_fracao_ideal` DECIMAL(15,2) NULL COMMENT 'deciaml(10,2)',
  `data_cadastro` DATETIME NULL COMMENT 'deciaml(10,2)',
  `data_atualizacao` DATETIME NULL COMMENT 'datetime'
,
  KEY `idx_f_unidade_id_unidade` (`id_unidade`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_atendimento_oportunidade ----------
CREATE TABLE IF NOT EXISTS `f_atendimento_oportunidade` (
  `id_oportunidade_atendimento` BIGINT NULL,
  `tipo_atendimento` VARCHAR(255) NULL,
  `titulo_atendimento` VARCHAR(255) NULL,
  `observacao_atendimento` TEXT NULL,
  `tarefa_realizada` VARCHAR(255) NULL,
  `data_inicial_atendimento` DATETIME NULL,
  `data_final_atendimento` DATETIME NULL,
  `data_atendimento` DATETIME NULL,
  `data_criacao_atendimento` DATETIME NULL COMMENT "oa.hora as \\'hora_atendimento\\',",
  `data_conclusao_atendimento` DATETIME NULL,
  `data_atualizacao_atendimento` DATETIME NULL,
  `ativo` VARCHAR(10) NULL
,
  KEY `idx_f_atendimento_oportunidade_id_oportunidade_atendimento` (`id_oportunidade_atendimento`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_descarte ----------
CREATE TABLE IF NOT EXISTS `f_descarte` (
  `id_descarte` BIGINT NULL,
  `id_oportunidade` BIGINT NULL COMMENT 'int',
  `motivo_descarte` BIGINT NULL COMMENT 'int',
  `consideracoes` TEXT NULL COMMENT 'text',
  `id_etapa_anterior` TEXT NULL COMMENT 'text',
  `data_cadastro` BIGINT NULL COMMENT 'int',
  `data_atualizacao` DATETIME NULL COMMENT 'datetime',
  `id_responsavel` DATETIME NULL COMMENT 'datetime',
  `id_etapa_atual` BIGINT NULL COMMENT 'int'
,
  KEY `idx_f_descarte_id_descarte` (`id_descarte`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_distrato ----------
CREATE TABLE IF NOT EXISTS `f_distrato` (
  `processo_id` BIGINT NULL,
  `processo_id_oportunidade` BIGINT NULL,
  `empreendimento_id` BIGINT NULL,
  `empreendimento_nome` VARCHAR(255) NULL,
  `data_distrato` DATE NULL,
  `motivo_distrato` VARCHAR(255) NULL,
  `lead_campanha` VARCHAR(255) NULL,
  `lead_midia` VARCHAR(255) NULL,
  `lead_origem` VARCHAR(255) NULL,
  KEY `idx_f_distrato_processo_id` (`processo_id`),
  KEY `idx_f_distrato_data_distrato` (`data_distrato`),
  KEY `idx_f_distrato_empreendimento_id` (`empreendimento_id`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_visita ----------
CREATE TABLE IF NOT EXISTS `f_visita` (
  `id_visita` BIGINT NULL COMMENT 'int',
  `id_empreendimento` BIGINT NULL COMMENT 'int',
  `id_oportunidade` BIGINT NULL COMMENT 'int',
  `id_criador_visita` BIGINT NULL COMMENT 'int',
  `id_responsavel_visita` BIGINT NULL COMMENT 'int',
  `id_concluiu_visita` BIGINT NULL COMMENT 'int',
  `local_visita` VARCHAR(255) NULL COMMENT 'varchar(255)',
  `visita_realizada` VARCHAR(10) NULL COMMENT 'Sim/Nao',
  `data_visita` DATETIME NULL COMMENT 'concat data + hora',
  `data_conclusao_visita` DATETIME NULL COMMENT 'datetime',
  `data_cadastro` DATETIME NULL COMMENT 'datetime',
  `data_atualizacao` DATETIME NULL COMMENT 'datetime',
  `tipo_visita` VARCHAR(255) NULL COMMENT 'varchar(255)'
,
  KEY `idx_f_visita_id_visita` (`id_visita`),
  KEY `idx_f_visita_id_oportunidade` (`id_oportunidade`),
  KEY `idx_f_visita_id_empreendimento` (`id_empreendimento`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_etapa_funil ----------
-- Dimensao canonica com 7 fases do funil de vendas (dados FIXOS hardcoded
-- pelo sincronizador, nao espelha tabela do CRM).
-- Equivale ao d_funil do projeto crd, renomeado aqui para nao colidir
-- com o d_funil ja existente (que espelha crm_inquilino_0040.funil).
CREATE TABLE IF NOT EXISTS `d_etapa_funil` (
  `id_etapa_funil`     INT          NOT NULL,
  `nome_etapa_funil`   VARCHAR(255) NULL,
  `ordem_etapa_funil`  INT          NULL,
  PRIMARY KEY (`id_etapa_funil`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_funil ----------
-- Uma linha por (oportunidade, status_destino): cada transicao de etapa
-- consolidada via GROUP BY (id_oportunidade, id_status_destino) com a ultima
-- info join'ada de oportunidade + lead_oportunidade + lead.
CREATE TABLE IF NOT EXISTS `f_funil` (
  `id_oportunidade`     BIGINT   NULL,
  `id_etapa_origem`     BIGINT   NULL COMMENT 'cso.id_status_origem (0 quando NULL)',
  `id_etapa_destino`    BIGINT   NULL COMMENT 'cso.id_status_destino',
  `id_etapa_atual`      BIGINT   NULL COMMENT 'o.id_status_oportunidade (atual)',
  `id_etapa_funil`      INT      NULL COMMENT 'FK -> d_etapa_funil.id_etapa_funil (1..7)',
  `data_lead`           DATETIME NULL,
  `id_campanha`         BIGINT   NULL,
  `id_origem`           BIGINT   NULL,
  `id_midia`            BIGINT   NULL,
  `id_gerente_pdv`      BIGINT   NULL,
  `id_equipe_pdv`       BIGINT   NULL,
  `id_corretor`         BIGINT   NULL,
  `id_processo`         BIGINT   NULL,
  `id_empreendimento`   BIGINT   NULL,
  KEY `idx_f_funil_id_oportunidade` (`id_oportunidade`),
  KEY `idx_f_funil_id_etapa_funil`  (`id_etapa_funil`),
  KEY `idx_f_funil_data_lead`       (`data_lead`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_investimento ----------
-- Uma linha por midia_custo (com sua respectiva campanha e empreendimento).
-- Origem: crm_inquilino_0040.midia_custo + campanha_midia + campanha_empreendimento.
CREATE TABLE IF NOT EXISTS `f_investimento` (
  `id_midia_custo`        BIGINT        NULL COMMENT 'PK paginacao',
  `valor_investimento`    DECIMAL(15,2) NULL COMMENT 'mc.custo_estimado',
  `id_midia`              BIGINT        NULL,
  `id_campanha`           BIGINT        NULL,
  `id_empreendimento`     BIGINT        NULL,
  `data_investimento`     DATE          NULL COMMENT 'mc.ano-mc.mes-01',
  KEY `idx_f_investimento_id_midia_custo`    (`id_midia_custo`),
  KEY `idx_f_investimento_data_investimento` (`data_investimento`),
  KEY `idx_f_investimento_id_midia`          (`id_midia`),
  KEY `idx_f_investimento_id_campanha`       (`id_campanha`),
  KEY `idx_f_investimento_id_empreendimento` (`id_empreendimento`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_usuario ----------
CREATE TABLE IF NOT EXISTS `d_usuario` (
  `id_usuario` BIGINT NULL COMMENT 'int',
  `tipo_usuario` VARCHAR(255) NULL,
  `nome_usuario` VARCHAR(255) NULL,
  `email_usuario` VARCHAR(255) NULL,
  `situacao_usuario` VARCHAR(10) NULL COMMENT 'ATIVO/INATIVO',
  `cpf_faturamento` VARCHAR(20) NULL,
  `rg_faturamento` VARCHAR(30) NULL,
  `email_faturamento` VARCHAR(255) NULL,
  `telefone1_faturamento` VARCHAR(30) NULL,
  `telefone2_faturamento` VARCHAR(30) NULL,
  `data_admissao` DATETIME NULL,
  `data_desligamento` DATETIME NULL,
  `creci` VARCHAR(255) NULL,
  `data_emissao_creci` DATETIME NULL,
  `data_vencimento_creci` DATETIME NULL,
  `taxa_comissionamento` DECIMAL(15,2) NULL,
  `data_expedicao_rg` DATETIME NULL,
  `url_foto_perfil` TEXT NULL,
  `data_cadastro` DATETIME NULL,
  `data_atualizacao` DATETIME NULL
,
  KEY `idx_d_usuario_id_usuario` (`id_usuario`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- d_usuario_gu ----------
-- Usuarios autorizados a logar no dashboard.
-- Origem: dommus_infratecnica.tb_sgg3_autenticacao + tb_sgg3_tipo_usuario
-- Filtra apenas usuarios ativos do tipo 3 (perfil de acesso).
CREATE TABLE IF NOT EXISTS `d_usuario_gu` (
  `id_usuario`     BIGINT       NULL COMMENT 'tb_sgg3_autenticacao.id (PK)',
  `emails_usario`  VARCHAR(255) NULL,
  `password`       VARCHAR(255) NULL COMMENT 'a.autenticacao',
  `id_perfil`      BIGINT       NULL,
  `perfil_usuario` VARCHAR(255) NULL,
  KEY `idx_d_usuario_gu_id_usuario` (`id_usuario`),
  KEY `idx_d_usuario_gu_emails_usario` (`emails_usario`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_evolucao_processo ----------
-- Origem: dommus_infratecnica.view_controle_sla_mais_recentes
-- Cada linha = uma transicao de etapa do processo (etapa_original -> etapa_workflow)
CREATE TABLE IF NOT EXISTS `f_evolucao_processo` (
  `id`                 BIGINT   NULL COMMENT 'PK de paginacao (view_controle_sla_mais_recentes.id)',
  `id_processo`        BIGINT   NULL,
  `id_etapa_anterior`  BIGINT   NULL COMMENT 'etapa_original',
  `id_etapa_atual`     BIGINT   NULL COMMENT 'etapa_workflow',
  `data_cadastro`      DATETIME NULL,
  KEY `idx_f_evolucao_processo_id`            (`id`),
  KEY `idx_f_evolucao_processo_processo`      (`id_processo`),
  KEY `idx_f_evolucao_processo_data_cadastro` (`data_cadastro`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------- d_fase_etapa ----------
-- Origem: dommus_infratecnica.tb_etapas_workflow (self-join nivel/subnivel)
-- Mapeia cada etapa do workflow para sua fase canonica do funil
CREATE TABLE IF NOT EXISTS `d_fase_etapa` (
  `id_fase_etapa`  BIGINT       NULL COMMENT 'tb_etapas_workflow.id (PK paginacao)',
  `id_fase`        BIGINT       NULL COMMENT 'fase canonica (subnivel=0)',
  `fase_da_etapa`  VARCHAR(255) NULL COMMENT 'nome da fase canonica',
  KEY `idx_d_fase_etapa_id_fase_etapa` (`id_fase_etapa`),
  KEY `idx_d_fase_etapa_id_fase`       (`id_fase`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- f_historico_etapa_processo ----------
-- Origem: dommus_infratecnica.tb_controle_sla (historico COMPLETO de transicoes)
-- Diferente de f_evolucao_processo (que usa a view view_controle_sla_mais_recentes
-- e traz apenas o registro mais recente por processo/etapa).
-- Cada linha = uma transicao de etapa do processo (etapa_original -> etapa_workflow),
-- com os nomes resolvidos via tb_etapas_workflow.
CREATE TABLE IF NOT EXISTS `f_historico_etapa_processo` (
  `id`                            BIGINT       NULL COMMENT 'tb_controle_sla.id (PK paginacao)',
  `id_processo`                   BIGINT       NULL,
  `id_etapa_workflow_anterior`    BIGINT       NULL COMMENT 'tb_controle_sla.etapa_original',
  `etapa_workflow_anterior`       VARCHAR(255) NULL COMMENT 'tb_etapas_workflow.nome (anterior)',
  `id_etapa_workflow_atual`       BIGINT       NULL COMMENT 'tb_controle_sla.etapa_workflow',
  `etapa_workflow_atual`          VARCHAR(255) NULL COMMENT 'tb_etapas_workflow.nome (atual)',
  `cadastrado_em`                 DATETIME     NULL COMMENT 'tb_controle_sla.data_hora',
  KEY `idx_f_historico_etapa_processo_id`             (`id`),
  KEY `idx_f_historico_etapa_processo_id_processo`    (`id_processo`),
  KEY `idx_f_historico_etapa_processo_cadastrado_em`  (`cadastrado_em`)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------- meta_etl_execucao (auditoria de execucoes do pipeline) ----------
-- Cada execucao do orquestrador (etl_inquilino_0040_infratecnica_executa_pipeline.py)
-- registra uma linha aqui: iniciado_em (UTC) ao comecar, e atualiza
-- concluido_em + status ('ok' ou 'erro') ao terminar. O Sidebar le
-- a ultima execucao com status='ok' via /api/data/etl-status e exibe
-- "Atualizado em ..." (timezone convertido no navegador).
CREATE TABLE IF NOT EXISTS `meta_etl_execucao` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `iniciado_em` DATETIME NOT NULL,
  `concluido_em` DATETIME NULL,
  `status` VARCHAR(20) DEFAULT 'em_progresso',
  `scripts_executados` INT DEFAULT 0,
  `scripts_pulados` INT DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_concluido_em` (`concluido_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
