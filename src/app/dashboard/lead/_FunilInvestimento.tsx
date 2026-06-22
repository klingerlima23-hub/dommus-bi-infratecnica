'use client';

import { useEffect, useMemo, useState } from 'react';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import FunnelChart from '@/components/charts/FunnelChart';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtMoeda, fmtPct } from '@/lib/format';
import { urlOportunidade } from '@/lib/urls';

interface RowOp {
  id_oportunidade: number;
  data_distribuicao: string | null;
  data_venda: string | null;
  data_venda_contabilizada: string | null;
  status_oportunidade: string;
  nome_empreendimento: string;
  id_processo: number | null;
}

interface RowFunil {
  id_oportunidade: number;
  id_etapa_atual: number;
  id_etapa_funil: number;
  nome_etapa_funil: string;
  ordem_etapa_funil: number;
  nome_equipe: string;
  nome_gerente: string;
  nome_corretor: string;
  nome_empreendimento: string;
  nome_campanha: string;
  nome_midia: string;
  nome_origem: string;
  data_lead: string | null;
}

interface RowInvestimento {
  valor_investimento: number;
  data_investimento: string | null;
  nome_midia: string;
  nome_empreendimento: string;
}

// Mapping status_oportunidade.id → fase do funil (replicado do v001)
const CASE_MAP_FASE: Record<number, number> = {
  19: 1, 16: 1,
  11: 2, 59: 2, 23: 2,
  26: 3,
  4: 4, 56: 4, 57: 4,
  20: 5, 58: 5, 18: 5, 22: 5,
  8: 6,
  9: 7, 38: 7, 29: 7, 55: 7,
};
const NOME_FASE: Record<number, string> = {
  1: 'Leads',
  2: 'Em atendimento',
  3: 'Oportunidade',
  4: 'Visita agendada',
  5: 'Pasta',
  6: 'Venda',
  7: 'Perdido/Descarte',
};
const ETAPAS_FUNIL = [1, 2, 3, 4, 5, 6, 7] as const;

function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

