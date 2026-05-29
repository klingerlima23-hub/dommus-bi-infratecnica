'use client';

import { useEffect, useMemo, useState } from 'react';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import StackedHBarChart from '@/components/charts/StackedHBarChart';
import PeriodChart from '@/components/charts/PeriodChart';
import RadioGroup from '@/components/filters/RadioGroup';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import SelectFilter from '@/components/filters/SelectFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtMoeda, fmtPct, bucketDate, groupByCount, type Granularidade } from '@/lib/format';
import { COR_PRIMARIA } from '@/lib/paleta';

interface Row {
  processo_id: number;
  processo_unidade_id: number | null;
  processo_data_venda: string | null;
  processo_cadastrado_em: string | null;
  empreendimento_nome: string;
  equipe_nome: string;
  analise_credito_financiamento: number | null;
  unidade_valor_avaliacao: number | null;
  unidade_valor_liquido: number | null;
  venda_contabilizado_em: string | null;
  etapas_workflow_nome: string;
  lead_criado_em: string | null;
  lead_campanha: string;
  lead_origem: string;
  lead_midia: string;
  gerente_nome: string;
  corretor_nome: string;
  tipo_negociacao: string;
}

const METRICAS = ['Cadastros', 'Pastas', 'Venda', 'Reprovados', 'Reprovado Instituicao'] as const;
type Metrica = (typeof METRICAS)[number];

const GRANS = ['Dia', 'Semana', 'Mes', 'Trimestre', 'Ano'] as const;

function defaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

/** Normaliza string para comparacao: upper + strip + remove acentos
 * (replica _norm_etapa do v001) */
function normEtapa(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // remove diacriticos (acentos, til, cedilha)
}

/** Regras de metrica (Mundo Apto):
 * - Cadastros: tem processo_cadastrado_em preenchido
 * - Pastas:    tem processo_data_venda preenchido (a "venda" do CRM ja' representa
 *              a entrada em pasta no fluxo do cliente)
 * - Venda:     tem venda_contabilizado_em preenchido (etapa contabil posterior)
 * - Reprovados / Reprovado Instituicao: mantem regra por etapa_workflow_nome
 */
function aplicarMetrica(rows: Row[], metrica: Metrica): Row[] {
  switch (metrica) {
    case 'Cadastros':
      return rows.filter((r) => r.processo_cadastrado_em);
    case 'Pastas':
      return rows.filter((r) => !!r.processo_data_venda);
    case 'Venda':
      return rows.filter((r) => !!r.venda_contabilizado_em);
    case 'Reprovados':
      return rows.filter((r) => {
        const e = normEtapa(r.etapas_workflow_nome);
        return e === 'DOCUMENTACAO REPROVADA' || e === 'DOCUMENTACAO REPROVADA (IRREGULAR)';
      });
    case 'Reprovado Instituicao':
      return rows.filter((r) => normEtapa(r.etapas_workflow_nome) === 'REPROVADO PELA INSTITUICAO FINANCEIRA');
  }
}

/** Coluna de VGV por métrica */
function vgvCol(m: Metrica): keyof Row | null {
  if (m === 'Pastas') return 'analise_credito_financiamento';
  if (m === 'Venda') return 'unidade_valor_liquido';
  return null;
}

/** Campo de data para o filtro de periodo, por metrica.
 * - Pastas: filtra por processo_data_venda (entrada em pasta)
 * - Venda:  filtra por venda_contabilizado_em (contabilizacao)
 * - Demais (Cadastros, Reprovados, Reprovado Instituicao): processo_cadastrado_em. */
function dateFieldFor(m: Metrica): keyof Row {
  if (m === 'Pastas') return 'processo_data_venda';
  if (m === 'Venda') return 'venda_contabilizado_em';
  return 'processo_cadastrado_em';
}

function periodLabelFor(m: Metrica): string {
  if (m === 'Pastas') return 'Período (data de venda)';
  if (m === 'Venda') return 'Período (data de contabilização)';
  return 'Período (data de cadastro)';
}

