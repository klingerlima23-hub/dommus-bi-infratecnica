'use client';

import { useEffect, useMemo, useState } from 'react';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import PieChart from '@/components/charts/PieChart';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtMoeda } from '@/lib/format';
import { COR_PRIMARIA } from '@/lib/paleta';
import { urlOportunidade } from '@/lib/urls';

// ---------------------------------------------------------------
// Dashboard Danilo -- contratos do funil id=9 (comercial)
//
// Regras (definidas em conversa):
//   - Dataset: apenas f_oportunidade.id_funil = 9 (aplicado no endpoint)
//   - "Parado" = sem data_atualizacao ha mais de 15 dias
//   - Sem estimativa de valor (deixado de fora nesta iteracao)
//   - Aba principal (fora de Vendas/Lead)
//
// Timezone: T00:00:00 no start ee T23:59:59 no end (camada 3 do fix).
// ---------------------------------------------------------------

interface Row {
  id_oportunidade: number;
  id_funil: number | null;
  lead_nome: string | null;
  lead_email: string | null;
  lead_telefone: string | null;
  id_empreendimento: number | null;
  nome_empreendimento: string | null;
  id_gerente: number | null;
  nome_gerente: string | null;
  id_corretor: number | null;
  nome_corretor: string | null;
  id_equipe: number | null;
  id_status_oportunidade: number | null;
  status_oportunidade: string | null;
  ordem_status: number | null;
  id_processo: number | null;
  id_campanha: number | null;
  nome_campanha: string | null;
  data_cadastro: string | null;
  data_atualizacao: string | null;
  data_primeiro_atendimento: string | null;
  data_venda: string | null;
  data_venda_contabilizada: string | null;
  dias_sem_atualizacao: number | null;
  valor_estimado: number | string | null;
  valor_real: number | string | null;
  tipo_mercado: string | null;
  tipo_segmento: string | null;
  [key: string]: unknown;
}

