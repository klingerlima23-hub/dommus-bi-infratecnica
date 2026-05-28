'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { COR_PRIMARIA, COR_BORDA } from '@/lib/paleta';

interface Props {
  data: Array<{ key: string; value: number }>;
  color?: string;
  yKey?: string;
  formatter?: (v: number) => string;
  showLabel?: boolean;
}

export default function VerticalBar({
  data,
  color = COR_PRIMARIA,
  formatter,
  showLabel = true,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* margem top um pouco maior pro label do topo nao cortar */}
      <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COR_BORDA} />
        <XAxis dataKey="key" tick={{ fontSize: 11, fill: '#5A6677' }} angle={-30} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11, fill: '#5A6677' }} />
        <Tooltip
          formatter={(v: number) => (formatter ? formatter(v) : v.toLocaleString('pt-BR'))}
          contentStyle={{ background: COR_PRIMARIA, color: 'white', border: 'none', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'white' }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
          {showLabel && (
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: 11, fill: '#1A2B3C', fontWeight: 600 }}
              formatter={(v: number) => (formatter ? formatter(v) : v.toLocaleString('pt-BR'))}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
