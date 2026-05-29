'use client';

import { useEffect, useMemo, useState } from 'react';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import PieChart from '@/components/charts/PieChart';
import StackedHBarChart from '@/components/charts/StackedHBarChart';
import PeriodChart from '@/components/charts/PeriodChart';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import SelectFilter from '@/components/filters/SelectFilter';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtPct, bucketDate, type Granularidade, groupByCount } from '@/lib/format';

interface RowOp {
  id_oportunidade: number;
  data_distribuicao: string | null;
  data_venda: string | null;
  data_venda_contabilizada: string | null;
  lead_nome: string;
  lead_email: string;
  lead_telefone: string;
  nome_corretor: string;
  status_oportunidade: string;
  ordem_status_oportunidade: number | null;
  id_equipe_pre_atendimento: number | null;
  nome_empreendimento: string;
  id_processo: number | null;
  nome_campanha: string | null;
}

interface RowVisita {
  id_oportunidade: number;
  data_visita: string | null;
  visita_realizada: string;
}

const GRANS = ['Dia', 'Semana', 'Mes', 'Trimestre', 'Ano'] as const;

function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

export default function LeadVisaoGeral() {
  const [opvs, setOpvs] = useState<RowOp[]>([]);
  const [visitas, setVisitas] = useState<RowVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [period, setPeriod] = useState(defaultRange());
  const [gran, setGran] = useState<Granularidade>('Mes');

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/api/data/oportunidade').then((r) => r.json()),
      fetch('/api/data/visitas').then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (!alive) return;
        if (a.error) throw new Error(a.error);
        if (b.error) throw new Error(b.error);
        setOpvs(a.rows ?? []);
        setVisitas(b.rows ?? []);
      })
      .catch((e) => alive && setErro(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtrado = useMemo(() => {
    const ini = new Date(period.start);
    const fim = new Date(period.end + 'T23:59:59');
    return opvs.filter((r) => {
      if (!r.data_distribuicao) return false;
      const d = new Date(r.data_distribuicao);
      return d >= ini && d <= fim;
    });
  }, [opvs, period]);

  // KPIs
  const totalGeral = filtrado.length;
  const totalPre = filtrado.filter((r) => r.id_equipe_pre_atendimento === 3).length;
  const transferidos = filtrado.filter(
    (r) => r.id_equipe_pre_atendimento === 3 && r.nome_corretor && r.nome_corretor !== ''
  ).length;
  const direto = filtrado.filter((r) => r.id_equipe_pre_atendimento == null).length;
  const pctTransf = totalPre ? (transferidos / totalPre) * 100 : 0;

  // Regra Mundo Apto: venda = oportunidade onde TANTO data_distribuicao QUANTO
  // data_venda_contabilizada estao no periodo selecionado.
  // Equivalente ao SQL:
  //   WHERE data_cadastro >= :ini AND data_venda_contabilizada >= :ini
  //         AND ambas <= :fim
  // (filtrado ja' garante data_distribuicao no periodo; aqui completamos com
  //  data_venda_contabilizada no mesmo periodo).
  const vendasGanhas = useMemo(() => {
    const ini = new Date(period.start);
    const fim = new Date(period.end + 'T23:59:59');
    return filtrado.filter((r) => {
      if (!r.data_venda_contabilizada) return false;
      const d = new Date(r.data_venda_contabilizada);
      return d >= ini && d <= fim;
    });
  }, [filtrado, period]);
  const totalVendas = vendasGanhas.length;
  const pctConv = totalGeral ? (totalVendas / totalGeral) * 100 : 0;
  // Media de dias da distribuicao ate a contabilizacao da venda
  const mediaDias = (() => {
    const diffs: number[] = [];
    for (const r of vendasGanhas) {
      if (r.data_distribuicao && r.data_venda_contabilizada) {
        const a = new Date(r.data_distribuicao).getTime();
        const b = new Date(r.data_venda_contabilizada).getTime();
        const d = (b - a) / 86400000;
        if (!Number.isNaN(d)) diffs.push(d);
      }
    }
    return diffs.length ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0;
  })();

  // Visitas no período (filtra por data_visita)
  const visitasFiltradas = useMemo(() => {
    const ini = new Date(period.start);
    const fim = new Date(period.end + 'T23:59:59');
    return visitas.filter((v) => {
      if (!v.data_visita) return false;
      const d = new Date(v.data_visita);
      return d >= ini && d <= fim;
    });
  }, [visitas, period]);
  const opvsUnicasComVisita = useMemo(
    () => new Set(visitasFiltradas.map((v) => v.id_oportunidade)).size,
    [visitasFiltradas]
  );
  const visitasRealizadas = useMemo(
    () => visitasFiltradas.filter((v) => (v.visita_realizada || '').toLowerCase() === 'sim').length,
    [visitasFiltradas]
  );
  const pctVisRealiz = opvsUnicasComVisita ? (visitasRealizadas / opvsUnicasComVisita) * 100 : 0;

  // Gráficos
  const perPeriodo = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtrado) {
      if (!r.data_distribuicao) continue;
      const k = bucketDate(new Date(r.data_distribuicao), gran);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([periodo, qtd]) => ({ periodo, qtd }));
  }, [filtrado, gran]);

  const porStatus = useMemo(() => {
    const m = new Map<string, { value: number; ordem: number }>();
    for (const r of filtrado) {
      const k = r.status_oportunidade || '—';
      const ord = Number(r.ordem_status_oportunidade ?? 999);
      const cur = m.get(k) ?? { value: 0, ordem: ord };
      cur.value += 1;
      cur.ordem = Math.min(cur.ordem, ord);
      m.set(k, cur);
    }
    return Array.from(m.entries())
      .map(([key, v]) => ({ key, value: v.value, ordem: v.ordem }))
      .sort((a, b) => a.ordem - b.ordem)
      .map(({ key, value }) => ({ key, value }));
  }, [filtrado]);

  const porEmp = useMemo(() => groupByCount(filtrado, 'nome_empreendimento', 15), [filtrado]);

  // Donut: leads distribuidos por campanha. Conta TODAS as oportunidades do
  // periodo, agrupando sem campanha em "Sem campanha" pra o total do centro
  // bater com Total Oportunidades. Mantem top 12 e empilha o resto em "Outras".
  const pieCampanha = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtrado) {
      const k = (r.nome_campanha ?? '').trim() || 'Sem campanha';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    const arr = Array.from(m.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
    const TOP = 12;
    if (arr.length <= TOP) return arr;
    const top = arr.slice(0, TOP);
    const resto = arr.slice(TOP).reduce((s, x) => s + x.value, 0);
    if (resto > 0) top.push({ key: 'Outras', value: resto });
    return top;
  }, [filtrado]);

  // Stacked corretor x status (top 15)
  const corretorStacked = useMemo(() => {
    const totals = new Map<string, number>();
    const buckets = new Map<string, Record<string, number>>();
    const statusSet = new Set<string>();
    for (const r of filtrado) {
      const k = r.nome_corretor || '';
      if (!k) continue;
      const s = r.status_oportunidade || 'Outros';
      statusSet.add(s);
      totals.set(k, (totals.get(k) ?? 0) + 1);
      const obj = buckets.get(k) ?? {};
      obj[s] = (obj[s] ?? 0) + 1;
      buckets.set(k, obj);
    }
    const top = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const series = Array.from(statusSet).slice(0, 8);
    const data = top.map(([key]) => {
      const obj: Record<string, string | number> = { key };
      for (const s of series) obj[s] = buckets.get(key)?.[s] ?? 0;
      return obj;
    });
    return { data, series };
  }, [filtrado]);

  const colunas: Column<RowOp>[] = [
    { key: 'id_oportunidade', label: 'OPV', type: 'number' },
    { key: 'nome_empreendimento', label: 'Empreendimento' },
    { key: 'data_distribuicao', label: 'Data Distribuicao', type: 'datetime' },
    { key: 'lead_nome', label: 'Lead' },
    { key: 'lead_telefone', label: 'Telefone' },
    { key: 'lead_email', label: 'Email' },
    { key: 'nome_corretor', label: 'Corretor' },
    { key: 'status_oportunidade', label: 'Status' },
    { key: 'id_processo', label: 'Processo', type: 'number' },
    { key: 'data_venda', label: 'Data Venda', type: 'datetime' },
  ];

  if (loading) return <LoadingState message="Carregando dados de oportunidades…" />;
  if (erro) return <p className="text-sm text-[#E74C3C]">Erro: {erro}</p>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <DateRangeFilter
          label="Período (data distribuicao)"
          start={period.start}
          end={period.end}
          onChange={(s, e) => setPeriod({ start: s, end: e })}
        />
        <SelectFilter label="Granularidade" options={GRANS} value={gran} onChange={setGran} />
      </div>

      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          titulo="Pre-Atendimento"
          valor={fmtInt(totalPre)}
          legenda={`${fmtPct(pctTransf)} transf. p/ corretores (${transferidos}/${totalPre})`}
        />
        <KPICard titulo="Total Oportunidades" valor={fmtInt(totalGeral)} legenda="Total geral no periodo" estilo="success" />
        <KPICard titulo="Direto p/ Corretores" valor={fmtInt(direto)} legenda="OPVs sem equipe de pre-atend." />
        <KPICard
          titulo="Total de Vendas"
          valor={fmtInt(totalVendas)}
          legenda={`Com data de contabilizacao | ${mediaDias}d | ${fmtPct(pctConv)} conv.`}
          estilo="success"
        />
        <KPICard titulo="Visitas Agendadas" valor={fmtInt(opvsUnicasComVisita)} legenda="OPVs unicas no periodo (data visita)" estilo="warning" />
        <KPICard titulo="Visitas Realizadas" valor={fmtInt(visitasRealizadas)} legenda={`${fmtPct(pctVisRealiz)} sobre agendadas`} estilo="success" />
      </div>

      <SectionTitle>Gráficos</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Oportunidades por Periodo" height={340}>
          <PeriodChart data={perPeriodo} />
        </ChartCard>
        <ChartCard title="Por Status de Oportunidade" height={340}>
          <HBarChart data={porStatus} />
        </ChartCard>
        <ChartCard title="Por Empreendimento" height={340}>
          <HBarChart data={porEmp} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Oportunidades por Campanhas" height={360}>
          <PieChart data={pieCampanha} donut centerSubtitle="" legendToggleable />
        </ChartCard>
        <ChartCard title="Por Corretor (stacked por status)" height={360}>
          <StackedHBarChart data={corretorStacked.data} series={corretorStacked.series} showLegend />
        </ChartCard>
      </div>

      <SectionTitle>Detalhe</SectionTitle>
      <DataTable
        rows={filtrado}
        columns={colunas}
        filename="lead_visao_geral.csv"
        getRowHref={(r) =>
          r.id_oportunidade
            ? `https://leads.dommus.com.br/oportunidade/${r.id_oportunidade}`
            : null
        }
      />
    </div>
  );
}