function defaultDateRange() {
  const now = new Date();
  // Ano inteiro por padrao -- funil comercial tem ciclo longo, mes corrente
  // ficaria pouco representativo. Usuario pode ajustar via filtro.
  const start = new Date(now.getFullYear(), 0, 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

export default function DashboardDanilo() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [period, setPeriod] = useState(defaultDateRange());
  const [statusSel, setStatusSel] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/data/danilo')
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? 'Erro');
        return r.json();
      })
      .then((j) => alive && setRows(j.rows ?? []))
      .catch((e) => alive && setErro(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const ini = new Date(period.start + 'T00:00:00');
    const fim = new Date(period.end + 'T23:59:59');
    return rows.filter((r) => {
      if (!r.data_cadastro) return false;
      const d = new Date(r.data_cadastro);
      if (d < ini || d > fim) return false;
      if (statusSel.length && !statusSel.includes(r.status_oportunidade || '')) return false;
      return true;
    });
  }, [rows, period, statusSel]);

  // Opcoes do filtro Status -- montadas do dataset completo.
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.status_oportunidade).filter((x): x is string => !!x))).sort(),
    [rows],
  );

  // Helper: DECIMAL do MySQL vem como string via mysql2 (preserva
  // precisao). Converte pra number, com fallback pra 0 se null/invalido.
  const num = (v: number | string | null | undefined): number => {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : 0;
  };

  // KPIs
  const total = filtered.length;
  const valorEstimadoTotal = filtered.reduce((s, r) => s + num(r.valor_estimado), 0);
  const valorRealTotal = filtered.reduce((s, r) => s + num(r.valor_real), 0);

  // Helper: agrupa `filtered` por uma chave (funcao) e devolve entries
  // com qtd + soma de valor_estimado / valor_real (para o tooltip).
  function agruparComExtras(keyFn: (r: Row) => string) {
    type Agg = { qtd: number; estimado: number; real: number };
    const map = new Map<string, Agg>();
    for (const r of filtered) {
      const k = keyFn(r);
      const cur = map.get(k) || { qtd: 0, estimado: 0, real: 0 };
      cur.qtd += 1;
      cur.estimado += num(r.valor_estimado);
      cur.real += num(r.valor_real);
      map.set(k, cur);
    }
    return map;
  }

  // Distribuicao por etapa do funil -- ordenacao SEMPRE pelo campo `ordem`
  // de dw_infratecnica.d_etapa_oportunidade (chega no endpoint como
  // `ordem_status` via `etp.ordem` no JOIN). Sort ASCENDENTE (a - b)
  // deixa a etapa de MENOR ordem (inicio do funil) no TOPO e a de MAIOR
  // ordem (fechamento) embaixo -- ordem visual "de cima pra baixo"
  // acompanha o avanco no funil.
  const porStatus = useMemo(() => {
    type Agg = { qtd: number; estimado: number; real: number; ordem: number };
    const map = new Map<string, Agg>();
    for (const r of filtered) {
      const k = r.status_oportunidade || 'Sem status';
      // Converte explicitamente pra number (mysql2 as vezes devolve
      // como string) e cai em Infinity se nao for finito, jogando
      // etapas sem ordem pro fim.
      const ordemNum = Number(r.ordem_status);
      const ordem = Number.isFinite(ordemNum) ? ordemNum : Number.POSITIVE_INFINITY;
      const cur = map.get(k) || { qtd: 0, estimado: 0, real: 0, ordem };
      cur.qtd += 1;
      cur.estimado += num(r.valor_estimado);
      cur.real += num(r.valor_real);
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].ordem - b[1].ordem)
      .map(([key, v]) => ({
        key,
        value: v.qtd,
        extras: [
          { label: 'Valor Estimado', value: fmtMoeda(v.estimado) },
          { label: 'Valor Real', value: fmtMoeda(v.real) },
        ],
      }));
  }, [filtered]);

  // Distribuicao por Tipo de Segmento (Agronegocio, Loteamento, etc)
  const porSegmento = useMemo(() => {
    const map = agruparComExtras((r) => r.tipo_segmento || 'Sem segmento');
    return Array.from(map.entries())
      .sort((a, b) => b[1].qtd - a[1].qtd)
      .map(([key, v]) => ({
        key,
        value: v.qtd,
        extras: [
          { label: 'Valor Estimado', value: fmtMoeda(v.estimado) },
          { label: 'Valor Real', value: fmtMoeda(v.real) },
        ],
      }));
    // agruparComExtras usa `filtered` internamente, mas ele nao e' um
    // valor no escopo do useMemo; ainda assim capturamos filtered nas deps
    // pra recomputar quando os filtros mudarem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  // Distribuicao por Tipo de Mercado (Privado / Publico)
  const porMercado = useMemo(() => {
    const map = agruparComExtras((r) => r.tipo_mercado || 'Sem mercado');
    return Array.from(map.entries())
      .sort((a, b) => b[1].qtd - a[1].qtd)
      .map(([key, v]) => ({
        key,
        value: v.qtd,
        extras: [
          { label: 'Valor Estimado', value: fmtMoeda(v.estimado) },
          { label: 'Valor Real', value: fmtMoeda(v.real) },
        ],
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  // Tabela detalhada
  const dataTabela = filtered.map((r) => ({
    id_oportunidade: r.id_oportunidade,
    lead_nome: r.lead_nome ?? '',
    nome_empreendimento: r.nome_empreendimento ?? '',
    status_oportunidade: r.status_oportunidade ?? '',
    tipo_mercado: r.tipo_mercado ?? '',
    tipo_segmento: r.tipo_segmento ?? '',
    valor_estimado: num(r.valor_estimado),
    valor_real: num(r.valor_real),
    nome_corretor: r.nome_corretor ?? '',
    nome_gerente: r.nome_gerente ?? '',
    data_cadastro: r.data_cadastro,
    data_atualizacao: r.data_atualizacao,
    dias_sem_atualizacao: r.dias_sem_atualizacao,
    nome_campanha: r.nome_campanha ?? '',
  }));

  type Linha = (typeof dataTabela)[number];

  const columns: Column<Linha>[] = [
    { key: 'id_oportunidade', label: 'OPV', type: 'number' },
    { key: 'lead_nome', label: 'Lead', type: 'string' },
    { key: 'nome_empreendimento', label: 'Empreendimento', type: 'string' },
    { key: 'status_oportunidade', label: 'Status', type: 'string' },
    { key: 'tipo_mercado', label: 'Mercado', type: 'string' },
    { key: 'tipo_segmento', label: 'Segmento', type: 'string' },
    { key: 'valor_estimado', label: 'Valor Estimado', type: 'money' },
    { key: 'valor_real', label: 'Valor Real', type: 'money' },
    { key: 'nome_corretor', label: 'Corretor', type: 'string' },
    { key: 'nome_gerente', label: 'Gerente', type: 'string' },
    { key: 'data_cadastro', label: 'Data Cadastro', type: 'date' },
    { key: 'data_atualizacao', label: 'Ult. Atualizacao', type: 'date' },
    { key: 'dias_sem_atualizacao', label: 'Dias Parado', type: 'number' },
    { key: 'nome_campanha', label: 'Campanha', type: 'string', uppercase: true },
  ];

  if (loading) return <LoadingState message="Carregando contratos do funil comercial..." />;

  if (erro) {
    return (
      <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] rounded-md p-4 text-sm">
        {erro}
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <DateRangeFilter
          label="Periodo (data cadastro)"
          start={period.start}
          end={period.end}
          onChange={(s, e) => setPeriod({ start: s, end: e })}
        />
        <MultiSelectFilter label="Status" options={statusOptions} selected={statusSel} onChange={setStatusSel} />
      </div>

      {/* KPIs */}
      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          titulo="Contratos no Funil"
          valor={fmtInt(total)}
          legenda="Total no periodo selecionado"
        />
        <KPICard
          titulo="Valor Estimado Total"
          valor={fmtMoeda(valorEstimadoTotal)}
          legenda="Soma dos valores estimados dos contratos filtrados"
        />
        <KPICard
          titulo="Valor Real Total"
          valor={fmtMoeda(valorRealTotal)}
          legenda="Soma dos valores reais dos contratos filtrados"
          estilo="success"
        />
      </div>

      {/* Graficos: 3 lado a lado (etapa / segmento / mercado) */}
      <SectionTitle>Distribuicao</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Por Etapa do Funil" height={360}>
          <HBarChart data={porStatus} color={COR_PRIMARIA} />
        </ChartCard>
        <ChartCard title="Contratos por Segmento" height={360}>
          <PieChart data={porSegmento} donut centerSubtitle="Contratos" legendToggleable />
        </ChartCard>
        <ChartCard title="Contratos por Tipo de Mercado" height={360}>
          <PieChart data={porMercado} donut centerSubtitle="Contratos" legendToggleable />
        </ChartCard>
      </div>

      {/* Tabela detalhada */}
      <SectionTitle>Detalhe dos Contratos</SectionTitle>
      <DataTable
        rows={dataTabela}
        columns={columns}
        filename="danilo-contratos.csv"
        rowLink={(r) => urlOportunidade(r.id_oportunidade)}
      />
    </div>
  );
}
