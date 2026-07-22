'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/dashboard/vendas', label: 'Vendas' },
  { href: '/dashboard/estoque', label: 'Estoque' },
  { href: '/dashboard/visitas', label: 'Visitas' },
  { href: '/dashboard/lead', label: 'Lead' },
  { href: '/dashboard/danilo', label: 'Danilo' },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b-2 border-[#E5E9F0] mb-6">
      <div className="flex gap-1">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'px-5 py-2.5 rounded-t-lg text-sm font-semibold transition',
                active
                  ? 'bg-[#0F4C81] text-white'
                  : 'bg-transparent text-[#5A6677] hover:bg-[#F4F6FA] hover:text-[#0F4C81]'
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
