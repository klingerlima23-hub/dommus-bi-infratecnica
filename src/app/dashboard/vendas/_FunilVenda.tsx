'use client';

import { useEffect, useMemo, useState } from 'react';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import FunnelChart from '@/components/charts/FunnelChart';
import HBarChart from '@/components/charts/HBarChart';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtMoeda, fmtPct } from '@/lib/format';
import { COR_PRIMARIA } from '@/lib/paleta';

interface Row {
  id_processo: number;
  processo_cadastrado_em: string | null;
  empreendimento_nome: string;
  equipe_nome: string;
  gerente_nome: string;
  corretor_nome: string;
  lead_campanha: string;
  lead_origem: string;
  lead_midia: string;
  analise_credito_financiamento: number | null;
  unidade_valor_liquido: number | null;
  processo_data_venda: string | null;
  venda_contabilizado_em: string | null;
  processo_unidade_id: number | null;
  etapa_atual: string;
  is_venda: number;
  reached_pastas: number;
  reached_aprovado_if: number;
  reached_contrato: number;
  [key: string]: unknown;
}

/** Filtra rows por periodo em um campo de data especifico. */
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

function defaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

export default function VendasFunilVenda() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [period, setPeriod] = useState(defaultDateRange());
  const [empSel, setEmpSel] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/data/funil-venda')
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

  // Filtra apenas por empreendimento (sem data) — o filtro de data
  // varia por metrica abaixo.
  const baseEmp = useMemo(
    () => rows.filter((r) => !empSel.length || empSel.includes(r.empreendimento_nome)),
    [rows, empSel],
  );

  // Coortes por metrica — mesma regra usada na Visao Atual:
  //  Cadastro / Aprovado IF / Contrato:  filtra por processo_cadastrado_em
  //  Pastas:                              filtra por processo_data_venda
  //  Venda:                               filtra por venda_contabilizado_em
  const cohorts = useMemo(() => {
    return {
      cad: filtrarPorPeriodo(baseEmp, 'processo_cadastrado_em', period),
      pas: filtrarPorPeriodo(baseEmp, 'processo_data_venda', period),
      aprIf: filtrarPorPeriodo(baseEmp, 'processo_cadastrado_em', period),
      cont: filtrarPorPeriodo(baseEmp, 'processo_cadastrado_em', period),
      ven: filtrarPorPeriodo(baseEmp, 'venda_contabilizado_em', period),
    };
  }, [baseEmp, period]);

  // Pastas e Venda ja' estao restritos pelo filtro de periodo no campo certo
  // (data_venda / venda_contabilizado_em), entao .length basta.
  // Aprovado IF e Contrato precisam filtrar a flag dentro do coorte de cadastro.
  const totalCad = cohorts.cad.length;
  const totalPas = cohorts.pas.length;
  const totalAprIf = cohorts.aprIf.filter((r) => r.reached_aprovado_if === 1).length;
  const totalCont = cohorts.cont.filter((r) => r.reached_contrato === 1).length;
  const totalVen = cohorts.ven.length;

  const vgvPas = cohorts.pas.reduce(
    (s, r) => s + (Number(r.analise_credito_financiamento) || 0),
    0,
  );
  const vgvVen = cohorts.ven.reduce(
    (s, r) => s + (Number(r.unidade_valor_liquido) || 0),
    0,
  );

  const pctPas = totalCad ? (totalPas / totalCad) * 100 : 0;
  const pctAprIf = totalCad ? (totalAprIf / totalCad) * 100 : 0;
  const pctCont = totalCad ? (totalCont / totalCad) * 100 : 0;
  const pctVen = totalCad ? (totalVen / totalCad) * 100 : 0;

  const funnelData = [
    { name: 'Cadastro', value: totalCad, pct: '100%' },
    { name: 'Pastas', value: totalPas, pct: fmtPct(pctPas) },
    { name: 'Aprovado IF', value: totalAprIf, pct: fmtPct(pctAprIf) },
    { name: 'Contrato', value: totalCont, pct: fmtPct(pctCont) },
    { name: 'Venda', value: totalVen, pct: fmtPct(pctVen) },
  ];

  // Top 15 empreendimentos por quantidade de cadastros no periodo
  // (eixo coorte = data de cadastro).
  const porEmp = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of cohorts.cad) {
      const k = r.empreendimento_nome || '(sem empreendimento)';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([key, value]) => ({ key, value }));
  }, [cohorts.cad]);

  const empOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.empreendimento_nome).filter(Boolean))).sort(),
    [rows]
  );

  const colunasTabela: Column<Row>[] = [
    { key: 'id_processo', label: 'Processo', type: 'number' },
    { key: 'processo_cadastrado_em', label: 'Data Cadastro', type: 'datetime' },
    { key: 'empreendimento_nome', label: 'Empreendimento' },
    { key: 'equipe_nome', label: 'Equipe' },
    { key: 'corretor_nome', label: 'Corretor' },
    { key: 'etapa_atual', label: 'Etapa Atual' },
    { key: 'reached_pastas', label: 'Atingiu Pastas', type: 'number' },
    { key: 'reached_aprovado_if', label: 'Atingiu Aprov. IF', type: 'number' },
    { key: 'reached_contrato', label: 'Atingiu Contrato', type: 'number' },
    { key: 'is_venda', label: 'E Venda', type: 'number' },
    { key: 'analise_credito_financiamento', label: 'Vlr Financiamento', type: 'money' },
    { key: 'unidade_valor_liquido', label: 'Vlr Liquido', type: 'money' },
    { key: 'processo_data_venda', label: 'Data Venda', type: 'date' },
    { key: 'venda_contabilizado_em', label: 'Data Contabil.', type: 'date' },
  ];

  if (loading) return <LoadingState message="Carregando funil de venda..." />;
  if (erro) return <p className="text-sm text-[#E74C3C]">Erro: {erro}</p>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <DateRangeFilter
          label="Período (cada métrica usa sua data)"
          start={period.start}
          end={period.end}
          onChange={(s, e) => setPeriod({ start: s, end: e })}
        />
        <MultiSelectFilter
          label="Empreendimento (opcional)"
          options={empOptions}
          selected={empSel}
          onChange={setEmpSel}
        />
      </div>

      <SectionTitle>Etapas do Funil</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard titulo="Cadastro" valor={fmtInt(totalCad)} legenda="Processos cadastrados no periodo" />
        <KPICard
          titulo="Pastas"
          valor={fmtInt(totalPas)}
          vgv={fmtMoeda(vgvPas)}
          legenda={`${fmtPct(pctPas)} sobre cadastros - com data de venda preenchida`}
          estilo="warning"
        />
        <KPICard
          titulo="Aprovado pela IF"
          valor={fmtInt(totalAprIf)}
          legenda={`${fmtPct(pctAprIf)} sobre cadastros - aprovado pela instituicao financeira`}
          estilo="warning"
        />
        <KPICard
          titulo="Contrato Gerado"
          valor={fmtInt(totalCont)}
          legenda={`${fmtPct(pctCont)} sobre cadastros - contrato de compra e venda gerado`}
          estilo="warning"
        />
        <KPICard
          titulo="Venda"
          valor={fmtInt(totalVen)}
          vgv={fmtMoeda(vgvVen)}
          legenda={`${fmtPct(pctVen)} sobre cadastros - com data de contabilizacao preenchida`}
          estilo="success"
        />
      </div>

      <SectionTitle>Visualizacao</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Funil de Venda" height={420}>
          <FunnelChart data={funnelData} />
        </ChartCard>
        <ChartCard title="Cadastros por Empreendimento (Top 15)" height={420}>
          <HBarChart data={porEmp} color={COR_PRIMARIA} />
        </ChartCard>
      </div>

      <SectionTitle>Detalhe</SectionTitle>
      <DataTable rows={cohorts.cad} columns={colunasTabela} filename="funil_venda.csv" />
    </div>
  );
}
