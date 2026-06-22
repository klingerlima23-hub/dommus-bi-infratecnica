'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trophy, Medal, TrendingUp, Coins, Target } from 'lucide-react';
import RadioGroup from '@/components/filters/RadioGroup';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import LoadingState from '@/components/layout/LoadingState';
import SectionTitle from '@/components/layout/SectionTitle';
import DataTable, { type Column } from '@/components/tables/DataTable';
import { fmtInt, fmtMoeda } from '@/lib/format';
import { urlProcesso } from '@/lib/urls';

interface Row {
  processo_id: number;
  id_corretor: number;
  corretor_nome: string;
  url_foto_perfil: string | null;
  id_gerente: number | null;
  gerente_nome: string | null;
  id_equipe: number | null;
  equipe_nome: string | null;
  empreendimento_nome: string;
  unidade_descricao: string | null;
  processo_cadastrado_em: string | null;
  processo_data_venda: string | null;
  venda_data: string | null;
  venda_contabilizado_em: string | null;
  etapa_atual: string | null;
  lead_origem: string | null;
  lead_campanha: string | null;
  lead_midia: string | null;
  unidade_valor: number | null;
  unidade_valor_liquido: number | null;
  processo_unidade_id: number | null;
  [key: string]: unknown;
}

interface RankItem {
  id_corretor: number;
  corretor: string;
  foto: string | null;
  gerente: string;
  equipe: string;
  qtd: number;
  vgv: number;
  ticket: number;
}

const TIPOS_DATA = ['Data de Venda', 'Data de Contabilizacao'] as const;
type TipoData = (typeof TIPOS_DATA)[number];

function defaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(now) };
}

function iniciais(nome: string) {
  const parts = (nome || '').trim().split(/\s+/);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar do corretor. Usa <img> quando d_corretor.url_foto_perfil esta
 * preenchido; cai pras iniciais sobre fundo azul Dommus em qualquer
 * falha (URL nula, imagem 404, dominio bloqueado). 'size' em px.
 *
 * Paleta unificada -- todos os avatares em azul Dommus pra evitar
 * a "festa de cores" e manter foco no rank/gamification.
 */
function Avatar({
  nome,
  foto,
  size,
  className = '',
}: {
  nome: string;
  foto: string | null;
  size: number;
  className?: string;
}) {
  const [erro, setErro] = useState(false);
  const usaFoto = !!foto && !erro;
  const px = `${size}px`;
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        background: usaFoto ? '#E5E9F0' : '#0F4C81',
        fontSize: `${Math.max(10, size * 0.36)}px`,
      }}
      title={nome}
    >
      {usaFoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto as string}
          alt={nome}
          className="w-full h-full object-cover"
          onError={() => setErro(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{iniciais(nome)}</span>
      )}
    </div>
  );
}

