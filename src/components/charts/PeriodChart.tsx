'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { COR_PRIMARIA, COR_SUCESSO, COR_BORDA } from '@/lib/paleta';
import { fmtMoeda } from '@/lib/format';

interface Props {
  /** [{ periodo: 'Mai/2026', qtd: 22, vgv: 0 }, ...] */
  data: Array<{ periodo: string; qtd: number; vgv?: number }>;
  showVgv?: boolean;
}

export default function PeriodChart({ data, showVgv = false }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COR_BORDA} />
        <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#5A6677' }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#5A6677' }} />
        {showVgv && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#2ECC71' }} />}
        <Tooltip
          formatter={(v: number, name: string) =>
            name === 'vgv' ? fmtMoeda(v) : v.toLocaleString('pt-BR')
          }
          contentStyle={{ background: COR_PRIMARIA, color: 'white', border: 'none', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'white' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="left" dataKey="qtd" name="Qtd" fill={COR_PRIMARIA} radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="qtd"
            position="top"
            style={{ fontSize: 11, fill: '#1A2B3C', fontWeight: 600 }}
            formatter={(v: number) => v.toLocaleString('pt-BR')}
          />
        </Bar>
        {showVgv && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="vgv"
            name="VGV"
            stroke={COR_SUCESSO}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COR_SUCESSO }}
          >
            <LabelList
              dataKey="vgv"
              position="top"
              style={{ fontSize: 10, fill: '#2ECC71', fontWeight: 600 }}
              formatter={(v: number) => fmtMoeda(v)}
            />
          </Line>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
