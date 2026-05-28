import { cn } from '@/lib/utils';

export type KPIEstilo = 'default' | 'success' | 'warning' | 'alert';

interface Props {
  titulo: string;
  valor: string;
  vgv?: string;
  legenda?: string;
  estilo?: KPIEstilo;
}

const VALOR_COLOR: Record<KPIEstilo, string> = {
  default: 'text-[#0F4C81]',
  success: 'text-[#2ECC71]',
  warning: 'text-[#F6A623]',
  alert: 'text-[#E74C3C]',
};

export default function KPICard({ titulo, valor, vgv, legenda, estilo = 'default' }: Props) {
  return (
    <div
      // min-h em vez de height fixo: o card cresce se o conteudo (legenda longa)
      // exigir, e o grid uniformiza todos os cards da linha pela maior altura.
      // 9.5rem da espaco pra ate 3 linhas de legenda com fonte de ~9.5px.
      className="bg-white border border-[#E5E9F0] rounded-[14px] px-5 py-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)] flex flex-col overflow-hidden min-h-[9.5rem]"
    >
      <p className="text-[0.82rem] uppercase tracking-[0.4px] text-[#5A6677] font-semibold mb-1.5">
        {titulo}
      </p>
      <p className={cn('text-[1.85rem] font-bold leading-tight mb-1.5', VALOR_COLOR[estilo])}>{valor}</p>
      {vgv && <p className="text-[0.82rem] text-[#2ECC71] font-semibold mb-1.5">VGV {vgv}</p>}
      {legenda && (
        // text-[0.6rem] (~9.6px) + leading-tight: 3 linhas cabem confortavel
        // num card 9.5rem mesmo com VGV presente.
        <p className="text-[0.6rem] leading-tight text-[#5A6677] mt-auto break-words">{legenda}</p>
      )}
    </div>
  );
}