export default function RankingVendas() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [period, setPeriod] = useState(defaultDateRange());
  // Default 'Data de Contabilizacao' porque na Infratecnica o campo
  // processo_data_venda fica NULL na maioria dos registros (a venda
  // entra no fluxo via contabilizacao). Se o usuario quiser, troca
  // pra 'Data de Venda' manualmente e o fallback abaixo cuida do resto.
  const [tipoData, setTipoData] = useState<TipoData>('Data de Contabilizacao');
  const [empSel, setEmpSel] = useState<string[]>([]);
  const [gerSel, setGerSel] = useState<string[]>([]);
  const [eqSel, setEqSel] = useState<string[]>([]);

  // Paginacao do leaderboard (10 por pagina)
  const PAGE_SIZE = 10;
  const [pagina, setPagina] = useState(1);
  // Volta pra pagina 1 sempre que filtros / dados mudam (evita pagina
  // vazia quando filtro reduz drasticamente o ranking).
  useEffect(() => {
    setPagina(1);
  }, [period, tipoData, empSel, gerSel, eqSel, rows.length]);

  useEffect(() => {
    let alive = true;
    fetch('/api/data/ranking-vendas')
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

  // Pega a data de referencia da linha conforme o modo selecionado.
  // 'Data de Venda' tenta venda_data primeiro (tb_venda.data), faz fallback
  // pra processo_data_venda (tb_processo.data_venda) -- garante que o filtro
  // funcione mesmo com qualidade de dado heterogenea.
  function getDateOf(r: Row): string | null {
    if (tipoData === 'Data de Venda') {
      return r.venda_data || r.processo_data_venda || null;
    }
    return r.venda_contabilizado_em || null;
  }

  const filtered = useMemo(() => {
    const ini = new Date(period.start);
    const fim = new Date(period.end + 'T23:59:59');
    return rows.filter((r) => {
      const v = getDateOf(r);
      if (!v) return false;
      const d = new Date(v);
      if (d < ini || d > fim) return false;
      if (empSel.length && !empSel.includes(r.empreendimento_nome)) return false;
      if (gerSel.length && !gerSel.includes(r.gerente_nome || '')) return false;
      if (eqSel.length && !eqSel.includes(r.equipe_nome || '')) return false;
      return true;
    });
  }, [rows, period, tipoData, empSel, gerSel, eqSel]);

  const ranking: RankItem[] = useMemo(() => {
    const map = new Map<
      number,
      {
        corretor: string;
        foto: string | null;
        gerente: string;
        equipe: string;
        qtd: number;
        vgv: number;
      }
    >();
    for (const r of filtered) {
      const k = r.id_corretor;
      const cur = map.get(k) || {
        corretor: r.corretor_nome,
        foto: r.url_foto_perfil || null,
        gerente: r.gerente_nome || '',
        equipe: r.equipe_nome || '',
        qtd: 0,
        vgv: 0,
      };
      cur.qtd += 1;
      cur.vgv += Number(r.unidade_valor_liquido) || 0;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .map(([id_corretor, x]) => ({
        id_corretor,
        ...x,
        ticket: x.qtd ? x.vgv / x.qtd : 0,
      }))
      .sort((a, b) => b.vgv - a.vgv);
  }, [filtered]);

  const totalVgv = ranking.reduce((s, r) => s + r.vgv, 0);
  const totalQtd = ranking.reduce((s, r) => s + r.qtd, 0);
  const ticketMedio = totalQtd ? totalVgv / totalQtd : 0;

  const empOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.empreendimento_nome).filter(Boolean))).sort(),
    [rows],
  );
  const gerOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.gerente_nome).filter((x): x is string => !!x)),
      ).sort(),
    [rows],
  );
  const eqOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.equipe_nome).filter((x): x is string => !!x)),
      ).sort(),
    [rows],
  );

  if (loading) return <LoadingState />;
  if (erro) return <div className="p-6 text-red-600">{erro}</div>;

  const top3 = ranking.slice(0, 3);

  return (
    <div>
      {/* ============ FILTROS ============
          Grid em 12 colunas no lg, divisao 3+3+2+2+2 = 12:
            - Periodo (2 inputs + Aplicar)        -> 3 cols
            - Filtrar por (RadioGroup 2 opcoes)   -> 3 cols  (cabe "Data de Venda" + "Data de Contabilizacao" inline)
            - Empreendimento / Equipe / Gerente   -> 2 cols cada
          Em md vira 2 colunas; em mobile, 1. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-6 bg-[#F7F9FC] border border-[#E5E9F0] rounded-md p-4">
        <div className="lg:col-span-3">
          <DateRangeFilter
            label={`Periodo (${tipoData.toLowerCase()})`}
            start={period.start}
            end={period.end}
            onChange={(start, end) => setPeriod({ start, end })}
          />
        </div>
        <div className="lg:col-span-3">
          <RadioGroup
            label="Filtrar por"
            options={TIPOS_DATA}
            value={tipoData}
            onChange={setTipoData}
          />
        </div>
        <div className="lg:col-span-2">
          <MultiSelectFilter
            label="Empreendimento"
            options={empOptions}
            selected={empSel}
            onChange={setEmpSel}
          />
        </div>
        <div className="lg:col-span-2">
          <MultiSelectFilter
            label="Equipe"
            options={eqOptions}
            selected={eqSel}
            onChange={setEqSel}
          />
        </div>
        <div className="lg:col-span-2">
          <MultiSelectFilter
            label="Gerente"
            options={gerOptions}
            selected={gerSel}
            onChange={setGerSel}
          />
        </div>
      </div>

      {/* ============ KPIs HEADLINE ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiHeadline
          icon={<Coins size={22} />}
          titulo="VGV Total"
          valor={fmtMoeda(totalVgv)}
          subtitulo={`No periodo (${tipoData.toLowerCase()})`}
          accent="#F6A623"
        />
        <KpiHeadline
          icon={<TrendingUp size={22} />}
          titulo="Vendas"
          valor={fmtInt(totalQtd)}
          subtitulo={`${ranking.length} ${ranking.length === 1 ? 'corretor ativo' : 'corretores ativos'}`}
          accent="#2ECC71"
        />
        <KpiHeadline
          icon={<Target size={22} />}
          titulo="Ticket Medio"
          valor={fmtMoeda(ticketMedio)}
          subtitulo="VGV / Vendas"
          accent="#0F4C81"
        />
      </div>

      {ranking.length === 0 ? (
        <div className="text-center text-[#5A6677] py-16">
          Sem dados pro periodo / filtros selecionados. Ajuste os filtros acima.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ============ PODIO ============ */}
            <div className="lg:col-span-5 flex flex-col">
              <SectionTitle>Podio Top 3</SectionTitle>
              {/* Container com altura fixa pra alinhar com o leaderboard.
                  Cards usam % de altura pra criar o efeito de podio
                  (1o maior, 3o menor) -- base fica alinhada via mt-auto. */}
              <div className="grid grid-cols-3 gap-3 items-stretch flex-1 min-h-[480px]">
                <PodiumCard item={top3[1]} rank={2} heightPct={70} />
                <PodiumCard item={top3[0]} rank={1} heightPct={88} />
                <PodiumCard item={top3[2]} rank={3} heightPct={55} />
              </div>
            </div>

            {/* ============ LEADERBOARD ============ */}
            <div className="lg:col-span-7 flex flex-col">
              <SectionTitle>Leaderboard</SectionTitle>
              {(() => {
                const totalPaginas = Math.max(1, Math.ceil(ranking.length / PAGE_SIZE));
                const paginaAtual = Math.min(pagina, totalPaginas);
                const inicio = (paginaAtual - 1) * PAGE_SIZE;
                const fim = inicio + PAGE_SIZE;
                const slice = ranking.slice(inicio, fim);
                return (
                  <div className="bg-white border border-[#E5E9F0] rounded-[14px] shadow-[0_1px_3px_rgba(16,24,40,0.04)] overflow-hidden flex-1 flex flex-col min-h-[480px]">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#F4F6FA] border-b border-[#E5E9F0] text-[0.72rem] font-bold uppercase tracking-wider text-[#5A6677]">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-5">Corretor(a)</div>
                      <div className="col-span-2 text-right">Vendas</div>
                      <div className="col-span-4 text-right">VGV</div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {slice.map((r, idx) => (
                        <LeaderRow
                          key={r.id_corretor}
                          item={r}
                          pos={inicio + idx + 1}
                          totalVgv={totalVgv}
                        />
                      ))}
                    </div>

                    {/* Controles de paginacao (sempre visiveis pra dar contexto) */}
                    <div className="border-t border-[#E5E9F0] px-4 py-2.5 flex items-center justify-between text-[0.72rem] text-[#5A6677]">
                      <span>
                        Mostrando <b>{ranking.length === 0 ? 0 : inicio + 1}</b>–
                        <b>{Math.min(fim, ranking.length)}</b> de{' '}
                        <b>{ranking.length}</b>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPagina((p) => Math.max(1, p - 1))}
                          disabled={paginaAtual <= 1}
                          className="px-2.5 py-1 rounded border border-[#E5E9F0] bg-white hover:bg-[#0F4C81] hover:text-white hover:border-[#0F4C81] transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#5A6677] disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <span className="px-2 font-semibold text-[#1A2B3C]">
                          {paginaAtual} / {totalPaginas}
                        </span>
                        <button
                          onClick={() =>
                            setPagina((p) => Math.min(totalPaginas, p + 1))
                          }
                          disabled={paginaAtual >= totalPaginas}
                          className="px-2.5 py-1 rounded border border-[#E5E9F0] bg-white hover:bg-[#0F4C81] hover:text-white hover:border-[#0F4C81] transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#5A6677] disabled:cursor-not-allowed"
                        >
                          Proxima
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ============ TABELA DETALHADA ============ */}
          <SectionTitle>Detalhamento das Vendas</SectionTitle>
          <DetalhamentoTable rows={filtered} />
        </>
      )}
    </div>
  );
}

