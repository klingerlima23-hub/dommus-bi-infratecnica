'use client';

import { useEffect, useMemo, useState } from 'react';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import PieChart from '@/components/charts/PieChart';
import PeriodChart from '@/components/charts/PeriodChart';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt } from '@/lib/format';
import { COR_ALERTA, COR_PRIMARIA } from '@/lib/paleta';
import { urlProcesso } from '@/lib/urls';

interface Row {
  processo_id: number;
  processo_id_oportunidade: number | null;
  empreendimento_id: number | null;
  empreendimento_nome: string | null;
  data_distrato: string | null;
  motivo_distrato: string | null;
  lead_campanha: string | null;
  lead_midia: string | null;
  lead_origem: string | null;
  [key: string]: unknown;
}

function defaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

export default function VendasDistratos() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [period, setPeriod] = useState(defaultDateRange());
  const [empSel, setEmpSel] = useState<string[]>([]);
  const [motivoSel, setMotivoSel] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/data/distratos')
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

  // Filtro principal: aplica periodo + empreendimento + motivo.
  // T00:00:00 evita timezone-shift do new Date('YYYY-MM-DD'), que sem o sufixo
  // interpreta como UTC e empurra datas BR pro dia anterior.
  const filtered = useMemo(() => {
    const ini = new Date(period.start + 'T00:00:00');
    const fim = new Date(period.end + 'T23:59:59');
    return rows.filter((r) => {
      if (!r.data_distrato) return false;
      const d = new Date(r.data_distrato);
      if (d < ini || d > fim) return false;
      if (empSel.length && !empSel.includes(r.empreendimento_nome || '')) return false;
      if (motivoSel.length && !motivoSel.includes(r.motivo_distrato || '')) return false;
      return true;
    });
  }, [rows, period, empSel, motivoSel]);

  // Opcoes de filtros (montadas a partir do dataset completo, nao do filtrado)
  const empOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.empreendimento_nome).filter((x): x is string => !!x))).sort(),
    [rows],
  );
  const motivoOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.motivo_distrato).filter((x): x is string => !!x))).sort(),
    [rows],
  );

  // ========================= KPIs =========================
  const totalDistratos = filtered.length;

  // Motivo top (com contagem) -- pega o motivo mais frequente
  const motivoTop = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = (r.motivo_distrato || '—').trim() || '—';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    let top: { nome: string; qtd: number } = { nome: '—', qtd: 0 };
    for (const [nome, qtd] of map.entries()) {
      if (qtd > top.qtd) top = { nome, qtd };
    }
    return top;
  }, [filtered]);

  // Empreendimento top
  const empTop = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = (r.empreendimento_nome || '—').trim() || '—';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    let top: { nome: string; qtd: number } = { nome: '—', qtd: 0 };
    for (const [nome, qtd] of map.entries()) {
      if (qtd > top.qtd) top = { nome, qtd };
    }
    return top;
  }, [filtered]);

  // ========================= Grafico mensal cronologico =========================
  const porPeriodo = useMemo(() => {
    const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const map = new Map<string, number>();
    for (const r of filtered) {
      if (!r.data_distrato) continue;
      const d = new Date(r.data_distrato);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, qtd]) => {
        const [ano, mes] = ym.split('-');
        return { periodo: `${MESES[Number(mes) - 1]}/${ano}`, qtd };
      });
  }, [filtered]);

  // ========================= Top motivos / empreendimentos / origens =========================
  const topMotivos = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = (r.motivo_distrato || '—').trim() || '—';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const topEmpreendimentos = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = (r.empreendimento_nome || '—').trim() || '—';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  const porOrigem = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = (r.lead_origem || '—').trim().toUpperCase() || '—';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // ========================= Tabela =========================
  const columns: Column<Row>[] = [
    { key: 'processo_id', label: 'Processo', type: 'number', link: (r) => urlProcesso(r.processo_id) },
    { key: 'empreendimento_nome', label: 'Empreendimento', type: 'string' },
    { key: 'data_distrato', label: 'Data Distrato', type: 'date' },
    { key: 'motivo_distrato', label: 'Motivo', type: 'string' },
    { key: 'lead_campanha', label: 'Campanha', type: 'string', uppercase: true },
    { key: 'lead_midia', label: 'Midia', type: 'string', uppercase: true },
    { key: 'lead_origem', label: 'Origem', type: 'string', uppercase: true },
  ];

  if (loading) return <LoadingState message="Carregando distratos..." />;
  if (erro) return <p className="text-sm text-[#E74C3C]">Erro: {erro}</p>;

  return (
    <div>
      {/* Filtros -- flex pra cada filtro ocupar so o necessario */}
      <div className="flex flex-wrap gap-3 items-end mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <DateRangeFilter
          label="Periodo"
          start={period.start}
          end={period.end}
          onChange={(s, e) => setPeriod({ start: s, end: e })}
        />
        <MultiSelectFilter
          label="Empreendimento"
          options={empOptions}
          selected={empSel}
          onChange={setEmpSel}
        />
        <MultiSelectFilter
          label="Motivo"
          options={motivoOptions}
          selected={motivoSel}
          onChange={setMotivoSel}
        />
      </div>

      {/* KPIs */}
      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          titulo="Total Distratos"
          valor={fmtInt(totalDistratos)}
          legenda="Processos distratados no periodo"
          estilo="alert"
        />
        <KPICard
          titulo="Motivo Top"
          valor={motivoTop.nome}
          legenda={`${fmtInt(motivoTop.qtd)} ocorrencia(s) no periodo`}
          estilo="warning"
        />
        <KPICard
          titulo="Empreendimento Top"
          valor={empTop.nome}
          legenda={`${fmtInt(empTop.qtd)} distrato(s) no periodo`}
        />
      </div>

      {/* Grafico mensal */}
      <SectionTitle>Evolucao Mensal</SectionTitle>
      <ChartCard title="Distratos por mes" height={360}>
        <PeriodChart data={porPeriodo} />
      </ChartCard>

      {/* Linha de 3 graficos: motivos / empreendimentos / origem */}
      <SectionTitle>Distribuicao</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Top Motivos" height={360}>
          <HBarChart data={topMotivos} color={COR_ALERTA} />
        </ChartCard>
        <ChartCard title="Top Empreendimentos" height={360}>
          <HBarChart data={topEmpreendimentos} color={COR_PRIMARIA} />
        </ChartCard>
        <ChartCard title="Por Origem" height={360}>
          <PieChart data={porOrigem} donut centerSubtitle="Distratos" legendToggleable />
        </ChartCard>
      </div>

      {/* Tabela detalhada */}
      <SectionTitle>Detalhe</SectionTitle>
      <DataTable
        rows={filtered}
        columns={columns}
        filename="distratos.csv"
        rowLink={(r) => urlProcesso(r.processo_id)}
      />
    </div>
  );
}
