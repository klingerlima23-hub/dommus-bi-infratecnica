'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { fmtData, fmtMoeda, fmtInt } from '@/lib/format';

export type ColType = 'string' | 'number' | 'money' | 'date' | 'datetime';

export interface Column<T> {
  key: keyof T & string;
  label: string;
  type?: ColType;
  width?: number;
}

interface Props<T extends object> {
  rows: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  enableExport?: boolean;
  filename?: string;
}

function formatCell(v: unknown, type: ColType = 'string'): string {
  if (v === null || v === undefined || v === '') return '';
  switch (type) {
    case 'money':
      return fmtMoeda(Number(v));
    case 'number':
      return fmtInt(Number(v));
    case 'date':
      return fmtData(v as string | Date);
    case 'datetime':
      return new Date(v as string).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return String(v);
  }
}

function exportCsv<T extends object>(rows: T[], cols: Column<T>[], filename: string) {
  const lines = [cols.map((c) => `"${c.label}"`).join(';')];
  for (const r of rows) {
    lines.push(
      cols
        .map((c) => {
          const v = r[c.key];
          const s = v === null || v === undefined ? '' : String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(';')
    );
  }
  const blob = new Blob(['ï»¿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataTable<T extends object>({
  rows,
  columns,
  emptyMessage = 'Sem dados.',
  enableExport = true,
  filename = 'dados.csv',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const k = sortKey;
    return [...rows].sort((a, b) => {
      // Cast para Record<string, unknown> apenas para a leitura dinamica
      // pela chave string (sortKey vem do click no header da coluna).
      const va = (a as Record<string, unknown>)[k];
      const vb = (b as Record<string, unknown>)[k];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(k: string) {
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-[#5A6677] py-6 text-center">{emptyMessage}</p>;
  }

  return (
    <div>
      {enableExport && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => exportCsv(rows, columns, filename)}
            className="text-xs bg-white hover:bg-[#0F4C81] hover:text-white border border-[#E5E9F0] hover:border-[#0F4C81] rounded px-3 py-1.5 transition flex items-center gap-1.5"
          >
            <Download size={12} /> Baixar CSV
          </button>
        </div>
      )}
      <div className="overflow-auto border border-[#E5E9F0] rounded-md max-h-[440px]">
        <table className="w-full text-xs">
          <thead className="bg-[#F4F6FA] sticky top-0 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  style={{ width: c.width }}
                  className="px-3 py-2 text-left font-semibold text-[#5A6677] uppercase tracking-wider cursor-pointer hover:bg-[#E5E9F0] whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sortKey === c.key &&
                      (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} className="border-t border-[#E5E9F0] hover:bg-[#F7F9FC]">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-1.5 whitespace-nowrap text-[#1A2B3C]">
                    {formatCell(r[c.key], c.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[0.7rem] text-[#5A6677] mt-1.5">{rows.length} linhas</p>
    </div>
  );
}