/** Aplica filtro de periodo num dataset baseado em um campo de data. */
function filtrarPorPeriodo(
  rows: Row[],
  dateField: keyof Row,
  period: { start: string; end: string },
): Row[] {
  const ini = new Date(period.start);
  const fim = new Date(period.end + 'T23:59:59');
  return rows.filter((r) => {
    const v = r[dateField];
    if (!v) return false;
    const d = new Date(v as string);
    return d >= ini && d <= fim;
  });
}

export default function VendasVisaoAtual() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [metrica, setMetrica] = useState<Metrica>('Cadastros');
  const [period, setPeriod] = useState(defaultDateRange());
  const [gran, setGran] = useState<Granularidade>('Mes');
  const [empSel, setEmpSel] = useState<string[]>([]);
  const [etapaSel, setEtapaSel] = useState<string[]>([]);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/data/vendas')
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

  // dataset filtrado APENAS por empreendimento + etapa (sem data ainda),
  // porque o campo de data muda conforme a metrica.
  const baseEmpEtapa = useMemo(
    () =>
      rows.filter((r) => {
        if (empSel.length && !empSel.includes(r.empreendimento_nome)) return false;
        if (etapaSel.length && !etapaSel.includes(r.etapas_workflow_nome)) return false;
        return true;
      }),
    [rows, empSel, etapaSel],
  );

  // dataset por métrica (alimenta gráficos): aplica a data certa pra essa metrica
  const dfMetrica = useMemo(() => {
    const filtradoPeriodo = filtrarPorPeriodo(baseEmpEtapa, dateFieldFor(metrica), period);
    return aplicarMetrica(filtradoPeriodo, metrica);
  }, [baseEmpEtapa, period, metrica]);

  // KPIs: cada metrica usa SEU proprio campo de data (Venda filtra por contabilizacao,
  // demais filtram por cadastro).
  const dfCad = useMemo(
    () => aplicarMetrica(filtrarPorPeriodo(baseEmpEtapa, dateFieldFor('Cadastros'), period), 'Cadastros'),
    [baseEmpEtapa, period],
  );
  const dfPas = useMemo(
    () => aplicarMetrica(filtrarPorPeriodo(baseEmpEtapa, dateFieldFor('Pastas'), period), 'Pastas'),
    [baseEmpEtapa, period],
  );
  const dfVen = useMemo(
    () => aplicarMetrica(filtrarPorPeriodo(baseEmpEtapa, dateFieldFor('Venda'), period), 'Venda'),
    [baseEmpEtapa, period],
  );
  const dfRep = useMemo(
    () => aplicarMetrica(filtrarPorPeriodo(baseEmpEtapa, dateFieldFor('Reprovados'), period), 'Reprovados'),
    [baseEmpEtapa, period],
  );
  const dfRepIf = useMemo(
    () =>
      aplicarMetrica(
        filtrarPorPeriodo(baseEmpEtapa, dateFieldFor('Reprovado Instituicao'), period),
        'Reprovado Instituicao',
      ),
    [baseEmpEtapa, period],
  );

  const totalCad = dfCad.length;
  const totalPas = dfPas.length;
  const totalVen = dfVen.length;
  const totalRep = dfRep.length;
  const totalRepIf = dfRepIf.length;
  const pctPas = totalCad ? (totalPas / totalCad) * 100 : 0;
  const pctVen = totalPas ? (totalVen / totalPas) * 100 : 0;
  const pctRep = totalCad ? (totalRep / totalCad) * 100 : 0;
  const pctRepIf = totalCad ? (totalRepIf / totalCad) * 100 : 0;
  const vgvPas = dfPas.reduce((s, r) => s + (Number(r.analise_credito_financiamento) || 0), 0);
  const vgvVen = dfVen.reduce((s, r) => s + (Number(r.unidade_valor_liquido) || 0), 0);

  // opções de filtros
  const empOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.empreendimento_nome).filter(Boolean))).sort(),
    [rows]
  );
  const etapaOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.etapas_workflow_nome).filter(Boolean))).sort(),
    [rows]
  );

  // séries de etapas para os stacked charts (top etapas presentes na métrica)
  const etapasSeries = useMemo(
    () => Array.from(new Set(dfMetrica.map((r) => r.etapas_workflow_nome).filter(Boolean))).slice(0, 10),
    [dfMetrica]
  );

  // helper: agrupa por dim (corretor/equipe/empreendimento) com etapa como sub-stack
  function stackedByDim(dim: keyof Row, topN = 15) {
    const totals = new Map<string, number>();
    const buckets = new Map<string, Record<string, number>>();
    for (const r of dfMetrica) {
      const k = String(r[dim] ?? '').trim();
      if (!k) continue;
      const e = r.etapas_workflow_nome || 'Outros';
      totals.set(k, (totals.get(k) ?? 0) + 1);
      const obj = buckets.get(k) ?? {};
      obj[e] = (obj[e] ?? 0) + 1;
      buckets.set(k, obj);
    }
    const top = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    return top.map(([key]) => {
      const obj: Record<string, string | number> = { key };
      for (const e of etapasSeries) obj[e] = buckets.get(key)?.[e] ?? 0;
      return obj;
    });
  }

  // por período (com VGV se métrica tiver) — usa a data propria da metrica
  // (cadastro pra Cadastros/Pastas/Reprovados; contabilizacao pra Venda)
  const perPeriodo = useMemo(() => {
    const vgv = vgvCol(metrica);
    const df = dateFieldFor(metrica);
    const map = new Map<string, { qtd: number; vgv: number }>();
    for (const r of dfMetrica) {
      const v = r[df];
      if (!v) continue;
      const d = new Date(v as string);
      const k = bucketDate(d, gran);
      const cur = map.get(k) ?? { qtd: 0, vgv: 0 };
      cur.qtd += 1;
      if (vgv) cur.vgv += Number(r[vgv]) || 0;
      map.set(k, cur);
    }
    return Array.from(map.entries()).map(([periodo, v]) => ({ periodo, qtd: v.qtd, vgv: v.vgv }));
  }, [dfMetrica, gran, metrica]);

  // tabela
  const colunasTabela: Column<Row>[] = [
    { key: 'processo_id', label: 'Processo', type: 'number' },
    { key: 'processo_unidade_id', label: 'Unidade', type: 'number' },
    { key: 'processo_cadastrado_em', label: 'Data Cadastro', type: 'datetime' },
    { key: 'processo_data_venda', label: 'Data Venda', type: 'date' },
    { key: 'venda_contabilizado_em', label: 'Data Contabil.', type: 'date' },
    { key: 'empreendimento_nome', label: 'Empreendimento' },
    { key: 'equipe_nome', label: 'Equipe' },
    { key: 'corretor_nome', label: 'Corretor' },
    { key: 'unidade_valor_avaliacao', label: 'Vlr Avaliacao', type: 'money' },
    { key: 'analise_credito_financiamento', label: 'Vlr Financiamento', type: 'money' },
    { key: 'unidade_valor_liquido', label: 'Vlr Liquido Unid.', type: 'money' },
    { key: 'etapas_workflow_nome', label: 'Etapa Workflow' },
    { key: 'lead_criado_em', label: 'Data Lead', type: 'datetime' },
    { key: 'lead_campanha', label: 'Campanha' },
    { key: 'lead_origem', label: 'Origem Lead' },
    { key: 'lead_midia', label: 'Midia' },
    { key: 'tipo_negociacao', label: 'Tipo Negociacao' },
  ];

  if (loading) return <LoadingState message="Carregando dados de vendas…" />;
  if (erro) return <p className="text-sm text-[#E74C3C]">Erro: {erro}</p>;

  return (
    <div>
      {/* Sub-menu Métrica */}
      <div className="mb-4">
        <RadioGroup label="Métrica" options={METRICAS} value={metrica} onChange={setMetrica} />
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <DateRangeFilter
          label={periodLabelFor(metrica)}
          start={period.start}
          end={period.end}
          onChange={(s, e) => setPeriod({ start: s, end: e })}
        />
        <SelectFilter label="Granularidade" options={GRANS} value={gran} onChange={setGran} />
        <MultiSelectFilter label="Empreendimento (opcional)" options={empOptions} selected={empSel} onChange={setEmpSel} />
        <MultiSelectFilter label="Etapa do processo (opcional)" options={etapaOptions} selected={etapaSel} onChange={setEtapaSel} />
      </div>

      {/* KPIs */}
      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          titulo="Cadastros"
          valor={fmtInt(totalCad)}
          legenda="Processos cadastrados no periodo"
        />
        <KPICard
          titulo="Pastas"
          valor={fmtInt(totalPas)}
          vgv={fmtMoeda(vgvPas)}
          legenda={`${fmtPct(pctPas)} sobre cadastros - com data de venda preenchida`}
          estilo="warning"
        />
        <KPICard
          titulo="Venda"
          valor={fmtInt(totalVen)}
          vgv={fmtMoeda(vgvVen)}
          legenda={`${fmtPct(pctVen)} sobre pastas - com data de contabilizacao preenchida`}
          estilo="success"
        />
        <KPICard
          titulo="Reprovado"
          valor={fmtInt(totalRep)}
          legenda={`${fmtPct(pctRep)} sobre cadastros - documentacao reprovada / irregular`}
          estilo="alert"
        />
        <KPICard
          titulo="Reprovado Instituição Financeira"
          valor={fmtInt(totalRepIf)}
          legenda={`${fmtPct(pctRepIf)} sobre cadastros - reprovado pelo banco / coban`}
          estilo="alert"
        />
      </div>

      <SectionTitle>Gráficos</SectionTitle>

      {/* Toggle legenda */}
      <div className="mb-3">
        <label className="inline-flex items-center gap-2 text-xs text-[#5A6677] cursor-pointer">
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => setShowLegend(e.target.checked)}
            className="accent-[#0F4C81]"
          />
          Mostrar legenda das etapas
        </label>
      </div>

      {/* Linha 1: Corretor + Equipe (stacked por etapa) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Por Corretor" height={420}>
          <StackedHBarChart data={stackedByDim('corretor_nome')} series={etapasSeries} showLegend={showLegend} />
        </ChartCard>
        <ChartCard title="Por Equipe" height={420}>
          <StackedHBarChart data={stackedByDim('equipe_nome')} series={etapasSeries} showLegend={showLegend} />
        </ChartCard>
      </div>

      {/* Linha 2: Empreendimento + por Período */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Por Empreendimento" height={420}>
          <StackedHBarChart data={stackedByDim('empreendimento_nome')} series={etapasSeries} showLegend={showLegend} />
        </ChartCard>
        <ChartCard title={`Por periodo (${gran})`} height={420}>
          <PeriodChart data={perPeriodo} showVgv={!!vgvCol(metrica)} />
        </ChartCard>
      </div>

      {/* Linha 3: Campanha / Mídia / Origem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Por Campanha" height={360}>
          <HBarChart data={groupByCount(dfMetrica, 'lead_campanha', 15)} color={COR_PRIMARIA} />
        </ChartCard>
        <ChartCard title="Por Midia" height={360}>
          <HBarChart data={groupByCount(dfMetrica, 'lead_midia', 15)} color={COR_PRIMARIA} />
        </ChartCard>
        <ChartCard title="Por Origem" height={360}>
          <HBarChart data={groupByCount(dfMetrica, 'lead_origem', 15)} color={COR_PRIMARIA} />
        </ChartCard>
      </div>

      {/* Tabela */}
      <SectionTitle>Detalhe</SectionTitle>
      <DataTable
        rows={dfMetrica}
        columns={colunasTabela}
        filename={`vendas_${metrica}.csv`}
        getRowHref={(r) =>
          r.processo_id
            ? `https://infratecnica.dommus2.com.br/2.0/index_ui.php?mgr=MQ==&ui=NjM=&id_processo=${r.processo_id}`
            : null
        }
      />
    </div>
  );
}
