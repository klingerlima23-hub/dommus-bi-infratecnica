'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { COR_PRIMARIA, COR_BORDA } from '@/lib/paleta';

interface Props {
  data: Array<{ key: string; value: number }>;
  color?: string;
  formatter?: (v: number) => string;
  showLabel?: boolean;
}

export default function HorizontalBar({ data, color = COR_PRIMARIA, formatter, showLabel = true }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COR_BORDA} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#5A6677' }} />
        <YAxis dataKey="key" type="category" tick={{ fontSize: 11, fill: '#5A6677' }} width={140} />
        <Tooltip
          formatter={(v: number) => (formatter ? formatter(v) : v.toLocaleString('pt-BR'))}
          contentStyle={{ background: COR_PRIMARIA, color: 'white', border: 'none', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'white' }}
        />
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
