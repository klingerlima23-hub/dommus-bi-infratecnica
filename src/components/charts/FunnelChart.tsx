'use client';

import { ResponsiveContainer, FunnelChart as RFunnelChart, Funnel as RFunnel, Tooltip, LabelList, Cell } from 'recharts';
import { PALETA_GRAFICOS, COR_PRIMARIA } from '@/lib/paleta';

interface Props {
  /** [{ name: 'Leads', value: 220, pct: '100%' }, ...] do topo pra base */
  data: Array<{ name: string; value: number; pct?: string }>;
}

export default function ConversionFunnel({ data }: Props) {
  const enriched = data.map((d) => ({ ...d, label: d.pct ? `${d.value} (${d.pct})` : String(d.value) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RFunnelChart>
        <Tooltip
          contentStyle={{ background: COR_PRIMARIA, color: 'white', border: 'none', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'white' }}
        />
        <RFunnel dataKey="value" data={enriched} isAnimationActive>
          {enriched.map((_, i) => (
            <Cell key={i} fill={PALETA_GRAFICOS[i % PALETA_GRAFICOS.length]} />
          ))}
          <LabelList
            position="center"
            fill="#fff"
            stroke="none"
            dataKey="name"
            style={{ fontSize: 12, fontWeight: 600 }}
          />
          <LabelList
            position="right"
            fill="#1A2B3C"
            stroke="none"
            dataKey="label"
            style={{ fontSize: 11 }}
          />
        </RFunnel>
      </RFunnelChart>
    </ResponsiveContainer>
  );
}
