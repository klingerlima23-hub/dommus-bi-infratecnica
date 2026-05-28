'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
} from 'recharts';
import { Eye, EyeOff } from 'lucide-react';
import { PALETA_GRAFICOS, COR_PRIMARIA } from '@/lib/paleta';

interface Props {
  data: Array<{ key: string; value: number }>;
  colors?: string[];
  donut?: boolean;
  formatter?: (v: number) => string;
  /** Mostra valor + % na ponta de cada fatia (com linha guia). Default: true. */
  showLabel?: boolean;
  /** Texto pequeno acima do total no centro do donut. Passe '' para omitir. Default: "Total" */
  centerSubtitle?: string;
  /**
   * Renderiza um pequeno botao discreto no canto superior direito que oculta
   * ou exibe a legenda inferior. Util pra donuts com muitas categorias.
   */
  legendToggleable?: boolean;
}

// Renderiza label custom na fatia: valor + % na ponta de uma linha guia.
// Fatias com fatia menor que 4% nao recebem label (evita amontoado).
function buildRenderLabel(formatter?: (v: number) => string) {
  return function renderLabel(props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    outerRadius?: number;
    percent?: number;
    value?: number;
  }) {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, value = 0 } = props;
    if (percent < 0.04) return null;
    const RAD = Math.PI / 180;
    const r = outerRadius + 14;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const txt = formatter ? formatter(value) : value.toLocaleString('pt-BR');
    return (
      <text
        x={x}
        y={y}
        fill="#1A2B3C"
        fontSize={11}
        fontWeight={600}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${txt} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };
}

export default function Donut({
  data,
  colors = PALETA_GRAFICOS,
  donut = true,
  formatter,
  showLabel = true,
  centerSubtitle = 'Total',
  legendToggleable = false,
}: Props) {
  // Comeca com a legenda visivel; o botao alterna entre os dois estados.
  const [legendVisible, setLegendVisible] = useState(true);

  // Total para mostrar no centro do donut
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const totalTxt = formatter ? formatter(total) : total.toLocaleString('pt-BR');

  const hasSubtitle = !!centerSubtitle;
  const showCenter = donut && total > 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {legendToggleable && (
        <button
          type="button"
          onClick={() => setLegendVisible((v) => !v)}
          title={legendVisible ? 'Ocultar legenda' : 'Mostrar legenda'}
          aria-label={legendVisible ? 'Ocultar legenda' : 'Mostrar legenda'}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 2,
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid #E5E9F0',
            borderRadius: 6,
            padding: '3px 5px',
            color: '#5A6677',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#F4F6FA';
            (e.currentTarget as HTMLButtonElement).style.color = '#0F4C81';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.85)';
            (e.currentTarget as HTMLButtonElement).style.color = '#5A6677';
          }}
        >
          {legendVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            cx="50%"
            cy="50%"
            innerRadius={donut ? '55%' : 0}
            outerRadius="70%"
            paddingAngle={1}
            label={showLabel ? buildRenderLabel(formatter) : undefined}
            labelLine={showLabel ? { stroke: '#B9C0CB' } : false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
            {/*
              Center label DENTRO do SVG: ancora no centro real do donut,
              que o proprio Recharts calcula (descontando a area da Legend
              quando ela esta visivel). Sem isso o overlay HTML desalinha
              quando a legenda aparece embaixo.
            */}
            {showCenter && (
              <Label
                position="center"
                content={(props: any) => {
                  const vb = props.viewBox ?? {};
                  const cx = vb.cx ?? 0;
                  const cy = vb.cy ?? 0;
                  // Quando ha subtitle, deslocamos o numero um pouco pra baixo
                  // pra acomodar a label acima sem perder o centro otico.
                  const yNumero = hasSubtitle ? cy + 8 : cy;
                  const ySub = cy - 10;
                  return (
                    <g pointerEvents="none">
                      {hasSubtitle && (
                        <text
                          x={cx}
                          y={ySub}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#5A6677"
                          fontSize={11}
                          fontWeight={500}
                          letterSpacing="0.02em"
                        >
                          {centerSubtitle}
                        </text>
                      )}
                      <text
                        x={cx}
                        y={yNumero}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#1A2B3C"
                        fontSize={22}
                        fontWeight={700}
                      >
                        {totalTxt}
                      </text>
                    </g>
                  );
                }}
              />
            )}
          </Pie>
          <Tooltip
            formatter={(v: number) => (formatter ? formatter(v) : v.toLocaleString('pt-BR'))}
            contentStyle={{
              background: COR_PRIMARIA,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
            }}
            // itemStyle: cor da linha do tooltip (NOME: valor). Sem isso,
            // o Recharts herda a cor da fatia (azul escuro), ficando ilegivel
            // sobre o fundo tambem azul escuro.
            itemStyle={{ color: 'white' }}
            labelStyle={{ color: 'white' }}
          />
          {legendVisible && <Legend wrapperStyle={{ fontSize: 11 }} verticalAlign="bottom" />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
