'use client';

import { useEffect, useMemo, useState } from 'react';
import KPICard from '@/components/kpi/KPICard';
import ChartCard from '@/components/charts/ChartCard';
import HBarChart from '@/components/charts/HBarChart';
import PieChart from '@/components/charts/PieChart';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import SectionTitle from '@/components/layout/SectionTitle';
import LoadingState from '@/components/layout/LoadingState';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtMoeda } from '@/lib/format';
import { CORES_STATUS_ESTOQUE, LABEL_STATUS_ESTOQUE, ORDEM_STATUS_ESTOQUE } from '@/lib/paleta';

interface Row {
  id_unidade: number;
  descricao_unidade: string;
  disponibilidade: string;
  descricao_disponibilidade: string;
  id_processo: string;
  data_contrato: string | null;
  nome_empreendimento: string;
  valor_unidade: number | null;
}

/**
 * Classifica o status de estoque a partir do CODIGO de uma letra
 * gravado em f_espelho_de_venda.disponibilidade.
 *
 * Regra acordada com a cliente (Camila / Infratecnica):
 *   - VENDIDA agrega V (Vendida), A (Assinada no Banco),
 *                    S (Registrada) e X (Vendida - cliente nao registrado).
 *   - O card "Registrada" continua existindo, porem zerado
 *     (todas as 'S' sao contadas em VENDIDA).
 *
 * Mapa completo dos codigos:
 *   D = DISPONIVEL PARA VENDA
 *   V = VENDIDA
 *   X = VENDIDA (CLIENTE NAO REGISTRADO)
 *   A = ASSINADA NO BANCO
 *   S = REGISTRADA
 *   R = RESERVADA
 *   B = RESERVA TECNICA
 *   I = INDISPONIVEL PARA VENDA
 */
function classificarStatus(codigo: string): keyof typeof LABEL_STATUS_ESTOQUE {
  const c = (codigo || '').trim().toUpperCase();
  if (c === 'D') return 'DISPONIVEL';
  if (c === 'V' || c === 'X' || c === 'A' || c === 'S') return 'VENDIDA';
  if (c === 'R' || c === 'B') return 'RESERVA';
  return 'OUTROS';
}

export default function EstoquePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [empSel, setEmpSel] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/data/estoque')
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

  const enriched = useMemo(
    () => rows.map((r) => ({ ...r, _status: classificarStatus(r.disponibilidade) })),
    [rows]
  );

  const filtrado = useMemo(
    () => (empSel.length ? enriched.filter((r) => empSel.includes(r.nome_empreendimento)) : enriched),
    [enriched, empSel]
  );

  const empOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nome_empreendimento).filter(Boolean))).sort(),
    [rows]
  );

  // Cards por status
  const stats = useMemo(() => {
    const acc: Record<string, { qtd: number; vgv: number }> = {};
    for (const s of ORDEM_STATUS_ESTOQUE) acc[s] = { qtd: 0, vgv: 0 };
    for (const r of filtrado) {
      const s = r._status;
      acc[s].qtd += 1;
      acc[s].vgv += Number(r.valor_unidade) || 0;
    }
    return acc;
  }, [filtrado]);

  // Pizza disponibilidade
  const pieData = useMemo(
    () =>
      ORDEM_STATUS_ESTOQUE.map((s) => ({
        key: LABEL_STATUS_ESTOQUE[s],
        value: stats[s].qtd,
      })).filter((d) => d.value > 0),
    [stats]
  );
  const pieColors = useMemo(
    () => ORDEM_STATUS_ESTOQUE.filter((s) => stats[s].qtd > 0).map((s) => CORES_STATUS_ESTOQUE[s]),
    [stats]
  );

  // HBar empreendimento
  const porEmp = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtrado) {
      const k = r.nome_empreendimento || '—';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [filtrado]);

  const colunas: Column<Row & { _status: string }>[] = [
    { key: 'id_unidade', label: 'Unidade', type: 'number' },
    { key: 'descricao_unidade', label: 'Descrição' },
    { key: 'descricao_disponibilidade', label: 'Disponibilidade' },
    { key: 'nome_empreendimento', label: 'Empreendimento' },
    { key: 'id_processo', label: 'Processo' },
    { key: 'data_contrato', label: 'Data Contrato', type: 'date' },
    { key: 'valor_unidade', label: 'Valor Unidade', type: 'money' },
  ];

  if (loading) return <LoadingState message="Carregando dados de estoque…" />;
  if (erro) return <p className="text-sm text-[#E74C3C]">Erro: {erro}</p>;

  return (
    <div>
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <MultiSelectFilter label="Empreendimento (opcional)" options={empOptions} selected={empSel} onChange={setEmpSel} />
      </div>

      {/* KPIs */}
      <SectionTitle>Indicadores</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          titulo="Vendida"
          valor={fmtInt(stats.VENDIDA.qtd)}
          vgv={fmtMoeda(stats.VENDIDA.vgv)}
        />
        <KPICard
          titulo="Disponivel"
          valor={fmtInt(stats.DISPONIVEL.qtd)}
          vgv={fmtMoeda(stats.DISPONIVEL.vgv)}
          estilo="success"
        />
        <KPICard
          titulo="Reserva Tecnica"
          valor={fmtInt(stats.RESERVA.qtd)}
          vgv={fmtMoeda(stats.RESERVA.vgv)}
          estilo="warning"
        />
        <KPICard titulo="Registrada" valor={fmtInt(stats.REGISTRADA.qtd)} vgv={fmtMoeda(stats.REGISTRADA.vgv)} />
      </div>

      <SectionTitle>Gráficos</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Distribuição por Status" height={360}>
          <PieChart data={pieData} colors={pieColors} donut />
        </ChartCard>
        <ChartCard title="Por Empreendimento" height={360}>
          <HBarChart data={porEmp} />
        </ChartCard>
      </div>

      <SectionTitle>Detalhe</SectionTitle>
      <DataTable rows={filtrado} columns={colunas} filename="estoque.csv" />
    </div>
  );
}
