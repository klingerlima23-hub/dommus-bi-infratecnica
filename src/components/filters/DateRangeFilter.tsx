'use client';

interface Props {
  label: string;
  start: string; // ISO yyyy-mm-dd
  end: string;
  onChange: (start: string, end: string) => void;
}

export default function DateRangeFilter({ label, start, end, onChange }: Props) {
  return (
    <div>
      <label className="block text-[0.72rem] font-bold uppercase tracking-wider text-[#5A6677] mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => onChange(e.target.value, end)}
          className="px-3 py-2 bg-[#F4F6FA] border border-[#E5E9F0] rounded-md text-sm focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
        />
        <span className="text-[#5A6677]">→</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onChange(start, e.target.value)}
          className="px-3 py-2 bg-[#F4F6FA] border border-[#E5E9F0] rounded-md text-sm focus:bg-white focus:border-[#0F4C81] focus:outline-none transition"
        />
      </div>
    </div>
  );
}
