import { Pool } from "pg";

// Singleton para evitar múltiplas conexões em dev (hot-reload do Next.js)
const globalForPg = global as typeof global & { pgPool?: Pool };

export function getPool(): Pool {
    if (!globalForPg.pgPool) {
        globalForPg.pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
        });

        globalForPg.pgPool.on("error", (err) => {
            console.error("[db] Erro inesperado no pool PostgreSQL:", err);
        });
    }
    return globalForPg.pgPool;
}

export async function dbQuery<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
): Promise<T[]> {
    const pool = getPool();
    const result = await pool.query(sql, params);
    return result.rows as T[];
}