/** Normaliza string removendo acentos e fazendo upper-case (mesmo padrao do Streamlit). */
function normStatus(s: string | null | undefined): string {
  if (!s) return '';
  return String(s)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Status que contam como "Perdido/Descarte" (replicado do Streamlit Infratecnica). */
const STATUS_PERDIDOS = new Set([
  'VENDA PERDIDA',
  'VENDA PERDIDA B.B',
  'SEM INTERESSE ML',
  'DESISTENCIA PC',
]);

/**
 * Agrega por dimensao em rows de f_funil, contando `id_oportunidade` distintos
 * (mesmo comportamento do `_agg_dim` do Streamlit: `nunique(id_oportunidade)`).
 */
function aggDim(rows: RowFunil[], dim: keyof RowFunil, topN = 10): Array<{ key: string; value: number }> {
  const buckets = new Map<string, Set<number>>();
  for (const r of rows) {
    const k = String(r[dim] ?? '').trim();
    if (!k || ['nan', 'none', '0', '0.0', 'nat', '<na>', 'null'].includes(k.toLowerCase())) continue;
    if (!buckets.has(k)) buckets.set(k, new Set());
    buckets.get(k)!.add(r.id_oportunidade);
  }
  return Array.from(buckets.entries())
    .map(([key, ids]) => ({ key, value: ids.size }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

export default function LeadFunilInvestimento() {
  const [opvs, setOpvs] = useState<RowOp[]>([]);
  const [funil, setFunil] = useState<RowFunil[]>([]);
  const [investimento, setInvestimento] = useState<RowInvestimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [period, setPeriod] = useState(defaultRange());
  const [empSel, setEmpSel] = useState<string[]>([]);
  const [etapaSel, setEtapaSel] = useState<string[]>([]);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/api/data/oportunidade').then((r) => r.json()),
      fetch('/api/data/funil').then((r) => r.json()),
    ])
      .then(([a, b]) => {
        if (!alive) return;
        if (a.error) throw new Error(a.error);
        if (b.error) throw new Error(b.error);
        setOpvs(a.rows ?? []);
        setFunil(b.funil ?? []);
        setInvestimento(b.investimento ?? []);
      })
      .catch((e) => alive && setErro(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // OPVs no período
  const opvsFiltrados = useMemo(() => {
    const ini = new Date(period.start);
    const fim = new Date(period.end + 'T23:59:59');
    let base = opvs.filter((r) => {
      if (!r.data_distribuicao) return false;
      const d = new Date(r.data_distribuicao);
      return d >= ini && d <= fim;
    });
    if (empSel.length) base = base.filter((r) => empSel.includes(r.nome_empreendimento));
    return base;
  }, [opvs, period, empSel]);

  // Funil dedup por id_oportunidade
  const funilDedup = useMemo(() => {
    const seen = new Set<number>();
    const out: RowFunil[] = [];
    for (const f of funil) {
      if (!seen.has(f.id_oportunidade)) {
        seen.add(f.id_oportunidade);
        out.push(f);
      }
    }
    return out;
  }, [funil]);

  // OPVs no escopo (intersecção com filtros)
  const opvIds = useMemo(() => new Set(opvsFiltrados.map((r) => r.id_oportunidade)), [opvsFiltrados]);
  const funilNoEscopo = useMemo(
    () => funilDedup.filter((f) => opvIds.has(f.id_oportunidade)),
    [funilDedup, opvIds]
  );

  // Filtro de etapa (mapeada)
  const escopoFiltradoEtapa = useMemo(() => {
    if (!etapaSel.length) return funilNoEscopo;
    const setSel = new Set(etapaSel);
    return funilNoEscopo.filter((f) => {
      const fase = CASE_MAP_FASE[Number(f.id_etapa_atual)];
      return fase && setSel.has(NOME_FASE[fase]);
    });
  }, [funilNoEscopo, etapaSel]);

  const empOptions = useMemo(() => {
    const a = opvs.map((o) => o.nome_empreendimento);
    const b = funilDedup.map((f) => f.nome_empreendimento);
    return Array.from(new Set([...a, ...b].filter(Boolean))).sort();
  }, [opvs, funilDedup]);

  // Investimento no período
  const investimentoFiltrado = useMemo(() => {
    const ini = new Date(period.start);
    const fim = new Date(period.end + 'T23:59:59');
    let base = investimento.filter((r) => {
      if (!r.data_investimento) return false;
      const d = new Date(r.data_investimento);
      return d >= ini && d <= fim;
    });
    if (empSel.length) base = base.filter((r) => empSel.includes(r.nome_empreendimento));
    return base;
  }, [investimento, period, empSel]);

  const investimentoTotal = investimentoFiltrado.reduce((s, r) => s + (Number(r.valor_investimento) || 0), 0);

  // Regra Infratecnica (replicada do Streamlit dashboard.py render_lead_funil_investimento):
  // - Leads Gerados = TOTAL de oportunidades no periodo (mesma base da Visao Geral),
  //   independente do filtro de etapa do funil.
  // - Vendas = oportunidades cujo status_oportunidade == 'VENDA GANHA'.
  // - Perdidos = oportunidades com status no conjunto STATUS_PERDIDOS.
  const leadsGerados = opvsFiltrados.length;
  const cplMedio = leadsGerados ? investimentoTotal / leadsGerados : 0;
  const totalVendas = useMemo(
    () => opvsFiltrados.filter((o) => normStatus(o.status_oportunidade) === 'VENDA GANHA').length,
    [opvsFiltrados],
  );
  const totalPerdidos = useMemo(
    () => opvsFiltrados.filter((o) => STATUS_PERDIDOS.has(normStatus(o.status_oportunidade))).length,
    [opvsFiltrados],
  );
  const cac = totalVendas ? investimentoTotal / totalVendas : 0;
  const pctConv = leadsGerados ? (totalVendas / leadsGerados) * 100 : 0;
  const pctPerdidos = leadsGerados ? (totalPerdidos / leadsGerados) * 100 : 0;

  // Funil: contagem de OPVs unicas por etapa (replica `agg` do Streamlit).
  // - Stage 1 (Leads) e substituida pelo total de OPVs do periodo (leadsGerados).
  // - Etapa 7 (Perdido/Descarte) e excluida do funil.
  const funnelData = useMemo(() => {
    const cont: Record<number, Set<number>> = {};
    for (const f of funilNoEscopo) {
      const fase = CASE_MAP_FASE[Number(f.id_etapa_atual)];
      if (!fase) continue;
      if (!cont[fase]) cont[fase] = new Set();
      cont[fase].add(f.id_oportunidade);
    }
    return ETAPAS_FUNIL
      .filter((fase) => fase !== 7) // exclui Perdido/Descarte (mesmo que o Streamlit)
      .map((fase) => {
        const qtd = fase === 1 ? leadsGerados : (cont[fase]?.size ?? 0);
        const pct = leadsGerados ? Math.round((qtd / leadsGerados) * 100) : 0;
        return { name: NOME_FASE[fase], value: qtd, pct: `${pct}%` };
      });
  }, [funilNoEscopo, leadsGerados]);

  // Tabela origem (por midia): conta OPVs distintos em f_funil (sem filtro de etapa,
  // como o Streamlit faz) e soma o investimento por midia. CPL = investimento / opvs.
  const tabelaOrigem = useMemo(() => {
    const inv = new Map<string, number>();
    for (const r of investimentoFiltrado) {
      const k = (r.nome_midia || '—').trim() || '—';
      inv.set(k, (inv.get(k) ?? 0) + (Number(r.valor_investimento) || 0));
    }
    const opvBuckets = new Map<string, Set<number>>();
    for (const f of funilNoEscopo) {
      const k = (f.nome_midia || '—').trim() || '—';
      if (!opvBuckets.has(k)) opvBuckets.set(k, new Set());
      opvBuckets.get(k)!.add(f.id_oportunidade);
    }
    const keys = new Set<string>([...Array.from(inv.keys()), ...Array.from(opvBuckets.keys())]);
    const rows = Array.from(keys).map((midia) => {
      const investimento = inv.get(midia) ?? 0;
      const opvs = opvBuckets.get(midia)?.size ?? 0;
      const cpl = opvs ? investimento / opvs : 0;
      return { midia, cpl, opvs, investimento };
    });
    return rows.sort((a, b) => b.investimento - a.investimento);
  }, [investimentoFiltrado, funilNoEscopo]);

  // 4 distribuicoes por dimensao -- mesma base do Streamlit (funilNoEscopo, sem
  // filtro de etapa, contando id_oportunidade distintos).
  const porEquipe = useMemo(() => aggDim(funilNoEscopo, 'nome_equipe'), [funilNoEscopo]);
  const porGerente = useMemo(() => aggDim(funilNoEscopo, 'nome_gerente'), [funilNoEscopo]);
  const porCorretor = useMemo(() => aggDim(funilNoEscopo, 'nome_corretor'), [funilNoEscopo]);
  const porEmpreendimento = useMemo(() => aggDim(funilNoEscopo, 'nome_empreendimento'), [funilNoEscopo]);

  // Tabela detalhe: 1 linha por id_oportunidade
  const detalheRows = useMemo(() => {
    return escopoFiltradoEtapa.map((f) => {
      const op = opvsFiltrados.find((o) => o.id_oportunidade === f.id_oportunidade);
      const fase = CASE_MAP_FASE[Number(f.id_etapa_atual)] ?? 0;
      return {
        id_oportunidade: f.id_oportunidade,
        id_processo: op?.id_processo ?? null,
        data_lead: f.data_lead,
        data_distribuicao: op?.data_distribuicao ?? null,
        etapa_funil_atual: fase ? NOME_FASE[fase] : '—',
        status_oportunidade: op?.status_oportunidade ?? '—',
        nome_equipe: f.nome_equipe,
        nome_gerente: f.nome_gerente,
        nome_corretor: f.nome_corretor,
        nome_empreendimento: f.nome_empreendimento,
        nome_campanha: f.nome_campanha,
        nome_midia: f.nome_midia,
        nome_origem: f.nome_origem,
      };
    });
  }, [escopoFiltradoEtapa, opvsFiltrados]);

  type DetalheRow = (typeof detalheRows)[number];
  const colunas: Column<DetalheRow>[] = [
    { key: 'id_oportunidade', label: 'OPV', type: 'number' },
    { key: 'id_processo', label: 'Processo', type: 'number' },
    { key: 'data_lead', label: 'Data Lead', type: 'datetime' },
    { key: 'data_distribuicao', label: 'Data Distribuicao', type: 'datetime' },
    { key: 'etapa_funil_atual', label: 'Etapa Funil' },
    { key: 'status_oportunidade', label: 'Status' },
    { key: 'nome_equipe', label: 'Equipe' },
    { key: 'nome_gerente', label: 'Gerente' },
    { key: 'nome_corretor', label: 'Corretor' },
    { key: 'nome_empreendimento', label: 'Empreendimento' },
    { key: 'nome_campanha', label: 'Campanha' },
    { key: 'nome_midia', label: 'Mídia' },
    { key: 'nome_origem', label: 'Origem' },
  ];

  if (loading) return <LoadingState message="Carregando funil & investimento…" />;
  if (erro) return <p className="text-sm text-[#E74C3C]">Erro: {erro}</p>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <DateRangeFilter
          label="Período (data distribuicao)"
          start={period.start}
          end={period.end}
          onChange={(s, e) => setPeriod({ start: s, end: e })}
        />
        <MultiSelectFilter label="Empreendimento (opcional)" options={empOptions} selected={empSel} onChange={setEmpSel} />
        <MultiSelectFilter
          label="Etapa do funil (opcional)"
          options={Object.values(NOME_FASE)}
          selected={etapaSel}
          onChange={setEtapaSel}
        />
      </div>

      <div className="mb-3">
        <label className="inline-flex items-center gap-2 text-xs text-[#5A6677] cursor-pointer">
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => setShowLegend(e.target.checked)}
            className="accent-[#0F4C81]"
          />
          Mostrar legenda das etapas agregadas
        </label>
        {showLegend && (
          <div className="mt-2 text-[0.7rem] text-[#5A6677] bg-white border border-[#E5E9F0] rounded p-2">
            <strong>Mapeamento status → fase do funil:</strong>
            <ul className="mt-1 list-disc ml-5">
              {Object.entries(NOME_FASE).map(([id, nome]) => (
                <li key={id}>
                  <code>{id}</code> → {nome}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard titulo="Investimento" valor={fmtMoeda(investimentoTotal)} legenda="Total de custo de midia no periodo" />
        <KPICard titulo="CPL Medio" valor={fmtMoeda(cplMedio)} legenda="Investimento / leads gerados" />
        <KPICard titulo="CAC" valor={fmtMoeda(cac)} legenda="Custo de Aquisicao de Cliente" />
        <KPICard titulo="Leads Gerados" valor={fmtInt(leadsGerados)} legenda="Total de oportunidades no periodo" />
        <KPICard
          titulo="Conversoes (Vendas)"
          valor={fmtInt(totalVendas)}
          legenda={`${fmtPct(pctConv)} de conversao | com data de contabilizacao`}
          estilo="success"
        />
        <KPICard
          titulo="Leads Perdidos"
          valor={fmtInt(totalPerdidos)}
          legenda={`${fmtPct(pctPerdidos)} de descarte | Perdido/Descarte`}
          estilo="warning"
        />
      </div>

      <SectionTitle>Funil & Origem</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
        <ChartCard title="Funil de Conversão" height={420}>
          <FunnelChart data={funnelData} />
        </ChartCard>
        <div className="bg-white border border-[#E5E9F0] rounded-[14px] px-4 py-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <h3 className="text-[0.95rem] font-semibold text-[#0F4C81] mb-3">Origem (por Mídia)</h3>
          <table className="w-full text-xs">
            <thead className="bg-[#F4F6FA]">
              <tr>
                <th className="px-2 py-1.5 text-left">Mídia</th>
                <th className="px-2 py-1.5 text-right">CPL</th>
                <th className="px-2 py-1.5 text-right">OPVs</th>
                <th className="px-2 py-1.5 text-right">Investimento</th>
              </tr>
            </thead>
            <tbody>
              {tabelaOrigem.map((r) => (
                <tr key={r.midia} className="border-t border-[#E5E9F0]">
                  <td className="px-2 py-1.5">{r.midia}</td>
                  <td className="px-2 py-1.5 text-right">{fmtMoeda(r.cpl)}</td>
                  <td className="px-2 py-1.5 text-right">{fmtInt(r.opvs)}</td>
                  <td className="px-2 py-1.5 text-right">{fmtMoeda(r.investimento)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#0F4C81] font-bold bg-[#F7F9FC]">
                <td className="px-2 py-1.5">Total</td>
                <td className="px-2 py-1.5 text-right">{fmtMoeda(cplMedio)}</td>
                <td className="px-2 py-1.5 text-right">{fmtInt(leadsGerados)}</td>
                <td className="px-2 py-1.5 text-right">{fmtMoeda(investimentoTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <SectionTitle>Distribuição</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Por Equipe" height={340}>
          <HBarChart data={porEquipe} />
        </ChartCard>
        <ChartCard title="Por Gerente" height={340}>
          <HBarChart data={porGerente} />
        </ChartCard>
        <ChartCard title="Por Corretor" height={340}>
          <HBarChart data={porCorretor} />
        </ChartCard>
        <ChartCard title="Por Empreendimento" height={340}>
          <HBarChart data={porEmpreendimento} />
        </ChartCard>
      </div>

      <SectionTitle>Detalhe</SectionTitle>
      <DataTable
        rows={detalheRows}
        columns={colunas}
        filename="lead_funil_detalhe.csv"
        rowLink={(r) => urlOportunidade(r.id_oportunidade)}
      />
    </div>
  );
}
