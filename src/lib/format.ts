/**
 * Formatadores compatíveis com o v001 (locale pt-BR).
 */

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '0';
  return Math.round(Number(v)).toLocaleString('pt-BR');
}

export function fmtMoeda(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return 'R$ 0,00';
  return Number(v).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtPct(v: number | null | undefined, casas = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '0,0%';
  return Number(v).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }) + '%';
}

export function fmtData(v: string | Date | null | undefined): string {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

export function fmtDataHora(v: string | Date | null | undefined): string {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Pivot: agrupa array de objetos por uma chave de dimensão e soma uma chave numérica.
 *
 * Nota: a constraint `T extends object` (em vez de `Record<string, unknown>`)
 * e' mais permissiva e aceita interfaces TS comuns (sem index signature),
 * que e' como as paginas declaram suas linhas. O `keyof T` mantem a
 * verificacao de chaves validas.
 */
export function groupBySum<T extends object>(
  rows: T[],
  dim: keyof T,
  metricFn: (r: T) => number,
  topN?: number
): Array<{ key: string; value: number }> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const raw = r[dim];
    const k = raw == null ? '' : String(raw).trim();
    if (!k || ['nan', 'none', '0', '0.0', 'nat', '<na>', 'null'].includes(k.toLowerCase())) continue;
    map.set(k, (map.get(k) ?? 0) + (metricFn(r) || 0));
  }
  let out = Array.from(map.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
  if (topN) out = out.slice(0, topN);
  return out;
}

/**
 * Conta linhas agrupadas por dimensão. Filtra valores vazios.
 */
export function groupByCount<T extends object>(
  rows: T[],
  dim: keyof T,
  topN?: number
): Array<{ key: string; value: number }> {
  return groupBySum(rows, dim, () => 1, topN);
}

/**
 * Bucketiza um campo de data por granularidade.
 */
export type Granularidade = 'Dia' | 'Semana' | 'Mes' | 'Trimestre' | 'Ano';

export function bucketDate(d: Date, gran: Granularidade): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  switch (gran) {
    case 'Dia':
      return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    case 'Semana': {
      // ISO week
      const tmp = new Date(d);
      tmp.setHours(0, 0, 0, 0);
      tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
      const yearStart = new Date(tmp.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return `${tmp.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    case 'Mes': {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${months[m - 1]}/${y}`;
    }
    case 'Trimestre': {
      const q = Math.ceil(m / 3);
      return `${y}-T${q}`;
    }
    case 'Ano':
      return String(y);
  }
}
