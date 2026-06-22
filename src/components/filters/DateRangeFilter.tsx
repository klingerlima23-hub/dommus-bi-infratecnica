'use client';

import { useEffect, useState } from 'react';

interface Props {
  label: string;
  start: string; // ISO yyyy-mm-dd
  end: string;
  onChange: (start: string, end: string) => void;
}

/**
 * Filtro de periodo com botao "Aplicar".
 *
 * Antes: cada digitacao numa das datas disparava onChange e forcava
 * recalculo do dashboard. Em telas com muitos dados, isso travava a UI
 * (ainda mais com data-pickers que disparam onChange a cada digito).
 *
 * Agora: o componente mantem estado local "pendente" e so propaga o
 * onChange para o pai quando o usuario clica em "Aplicar". Se o pai
 * mudar start/end por fora (ex.: reset), o estado local re-sincroniza.
 */
export default function DateRangeFilter({ label, start, end, onChange }: Props) {
  const [pendingStart, setPendingStart] = useState(start);
  const [pendingEnd, setPendingEnd] = useState(end);

  // Re-sincroniza com as props caso o pai altere as datas por fora
  // (ex.: botao "limpar filtro", troca de aba que reseta o range).
  useEffect(() => {
    setPendingStart(start);
  }, [start]);
  useEffect(() => {
    setPendingEnd(end);
  }, [end]);

  const dirty = pendingStart !== start || pendingEnd !== end;

  function aplicar() {
    onChange(pendingStart, pendingEnd);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      aplicar();
    }
  }

  return (
    <div>
      <label className="block text-[0.72rem] font-bold uppercase tracking-wider text-[#5A6677] mb-1.5">
        {label}
      </label>
      {/* Container unico: datas + 'ate' + Aplicar dentro de UMA caixa branca
          com borda fina, igual ao mockup. Os <input type=date> ficam sem
          borda propria (transparentes); o 'Aplicar' fica como texto/link
          bold a direita -- azul Dommus quando ha mudanca pendente, cinza
          claro (desabilitado) quando nao ha. */}
      <div className="inline-flex items-center gap-2 bg-white border border-[#E5E9F0] rounded-md px-3 py-1.5 focus-within:border-[#0F4C81] transition">
        <input
          type="date"
          value={pendingStart}
          onChange={(e) => setPendingStart(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-0 outline-none text-sm text-[#1A2B3C] px-1"
        />
        <span className="text-[#5A6677] text-sm">ate</span>
        <input
          type="date"
          value={pendingEnd}
          onChange={(e) => setPendingEnd(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-0 outline-none text-sm text-[#1A2B3C] px-1"
        />
        <button
          type="button"
          onClick={aplicar}
          disabled={!dirty}
          title={dirty ? 'Aplicar o periodo selecionado' : 'Nenhuma alteracao pendente'}
          className={
            'ml-1 pl-2 text-sm font-bold transition ' +
            (dirty
              ? 'text-[#1A2B3C] hover:text-[#0F4C81] cursor-pointer'
              : 'text-[#B0BEC5] cursor-not-allowed')
          }
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
