'use client';

import { useEffect, useMemo, useState } from 'react';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtPct } from '@/lib/format';
import { COR_ALERTA, COR_PRIMARIA, COR_SECUNDARIA } from '@/lib/paleta';
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
  [key: string]: unknown;
}

const DIAS_PARADO = 15;

function defaultDateRange() {
  const now = new Date();
  // Ano inteiro por padrao -- funil comercial tem ciclo longo, mes corrente
  // ficaria pouco representativo. Usuario pode ajustar via filtro.
  const start = new Date(now.getFullYear(), 0, 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

// Bucketiza dias sem atualizacao em faixas legiveis
function bucketDias(dias: number | null): string {
  if (dias === null) return 'Sem data';
  if (dias <= 7) return '0-7 dias';
  if (dias <= 14) return '8-14 dias';
  if (dias <= 30) return '15-30 dias';
  if (dias <= 60) return '31-60 dias';
  return '60+ dias';
}

// Ordem cronologica dos buckets pro gr fico
const ORDEM_BUCKETS = ['0-7 dias', '8-14 dias', '15-30 dias', '31-60 dias', '60+ dias', 'Sem data'];

export default function DashboardDanilo() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [period, setPeriod] = useState(defaultDateRange());
  const [empSel, setEmpSel] = useState<string[]>([]);
  const [gerSel, setGerSel] = useState<string[]>([]);
  const [corSel, setCorSel] = useState<string[]>([]);
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
      if (empSel.length && !empSel.includes(r.nome_empreendimento || '')) return false;
      if (gerSel.length && !gerSel.includes(r.nome_gerente || '')) return false;
      if (corSel.length && !corSel.includes(r.nome_corretor || '')) return false;
      if (statusSel.length && !statusSel.includes(r.status_oportunidade || '')) return false;
      return true;
    });
  }, [rows, period, empSel, gerSel, corSel, statusSel]);

  // Opcoes dos filtros -- montadas do dataset completo (nao do filtrado),
  // pra usuario ver todas as opcoes disponiveis sempre.
  const empOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nome_empreendimento).filter((x): x is string => !!x))).sort(),
    [rows],
  );
  const gerOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nome_gerente).filter((x): x is string => !!x))).sort(),
    [rows],
  );
  const corOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nome_corretor).filter((x): x is string => !!x))).sort(),
    [rows],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.status_oportunidade).filter((x): x is string => !!x))).sort(),
    [rows],
  );

  // KPIs
  const total = filtered.length;
  const parados = filtered.filter((r) => (r.dias_sem_atualizacao ?? 0) > DIAS_PARADO).length;
  const pctParados = total > 0 ? parados / total : 0;
  const diasComData = filtered.filter((r) => r.dias_sem_atualizacao !== null);
  const tempoMedioParado =
    diasComData.length > 0
      ? Math.round(diasComData.reduce((s, r) => s + (r.dias_sem_atualizacao ?? 0), 0) / diasComData.length)
      : 0;

  // Distribuicao por status (etapa) -- ordenado por ordem_status quando existe
  const porStatus = useMemo(() => {
    const map = new Map<string, { qtd: number; ordem: number }>();
    for (const r of filtered) {
      const k = r.status_oportunidade || 'Sem status';
      const cur = map.get(k) || { qtd: 0, ordem: r.ordem_status ?? 999 };
      cur.qtd += 1;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].ordem - b[1].ordem)
      .map(([key, v]) => ({ key, value: v.qtd }));
  }, [filtered]);

  // Distribuicao por faixa de dias sem atualizacao
  const porDiasParado = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = bucketDias(r.dias_sem_atualizacao);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return ORDEM_BUCKETS.filter((b) => map.has(b)).map((b) => ({ key: b, value: map.get(b) ?? 0 }));
  }, [filtered]);

  // Top 10 corretores com mais oportunidades no funil
  const porCorretor = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = r.nome_corretor || 'Sem corretor';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, value]) => ({ key, value }));
  }, [filtered]);

  // Top 10 empreendimentos
  const porEmpreendimento = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const k = r.nome_empreendimento || 'Sem empreendimento';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, value]) => ({ key, value }));
  }, [filtered]);

  // Tabela detalhada
  const dataTabela = filtered.map((r) => ({
    id_oportunidade: r.id_oportunidade,
    lead_nome: r.lead_nome ?? '',
    nome_empreendimento: r.nome_empreendimento ?? '',
    status_oportunidade: r.status_oportunidade ?? '',
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
        <MultiSelectFilter label="Empreendimento" options={empOptions} selected={empSel} onChange={setEmpSel} />
        <MultiSelectFilter label="Gerente" options={gerOptions} selected={gerSel} onChange={setGerSel} />
        <MultiSelectFilter label="Corretor" options={corOptions} selected={corSel} onChange={setCorSel} />
        <MultiSelectFilter label="Status" options={statusOptions} selected={statusSel} onChange={setStatusSel} />
      </div>

      {/* KPIs */}
      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          titulo="Contratos no Funil"
          valor={fmtInt(total)}
          legenda="Total no periodo selecionado"
        />
        <KPICard
          titulo="Parados (>15 dias)"
          valor={fmtInt(parados)}
          legenda="Sem atualizacao ha mais de 15 dias"
          estilo="alert"
        />
        <KPICard
          titulo="% Parados"
          valor={fmtPct(pctParados)}
          legenda="Percentual sobre total"
          estilo="warning"
        />
        <KPICard
          titulo="Tempo Medio Parado"
          valor={`${tempoMedioParado} dias`}
          legenda="Media de dias sem atualizacao"
        />
      </div>

      {/* Graficos */}
      <SectionTitle>Distribuicao</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard titulo="Por Etapa do Funil" subtitulo="Quantidade de contratos em cada status">
          <div style={{ width: '100%', height: Math.max(280, porStatus.length * 32) }}>
            <HBarChart data={porStatus} color={COR_PRIMARIA} />
          </div>
        </ChartCard>
        <ChartCard titulo="Tempo Sem Atualizacao" subtitulo="Distribuicao por faixa de dias parado">
          <div style={{ width: '100%', height: Math.max(280, porDiasParado.length * 40) }}>
            <HBarChart data={porDiasParado} color={COR_ALERTA} />
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard titulo="Top 10 Corretores" subtitulo="Corretores com mais contratos ativos">
          <div style={{ width: '100%', height: Math.max(280, porCorretor.length * 32) }}>
            <HBarChart data={porCorretor} color={COR_PRIMARIA} />
          </div>
        </ChartCard>
        <ChartCard titulo="Top 10 Empreendimentos" subtitulo="Empreendimentos com mais contratos no funil">
          <div style={{ width: '100%', height: Math.max(280, porEmpreendimento.length * 32) }}>
            <HBarChart data={porEmpreendimento} color={COR_SECUNDARIA} />
          </div>
        </ChartCard>
      </div>

      {/* Tabela detalhada */}
      <SectionTitle>Detalhe dos Contratos</SectionTitle>
      <DataTable
        data={dataTabela}
        columns={columns}
        rowLink={(r) => urlOportunidade(r.id_oportunidade)}
      />
    </div>
  );
}
