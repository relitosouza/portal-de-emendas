/**
 * setup-db.ts
 *
 * Inicializa o banco de dados PostgreSQL criando as tabelas necessárias.
 *
 * Uso:
 *   DATABASE_URL="postgresql://usuario:senha@host:5432/portal_emendas" npx tsx scripts/setup-db.ts
 *
 * Execute este script UMA vez antes de iniciar o sistema em produção.
 */

import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("[setup-db] Erro: variável de ambiente DATABASE_URL não definida.");
    console.error('Exemplo: DATABASE_URL="postgresql://usuario:senha@localhost:5432/portal_emendas" npx tsx scripts/setup-db.ts');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const CREATE_TABLE_SQL = `
-- Tabela de armazenamento chave-valor genérico (substitui Redis)
-- Cada "arquivo" JSON vira uma entrada com sua chave correspondente.
CREATE TABLE IF NOT EXISTS kv_store (
    key         VARCHAR(255) PRIMARY KEY,
    value       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscas por data de atualização (útil para auditoria)
CREATE INDEX IF NOT EXISTS idx_kv_store_updated_at ON kv_store (updated_at);

-- Comentários descritivos nas chaves esperadas
COMMENT ON TABLE kv_store IS
    'Armazenamento de dados do Portal de Emendas. '
    'Chaves: amendments, emendas-externas, financial, cards, sync_info.';
`;

async function main() {
    console.log("[setup-db] Conectando ao banco de dados...");

    const client = await pool.connect();
    try {
        console.log("[setup-db] Criando tabelas...");
        await client.query(CREATE_TABLE_SQL);
        console.log("[setup-db] ✓ Tabela kv_store criada/verificada com sucesso.");

        // Verifica se já existem dados
        const result = await client.query("SELECT key, updated_at FROM kv_store ORDER BY key");
        if (result.rows.length === 0) {
            console.log("[setup-db] Banco vazio — na primeira execução o sistema fará seed automático a partir dos arquivos /data/*.json.");
        } else {
            console.log(`[setup-db] Entradas existentes no banco:`);
            result.rows.forEach((row) =>
                console.log(`   - ${row.key} (atualizado em ${row.updated_at})`)
            );
        }

        console.log("\n[setup-db] Configuração concluída. O sistema está pronto para uso.");
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((err) => {
    console.error("[setup-db] Falha na configuração:", err);
    process.exit(1);
});
