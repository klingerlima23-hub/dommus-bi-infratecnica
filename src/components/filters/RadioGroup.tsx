'use client';

interface Props<T extends string> {
  label?: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}

export default function RadioGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div>
      {label && (
        <label className="block text-[0.62rem] font-semibold uppercase tracking-wider text-[#7F8C8D] mb-1">
          {label}
        </label>
      )}
      <div className="inline-flex h-9 items-stretch gap-0.5 bg-[#F4F6FA] p-0.5 rounded-md border border-[#E5E9F0]">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`px-3 rounded text-xs font-semibold transition ${
                active ? 'bg-[#0F4C81] text-white' : 'bg-transparent text-[#5A6677] hover:bg-white'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
