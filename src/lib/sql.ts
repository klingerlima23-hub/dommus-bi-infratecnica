import fs from 'node:fs';
import path from 'node:path';

/**
 * Cache de SQLs lidos do disco (lê uma vez por processo).
 */
const sqlCache = new Map<string, string>();

/**
 * Lê um arquivo .sql de src/sql/ e retorna o conteúdo.
 * Os arquivos têm os mesmos nomes do projeto v001 (consulta_d_*.sql, etc).
 */
export function loadSql(name: string): string {
  if (!name.endsWith('.sql')) name = name + '.sql';
  const cached = sqlCache.get(name);
  if (cached) return cached;

  const sqlDir = path.join(process.cwd(), 'src', 'sql');
  const filePath = path.join(sqlDir, name);
  const content = fs.readFileSync(filePath, 'utf-8');
  sqlCache.set(name, content);
  return content;
}
