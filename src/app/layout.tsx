import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BI Comercial | Infratécnica',
  description: 'Dommus Inteligência - Dashboard ETL Infratécnica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
