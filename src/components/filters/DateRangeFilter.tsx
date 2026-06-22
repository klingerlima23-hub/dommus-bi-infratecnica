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
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={pendingStart}
          onChange={(e) => setPendingStart(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-3 py-2 bg-[#F4F6FA] border border-[#E5E9F0] rounded-md text-sm focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
        />
        <span className="text-[#5A6677] text-sm">ate</span>
        <input
          type="date"
          value={pendingEnd}
          onChange={(e) => setPendingEnd(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-3 py-2 bg-[#F4F6FA] border border-[#E5E9F0] rounded-md text-sm focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
        />
        <button
          type="button"
          onClick={aplicar}
          disabled={!dirty}
          title={dirty ? 'Aplicar o periodo selecionado' : 'Nenhuma alteracao pendente'}
          className={
            'px-4 py-2 rounded-md text-sm font-semibold transition border ' +
            (dirty
              ? 'bg-[#0F4C81] text-white border-[#0F4C81] hover:bg-[#0B3A66] cursor-pointer'
              : 'bg-[#F4F6FA] text-[#5A6677] border-[#E5E9F0] cursor-not-allowed')
          }
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
