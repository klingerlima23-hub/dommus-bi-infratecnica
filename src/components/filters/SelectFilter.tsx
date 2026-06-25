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
      <label className="block text-[0.62rem] font-semibold uppercase tracking-wider text-[#7F8C8D] mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full h-9 px-3 bg-[#F4F6FA] border border-[#E5E9F0] rounded-md text-xs focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
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
