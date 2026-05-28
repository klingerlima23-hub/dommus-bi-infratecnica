'use client';

interface Props<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}

export default function SelectFilter<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div>
      <label className="block text-[0.72rem] font-bold uppercase tracking-wider text-[#5A6677] mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E5E9F0] rounded-md text-sm focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