// ============================================================================
// KPI HEADLINE
// ============================================================================
function KpiHeadline({
  icon,
  titulo,
  valor,
  subtitulo,
  accent,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: string;
  subtitulo: string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-[#E5E9F0] rounded-[14px] px-5 py-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)] flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.72rem] uppercase tracking-wider text-[#5A6677] font-semibold">
          {titulo}
        </p>
        <p className="text-[1.6rem] font-bold text-[#1A2B3C] leading-tight truncate">{valor}</p>
        <p className="text-[0.72rem] text-[#5A6677]">{subtitulo}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PODIO CARD
//
// Estrutura (de cima pra baixo, dentro do container h-full):
//   - Avatar (todos na mesma altura)
//   - Nome do corretor + equipe (proximos ao avatar)
//   - Card azul colado na BASE (mt-auto) com altura variavel (heightPct)
//       * Icone no topo do card (taca/medalha)
//       * Bloco VGV+vendas centralizado vertical (flex-1 + justify-center)
//
// Como o card usa mt-auto, a BASE dele alinha com o item-end do grid pai --
// e como o leaderboard tambem tem min-h-[N], as bases coincidem.
// ============================================================================
function PodiumCard({
  item,
  rank,
  heightPct,
}: {
  item: RankItem | undefined;
  rank: 1 | 2 | 3;
  heightPct: number;
}) {
  if (!item) {
    return (
      <div className="flex flex-col items-center h-full">
        <div className="w-14 h-14 rounded-full bg-[#E5E9F0] mb-2" />
        <p className="text-[0.7rem] text-[#5A6677]">—</p>
        <div
          className="w-full rounded-[14px] mt-auto bg-[#F4F6FA] border border-dashed border-[#E5E9F0] flex items-center justify-center text-[#5A6677] text-xs"
          style={{ height: `${heightPct}%` }}
        >
          —
        </div>
      </div>
    );
  }

  const medalha =
    rank === 1
      ? { cor: '#F6A623', label: '1' }   // ouro
      : rank === 2
      ? { cor: '#B0BEC5', label: '2' }   // prata
      : { cor: '#CD7F32', label: '3' };  // bronze

  return (
    // 'justify-end' faz o conjunto (avatar + nome + card) descer pra BASE
    // do container. Como o card tem altura proporcional, torres mais baixas
    // empurram o avatar pra mais baixo no container -- ou seja, cada avatar
    // fica AUTOMATICAMENTE colado ao topo da sua propria torre.
    <div className="flex flex-col items-center h-full justify-end">
      <Avatar
        nome={item.corretor}
        foto={item.foto}
        size={56}
        className="ring-4 ring-white shadow-md"
      />
      <p
        className="mt-1.5 text-[0.78rem] font-bold text-[#1A2B3C] text-center truncate w-full px-1"
        title={item.corretor}
      >
        {item.corretor}
      </p>
      {item.equipe && (
        <p
          className="text-[0.65rem] text-[#5A6677] text-center truncate w-full px-1"
          title={item.equipe}
        >
          {item.equipe}
        </p>
      )}

      {/* Card azul (altura proporcional, base alinhada via container) */}
      <div
        className="w-full mt-2 rounded-[14px] flex flex-col items-center px-2 pt-6 pb-4 text-white shadow-md"
        style={{ height: `${heightPct}%`, background: '#0F4C81' }}
      >
        {/* Icone no topo do card (taca pro 1, medalha pra 2 e 3) */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow"
          style={{ background: medalha.cor }}
        >
          {rank === 1 ? (
            <Trophy size={22} className="text-white" fill="#fff" />
          ) : (
            <Medal size={26} className="text-white" />
          )}
        </div>

        {/* VGV + vendas -- centralizados verticalmente */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <p className="text-[1.05rem] font-extrabold leading-tight text-center break-all">
            {fmtMoeda(item.vgv)}
          </p>
          <p className="text-[0.6rem] uppercase tracking-wider opacity-80 mt-0.5">VGV</p>
          <p className="text-[0.78rem] font-semibold mt-2">
            {fmtInt(item.qtd)} {item.qtd === 1 ? 'venda' : 'vendas'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEADERBOARD ROW
// ============================================================================
function LeaderRow({
  item,
  pos,
  totalVgv,
}: {
  item: RankItem;
  pos: number;
  totalVgv: number;
}) {
  const pctVgv = totalVgv ? (item.vgv / totalVgv) * 100 : 0;
  // Rank badge mantem gold/silver/bronze pros top 3 (toque de gamification);
  // resto fica cinza neutro. Barra de progresso e' sempre azul Dommus.
  const rankBg =
    pos === 1
      ? '#F6A623'
      : pos === 2
      ? '#B0BEC5'
      : pos === 3
      ? '#CD7F32'
      : '#E5E9F0';
  const rankFg = pos <= 3 ? '#fff' : '#5A6677';

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#F4F6FA] items-center text-sm transition hover:bg-[#F7F9FC]">
      {/* Rank */}
      <div className="col-span-1 flex items-center justify-center">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
          style={{ background: rankBg, color: rankFg }}
        >
          {pos}
        </span>
      </div>

      {/* Colaborador (avatar + nome + equipe) */}
      <div className="col-span-5 flex items-center gap-2.5 min-w-0">
        <Avatar nome={item.corretor} foto={item.foto} size={32} />
        <div className="min-w-0">
          <p className="text-[0.85rem] font-semibold text-[#1A2B3C] truncate">{item.corretor}</p>
          {item.equipe && (
            <p className="text-[0.7rem] text-[#5A6677] truncate" title={item.equipe}>
              {item.equipe}
            </p>
          )}
        </div>
      </div>

      {/* Qtd Vendas */}
      <div className="col-span-2 text-right">
        <span className="font-bold text-[#0F4C81]">{fmtInt(item.qtd)}</span>
      </div>

      {/* VGV + barra de progresso (sempre azul Dommus) */}
      <div className="col-span-4 text-right">
        <p className="text-[0.85rem] font-bold text-[#1A2B3C]">{fmtMoeda(item.vgv)}</p>
        <div className="mt-1 h-1.5 bg-[#F4F6FA] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all bg-[#0F4C81]"
            style={{ width: `${Math.min(pctVgv, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TABELA DETALHADA (DataTable do projeto)
// ============================================================================
function DetalhamentoTable({ rows }: { rows: Row[] }) {
  // Mapeia os rows pra ter os campos no formato esperado pelo DataTable.
  const data = rows.map((r) => ({
    processo_id: r.processo_id,
    corretor_nome: r.corretor_nome,
    equipe_nome: r.equipe_nome ?? '',
    gerente_nome: r.gerente_nome ?? '',
    processo_cadastrado_em: r.processo_cadastrado_em,
    processo_data_venda: r.processo_data_venda,
    venda_data: r.venda_data,
    venda_contabilizado_em: r.venda_contabilizado_em,
    empreendimento_nome: r.empreendimento_nome ?? '',
    unidade_descricao: r.unidade_descricao ?? '',
    etapa_atual: r.etapa_atual ?? '',
    lead_origem: r.lead_origem ?? '',
    lead_campanha: r.lead_campanha ?? '',
    lead_midia: r.lead_midia ?? '',
    unidade_valor_liquido: r.unidade_valor_liquido,
    unidade_valor: r.unidade_valor,
  }));

  type Linha = (typeof data)[number];

  const columns: Column<Linha>[] = [
    { key: 'processo_id', label: 'Processo', type: 'number' },
    { key: 'corretor_nome', label: 'Corretor', type: 'string' },
    { key: 'equipe_nome', label: 'Equipe', type: 'string' },
    { key: 'gerente_nome', label: 'Gerente', type: 'string' },
    { key: 'processo_cadastrado_em', label: 'Data Cadastro', type: 'date' },
    { key: 'processo_data_venda', label: 'Data Venda', type: 'date' },
    { key: 'venda_contabilizado_em', label: 'Data Contabilizacao', type: 'date' },
    { key: 'empreendimento_nome', label: 'Empreendimento', type: 'string' },
    { key: 'unidade_descricao', label: 'Unidade', type: 'string' },
    { key: 'etapa_atual', label: 'Etapa Atual', type: 'string' },
    { key: 'lead_origem', label: 'Origem', type: 'string' },
    { key: 'lead_campanha', label: 'Campanha', type: 'string' },
    { key: 'lead_midia', label: 'Midia', type: 'string' },
    { key: 'unidade_valor_liquido', label: 'Valor Liquido', type: 'money' },
    { key: 'unidade_valor', label: 'Valor Unidade', type: 'money' },
  ];

  return (
    <DataTable
      rows={data}
      columns={columns}
      rowLink={(r) => urlProcesso(r.processo_id)}
      enableExport
      filename="ranking-vendas-detalhamento"
      emptyMessage="Sem vendas pro periodo / filtros selecionados."
    />
  );
}
