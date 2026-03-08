/**
 * Converte CSV de ExecucaoFinanceira para financial.json
 *
 * Uso:
 *   npx tsx scripts/csv-financial-to-json.ts <arquivo.csv>
 */

import fs from "fs";
import path from "path";

function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const next = content[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                row.push(current.trim());
                current = "";
            } else if (char === "\n" || (char === "\r" && next === "\n")) {
                row.push(current.trim());
                current = "";
                if (row.some((cell) => cell !== "")) {
                    rows.push(row);
                }
                row = [];
                if (char === "\r") i++;
            } else {
                current += char;
            }
        }
    }

    if (current || row.length > 0) {
        row.push(current.trim());
        if (row.some((cell) => cell !== "")) {
            rows.push(row);
        }
    }

    return rows;
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("Uso: npx tsx scripts/csv-financial-to-json.ts <arquivo.csv>");
        process.exit(1);
    }

    const csvPath = path.resolve(args[0]);
    const outputPath = path.join(process.cwd(), "data", "financial.json");

    if (!fs.existsSync(csvPath)) {
        console.error(`Erro: Arquivo não encontrado: ${csvPath}`);
        process.exit(1);
    }

    console.log(`Lendo CSV: ${csvPath}`);
    const content = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(content);

    if (rows.length < 2) {
        console.error("Erro: CSV vazio.");
        process.exit(1);
    }

    const dataRows = rows.slice(1); // skip header
    console.log(`Linhas de dados: ${dataRows.length}`);

    // Colunas: ID Emenda, Empenhado, Liquidado, Pago, Reservado, Data da Ultima atualização
    const records = dataRows.map((row) => ({
        amendmentId: row[0] || "",
        empenhado: row[1] || "0",
        liquidado: row[2] || "0",
        pago: row[3] || "0",
        reservado: row[4] || "0",
        updatedAt: row[5] || new Date().toISOString(),
    }));

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), "utf-8");
    console.log(`\n✓ ${records.length} registros financeiros salvos em: ${outputPath}`);
}

main();
