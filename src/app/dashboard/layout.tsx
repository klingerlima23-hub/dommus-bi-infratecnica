import { redirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import TabNav from '@/components/layout/TabNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />
      <main className="flex-1 px-6 lg:px-10 py-6 overflow-auto">
        <TabNav />
        {children}
      </main>

      {/* FAB WhatsApp */}
      <a
        href={process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/5531999999999'}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        title="Suporte via WhatsApp"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
