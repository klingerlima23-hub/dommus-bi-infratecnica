'use client';
import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

interface Props {
  label: string;
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

export default function DateRangeFilter({ label, start, end, onChange }: Props) {
  const [localStart, setLocalStart] = useState(start);
  const [localEnd, setLocalEnd] = useState(end);

  useEffect(() => { setLocalStart(start); }, [start]);
  useEffect(() => { setLocalEnd(end); }, [end]);

  const dirty = localStart !== start || localEnd !== end;

  function aplicar() {
    if (dirty) onChange(localStart, localEnd);
  }
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') aplicar();
  }

  const inputClasses = 'bg-transparent border-0 outline-none text-xs text-[#1A2B3C] px-0';

  return (
    <div>
      <label className="block text-[0.62rem] font-semibold uppercase tracking-wider text-[#7F8C8D] mb-1">
        {label}
      </label>
      <div className="inline-flex h-9 items-center gap-3 bg-white border border-[#E5E9F0] rounded-md px-3">
        <Calendar size={14} className="text-[#5A6677] shrink-0" />
        <input type="date" value={localStart} onChange={(e) => setLocalStart(e.target.value)} onKeyDown={handleKeyDown} className={inputClasses} />
        <span className="text-[#5A6677] text-xs">ate</span>
        <Calendar size={14} className="text-[#5A6677] shrink-0" />
        <input type="date" value={localEnd} onChange={(e) => setLocalEnd(e.target.value)} onKeyDown={handleKeyDown} className={inputClasses} />
        <button
          type="button"
          onClick={aplicar}
          disabled={!dirty}
          className={'ml-1 text-[#0F4C81] text-xs font-semibold transition ' + (dirty ? 'opacity-100 cursor-pointer hover:underline' : 'opacity-40 cursor-not-allowed')}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
