import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

/**
 * Pool MySQL singleton. Em dev, reusa o pool entre HMR reloads.
 * Em prod (Vercel serverless) cada cold start cria um novo, mas dentro
 * de uma execução múltiplas queries compartilham conexão.
 */
function getPool(): mysql.Pool {
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      timezone: 'Z',
      dateStrings: false,
    });
  }
  return global._mysqlPool;
}

/**
 * Executa uma query e retorna rows tipadas.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

/**
 * Executa uma query e retorna um único row (ou null).
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
