'use client';

import { useEffect, useMemo, useState } from 'react';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import PieChart from '@/components/charts/PieChart';
import PeriodChart from '@/components/charts/PeriodChart';
import RadioGroup from '@/components/filters/RadioGroup';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import SelectFilter from '@/components/filters/SelectFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtPct, bucketDate, type Granularidade, groupByCount } from '@/lib/format';

interface Row {
  id_oportunidade: number;
  nome_empreendimento: string;
  criou_visita: string;
  responsavel_visita: string;
  concluiu_visita: string;
  data_cadastro: string | null;
  data_visita: string | null;
  data_conclusao_visita?: string | null;
  local_visita: string;
  tipo_visita: string;
  visita_realizada: string;
}

const GRANS = ['Dia', 'Semana', 'Mes'] as const;
const METRICAS_CHART = ['Visitas Cadastradas', 'Visitas Realizadas'] as const;
type MetricaChart = (typeof METRICAS_CHART)[number];

function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

export default function VisitasPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [period, setPeriod] = useState(defaultRange());
  const [gran, setGran] = useState<Granularidade>('Mes');
  const [empSel, setEmpSel] = useState<string[]>([]);
  const [metricaChart, setMetricaChart] = useState<MetricaChart>('Visitas Cadastradas');

  useEffect(() => {
    let alive = true;
    fetch('/api/data/visitas')
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

  const empOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nome_empreendimento).filter(Boolean))).sort(),
    [rows]
  );

  const filtrado = useMemo(() => {
    const ini = new Date(period.start + 'T00:00:00');
    const fim = new Date(period.end + 'T23:59:59');
    return rows.filter((r) => {
      if (!r.data_visita) return false;
      const d = new Date(r.data_visita);
      if (d < ini || d > fim) return false;
      if (empSel.length && !empSel.includes(r.nome_empreendimento)) return false;
      return true;
    });
  }, [rows, period, empSel]);

  const total = filtrado.length;
  const realizadas = filtrado.filter((r) => (r.visita_realizada || '').toLowerCase() === 'sim').length;
  const pctReal = total ? (realizadas / total) * 100 : 0;

  // Pie tipo de visita
  const pieTipo = useMemo(() => groupByCount(filtrado, 'tipo_visita'), [filtrado]);

  // Pie realizadas vs não
  const pieRealiz = useMemo(() => {
    const sim = filtrado.filter((r) => (r.visita_realizada || '').toLowerCase() === 'sim').length;
    const nao = total - sim;
    return [
      { key: 'Realizadas', value: sim },
      { key: 'Nao realizadas', value: nao },
    ].filter((d) => d.value > 0);
  }, [filtrado, total]);

  // HBar empreendimento (top 15)
  const hbarEmp = useMemo(() => groupByCount(filtrado, 'nome_empreendimento', 15), [filtrado]);
  const hbarLocal = useMemo(() => groupByCount(filtrado, 'local_visita', 15), [filtrado]);

  // Cadastradas x Realizadas por período
  const perPeriodo = useMemo(() => {
    const map = new Map<string, { cad: number; real: number }>();
    for (const r of filtrado) {
      if (!r.data_visita) continue;
      const k = bucketDate(new Date(r.data_visita), gran);
      const cur = map.get(k) ?? { cad: 0, real: 0 };
      cur.cad += 1;
      if ((r.visita_realizada || '').toLowerCase() === 'sim') cur.real += 1;
      map.set(k, cur);
    }
    return Array.from(map.entries()).map(([periodo, v]) => ({
      periodo,
      qtd: metricaChart === 'Visitas Realizadas' ? v.real : v.cad,
    }));
  }, [filtrado, gran, metricaChart]);

  const colunas: Column<Row>[] = [
    { key: 'id_oportunidade', label: 'OPV', type: 'number' },
    { key: 'nome_empreendimento', label: 'Empreendimento' },
    { key: 'criou_visita', label: 'Criador' },
    { key: 'responsavel_visita', label: 'Responsavel' },
    { key: 'concluiu_visita', label: 'Concluiu' },
    { key: 'data_cadastro', label: 'Data Cadastro', type: 'datetime' },
    { key: 'data_visita', label: 'Data Visita', type: 'datetime' },
    { key: 'local_visita', label: 'Local' },
    { key: 'tipo_visita', label: 'Tipo' },
    { key: 'visita_realizada', label: 'Realizada' },
  ];

  if (loading) return <LoadingState message="Carregando dados de visitas…" />;
  if (erro) return <p className="text-sm text-[#E74C3C]">Erro: {erro}</p>;

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <DateRangeFilter
          label="Período (data da visita)"
          start={period.start}
          end={period.end}
          onChange={(s, e) => setPeriod({ start: s, end: e })}
        />
        <SelectFilter label="Granularidade" options={GRANS} value={gran} onChange={setGran} />
        <MultiSelectFilter label="Empreendimento (opcional)" options={empOptions} selected={empSel} onChange={setEmpSel} />
      </div>

      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard titulo="Visitas Cadastradas" valor={fmtInt(total)} legenda="Total de visitas agendadas no periodo" />
        <KPICard
          titulo="Visitas Realizadas"
          valor={fmtInt(realizadas)}
          legenda={`${fmtPct(pctReal)} sobre cadastradas`}
          estilo="success"
        />
      </div>

      <SectionTitle>Gráficos</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Por Tipo de Visita" height={320}>
          <PieChart data={pieTipo} donut />
        </ChartCard>
        <ChartCard title="Realizadas vs Nao Realizadas" height={320}>
          <PieChart data={pieRealiz} donut />
        </ChartCard>
        <ChartCard title="Por Empreendimento" height={320}>
          <HBarChart data={hbarEmp} />
        </ChartCard>
      </div>

      <div className="mb-3">
        <RadioGroup
          label="Metrica dos graficos"
          options={METRICAS_CHART}
          value={metricaChart}
          onChange={setMetricaChart}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Por Local de Visita" height={360}>
          <HBarChart data={hbarLocal} />
        </ChartCard>
        <ChartCard title={`${metricaChart} por Periodo (${gran})`} height={360}>
          <PeriodChart data={perPeriodo} />
        </ChartCard>
      </div>

      <SectionTitle>Detalhe</SectionTitle>
      <DataTable rows={filtrado} columns={colunas} filename="visitas.csv" />
    </div>
  );
}
