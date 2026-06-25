'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectFilter({ label, options, selected, onChange, placeholder = 'Selecione…' }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }

  const filtered = options.filter((o) => o.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="relative inline-block w-44" ref={ref}>
      <label className="block text-[0.62rem] font-semibold uppercase tracking-wider text-[#7F8C8D] mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-9 px-2.5 bg-[#F4F6FA] border border-[#E5E9F0] rounded-md text-xs text-left flex items-center justify-between hover:bg-white hover:border-[#0F4C81] transition"
      >
        <span className="truncate text-[#1A2B3C]">
          {selected.length === 0 ? <span className="text-[#5A6677]">{placeholder}</span> : `${selected.length} selecionado(s)`}
        </span>
        <ChevronDown size={16} className="text-[#5A6677] shrink-0" />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-[0.7rem] bg-[#0F4C81] text-white rounded px-1.5 py-0.5 uppercase"
            >
              {s}
              <button onClick={() => toggle(s)} className="hover:text-[#F6A623]">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 min-w-full w-[14rem] bg-white border border-[#E5E9F0] rounded-md shadow-lg max-h-72 overflow-hidden flex flex-col">
          <input
            type="text"
            placeholder="Filtrar…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border-b border-[#E5E9F0] text-xs focus:outline-none"
          />
          <div className="overflow-auto flex-1">
            {filtered.length === 0 && <p className="text-xs text-[#5A6677] px-3 py-2">Nenhuma opção</p>}
            {filtered.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[#F4F6FA] text-left"
                >
                  <span
                    className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 ${
                      checked ? 'bg-[#0F4C81] border-[#0F4C81]' : 'border-[#E5E9F0]'
                    }`}
                  >
                    {checked && <Check size={10} className="text-white" />}
                  </span>
                  <span className="truncate uppercase">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
