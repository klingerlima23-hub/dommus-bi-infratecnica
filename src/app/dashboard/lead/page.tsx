'use client';

import { useState } from 'react';
import RadioGroup from '@/components/filters/RadioGroup';
import LeadVisaoGeral from './_VisaoGeral';
import LeadFunil from './_FunilInvestimento';

const SUB_ABAS = ['Visao Geral', 'Funil & Investimento'] as const;
type SubAba = (typeof SUB_ABAS)[number];

export default function LeadPage() {
  const [aba, setAba] = useState<SubAba>('Visao Geral');
  return (
    <div>
      <div className="mb-6">
        <RadioGroup label="Visao" options={SUB_ABAS} value={aba} onChange={setAba} />
      </div>
      {aba === 'Visao Geral' ? <LeadVisaoGeral /> : <LeadFunil />}
    </div>
  );
}
