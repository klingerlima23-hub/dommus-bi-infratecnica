'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { PALETA_GRAFICOS, COR_PRIMARIA, COR_BORDA } from '@/lib/paleta';

interface Props {
  /** Cada item: { key: nomeDaCategoria (eixo Y), [serieX]: numero, ... } */
  data: Array<Record<string, string | number>>;
  /** Nomes das séries (etapas) que viram stacks */
  series: string[];
  showLegend?: boolean;
}

export default function StackedHBar({ data, series, showLegend = false }: Props) {
  // Pre-calcula o total de cada linha para o label no fim da barra empilhada
  const totals = data.map((row) => series.reduce((s, k) => s + (Number(row[k]) || 0), 0));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        // margem direita generosa pra acomodar o label do total fora da barra
        margin={{ top: 10, right: 48, left: 10, bottom: showLegend ? 40 : 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COR_BORDA} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#5A6677' }} />
        <YAxis dataKey="key" type="category" tick={{ fontSize: 11, fill: '#5A6677' }} width={150} />
        <Tooltip
          contentStyle={{ background: COR_PRIMARIA, color: 'white', border: 'none', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'white' }}
          itemStyle={{ color: 'white' }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconSize={10}
            verticalAlign="bottom"
            align="center"
          />
        )}
        {series.map((s, i) => {
          const isLast = i === series.length - 1;
          return (
            <Bar key={s} dataKey={s} stackId="a" fill={PALETA_GRAFICOS[i % PALETA_GRAFICOS.length]}>
              {isLast && (
                <LabelList
                  // o content custom posiciona o label no FIM da barra (apos o ultimo segmento)
                  // e renderiza o TOTAL da linha (soma de todas as series).
                  content={(props: {
                    x?: number;
                    y?: number;
                    width?: number;
                    height?: number;
                    index?: number;
                  }) => {
                    const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
                    const total = totals[index] ?? 0;
                    if (!total) return null;
                    return (
                      <text
                        x={x + width + 6}
                        y={y + height / 2}
                        fill="#1A2B3C"
                        fontSize={11}
                        fontWeight={600}
                        textAnchor="start"
                        dominantBaseline="central"
                      >
                        {total.toLocaleString('pt-BR')}
                      </text>
                    );
                  }}
                />
              )}
            </Bar>
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
