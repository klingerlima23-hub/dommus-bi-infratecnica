'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth';

interface ClienteInfo {
  id: number;
  nome: string;
  logo: string;
}

function iniciais(nome: string): string {
  const parts = (nome || '').trim().split(/\s+/);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STORAGE_KEY = 'dommus_sidebar_collapsed';

export default function Sidebar({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  // ISO 8601 em UTC (com Z) da ultima execucao bem-sucedida do ETL.
  // O navegador converte automaticamente pro timezone local no render.
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  // Restaura preferencia ao montar (evita flash inicial)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    }
  }, []);

  // Carrega identidade visual do cliente (logo + nome) a partir do DW.
  // Origem: dw_mpto.d_cliente_dommus (alimentada pelo ETL).
  useEffect(() => {
    let cancelado = false;
    fetch('/api/data/cliente', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelado && data && typeof data === 'object' && 'logo' in data) {
          setCliente(data as ClienteInfo);
        }
      })
      .catch((err) => {
        // Falha silenciosa: a Sidebar continua usavel sem a logo.
        console.error('[Sidebar] falha ao carregar /api/data/cliente:', err);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Carrega timestamp da ultima execucao do ETL (em UTC, ISO 8601 com Z).
  // Origem: dw_mpto.meta_etl_execucao (gravada pelo orquestrador).
  useEffect(() => {
    let cancelado = false;
    fetch('/api/data/etl-status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { atualizado_em: null }))
      .then((d: { atualizado_em?: string | null }) => {
        if (!cancelado) setAtualizadoEm(d?.atualizado_em ?? null);
      })
      .catch((err) => {
        console.error('[Sidebar] falha ao carregar /api/data/etl-status:', err);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      }
      return next;
    });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function refresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <aside
      className={cn(
        // sticky top-0 + h-screen: a sidebar gruda no topo da viewport e nao
        // rola junto com o conteudo, garantindo que o footer (Atualizado em /
        // Produzido por) fique sempre visivel no canto inferior esquerdo.
        // overflow-y-auto: se o conteudo da sidebar passar da altura da
        // viewport, ela rola internamente (sem empurrar o footer pra fora).
        'sticky top-0 h-screen overflow-y-auto shrink-0 bg-[#F7F9FC] border-r border-[#E5E9F0] flex flex-col transition-[width] duration-200 ease-out',
        collapsed ? 'w-[56px]' : 'w-[280px]'
      )}
    >
      {/* Toggle button - fixed na viewport, na borda direita do sidebar */}
      <button
        onClick={toggle}
        title={collapsed ? 'Expandir' : 'Recolher'}
        style={{ left: collapsed ? '44px' : '268px' }}
        className="fixed top-1/2 -translate-y-1/2 z-20 w-6 h-12 rounded-md bg-white border border-[#E5E9F0] text-[#5A6677] hover:bg-[#0F4C81] hover:text-white hover:border-[#0F4C81] shadow-sm transition-[left,background,color] duration-200 flex items-center justify-center"
      >
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      {collapsed ? (
        // Modo recolhido: avatar + ações em ícones
        <>
          <div className="flex flex-col items-center gap-3 px-2 pt-6">
            <div
              className="w-9 h-9 rounded-full bg-[#0F4C81] text-white text-xs font-bold flex items-center justify-center"
              title={`${user.nome || 'Usuário'} (${user.email})`}
            >
              {iniciais(user.nome || user.email)}
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Atualizar dados"
              className="p-2 rounded-md bg-white border border-[#E5E9F0] text-[#1A2B3C] hover:bg-[#0F4C81] hover:text-white hover:border-[#0F4C81] transition disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={logout}
              title="Sair"
              className="p-2 rounded-md bg-white border border-[#E5E9F0] text-[#1A2B3C] hover:bg-[#E74C3C] hover:text-white hover:border-[#E74C3C] transition"
            >
              <LogOut size={14} />
            </button>
          </div>
          <div className="flex-1" />
        </>
      ) : (
        // Modo expandido: layout original
        <>
          {/* 1. Logo (carregada do DW: d_cliente_dommus) */}
          <div className="px-6 pt-6 pb-4 flex justify-center items-center min-h-[80px]">
            {cliente?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cliente.logo}
                alt={cliente.nome || 'Cliente'}
                className="max-h-[80px] max-w-[180px] object-contain"
              />
            ) : cliente?.nome ? (
              // Fallback: se a logo nao carregou mas o nome veio, mostra o nome.
              <span className="text-[0.95rem] font-bold text-[#1A2B3C] tracking-wide">
                {cliente.nome}
              </span>
            ) : (
              // Loading inicial: placeholder vazio (mantem altura).
              <span className="block w-[180px] h-[60px]" aria-hidden />
            )}
          </div>

          <div className="border-b border-[#E5E9F0] mx-4" />

          {/* 2. User info */}
          <div className="px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-full bg-[#0F4C81] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {iniciais(user.nome || user.email)}
              </div>
              <div className="min-w-0">
                <p className="text-[0.78rem] font-bold uppercase tracking-wide text-[#1A2B3C] truncate">
                  {user.nome || 'Usuário'}
                </p>
                <p className="text-[0.7rem] text-[#5A6677] truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-[#E5E9F0] mx-4" />

          {/* 3. Ações */}
          <div className="px-4 py-4 flex flex-col gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="w-full bg-white hover:bg-[#0F4C81] hover:text-white border border-[#E5E9F0] hover:border-[#0F4C81] rounded-md px-3 py-2 text-sm font-medium text-[#1A2B3C] transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Atualizar dados
            </button>
            <button
              onClick={logout}
              className="w-full bg-white hover:bg-[#E74C3C] hover:text-white border border-[#E5E9F0] hover:border-[#E74C3C] rounded-md px-3 py-2 text-sm font-medium text-[#1A2B3C] transition flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>

          <div className="flex-1" />

          {/* 4. Footer */}
          <div className="px-4 py-4 text-center border-t border-[#E5E9F0]">
            <p className="text-[0.7rem] text-[#5A6677]">
              {atualizadoEm
                ? // new Date(ISO-UTC) interpreta como UTC; toLocaleString sem timeZone
                  // converte automaticamente pro timezone do navegador do usuario.
                  `Atualizado em ${new Date(atualizadoEm).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Atualizado em —'}
            </p>
            <a
              href="https://www.dommus.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1 text-[0.7rem] text-[#5A6677] hover:text-[#0F4C81] transition"
            >
              Produzido por <b>Dommus Tecnologia</b>
            </a>
          </div>
        </>
      )}
    </aside>
  );
}
