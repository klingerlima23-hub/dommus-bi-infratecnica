'use client';

import { useState } from 'react';
import RadioGroup from '@/components/filters/RadioGroup';
import VendasVisaoAtual from './_VisaoAtual';
import VendasFunilVenda from './_FunilVenda';
import VendasRanking from './_RankingVendas';
import VendasDistratos from './_Distratos';

const SUB_ABAS = ['Visao Atual', 'Funil de Venda', 'Ranking Vendas', 'Distratos'] as const;
type SubAba = (typeof SUB_ABAS)[number];

export default function VendasPage() {
  const [aba, setAba] = useState<SubAba>('Visao Atual');
  return (
    <div>
      <div className="mb-6">
        <RadioGroup label="Visao" options={SUB_ABAS} value={aba} onChange={setAba} />
      </div>
      {aba === 'Visao Atual' && <VendasVisaoAtual />}
      {aba === 'Funil de Venda' && <VendasFunilVenda />}
      {aba === 'Ranking Vendas' && <VendasRanking />}
      {aba === 'Distratos' && <VendasDistratos />}
    </div>
  );
}
