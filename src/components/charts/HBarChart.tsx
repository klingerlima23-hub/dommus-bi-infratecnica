'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { COR_PRIMARIA, COR_BORDA } from '@/lib/paleta';

/**
 * Extras opcionais renderizados como linhas adicionais no tooltip.
 * Ex: [{ label: 'Valor Estimado', value: 'R$ 12.345,67' }]
 */
export interface HBarExtra {
  label: string;
  value: string;
}

interface Props {
  data: Array<{ key: string; value: number; extras?: HBarExtra[] }>;
  color?: string;
  formatter?: (v: number) => string;
  showLabel?: boolean;
}

// Tooltip custom: alem do valor principal (formatado via `formatter`),
// renderiza as linhas de `extras` do proprio item. Se o item nao trouxer
// extras, cai no comportamento padrao (so o valor principal).
function buildCustomTooltip(formatter?: (v: number) => string) {
  return function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0];
    const p = item.payload as { key: string; value: number; extras?: HBarExtra[] };
    const valorTxt = formatter ? formatter(p.value) : p.value.toLocaleString('pt-BR');
    return (
      <div
        style={{
          background: COR_PRIMARIA,
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 12,
          padding: '8px 10px',
          minWidth: 140,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.key}</div>
        <div style={{ opacity: 0.9 }}>Qtd: <b>{valorTxt}</b></div>
        {p.extras?.map((e) => (
          <div key={e.label} style={{ opacity: 0.9, marginTop: 2 }}>
            {e.label}: <b>{e.value}</b>
          </div>
        ))}
      </div>
    );
  };
}

export default function HorizontalBar({ data, color = COR_PRIMARIA, formatter, showLabel = true }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COR_BORDA} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#5A6677' }} />
        <YAxis dataKey="key" type="category" tick={{ fontSize: 11, fill: '#5A6677' }} width={140} />
        <Tooltip content={buildCustomTooltip(formatter)} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
          {showLabel && (
            <LabelList
              dataKey="value"
              position="right"
              style={{ fontSize: 11, fill: '#5A6677' }}
              formatter={(v: number) => (formatter ? formatter(v) : v.toLocaleString('pt-BR'))}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
