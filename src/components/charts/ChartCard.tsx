import { cn } from '@/lib/utils';

export default function ChartCard({
  title,
  children,
  className,
  height = 360,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E5E9F0] rounded-[14px] px-4 py-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]',
        className
      )}
    >
      <h3 className="text-[0.95rem] font-semibold text-[#0F4C81] mb-3">{title}</h3>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
