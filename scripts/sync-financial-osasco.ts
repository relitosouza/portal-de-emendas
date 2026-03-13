/**
 * Sincroniza dados financeiros do Portal de Transparência de Osasco
 * 
 * Uso:
 *   npx tsx scripts/sync-financial-osasco.ts
 */

import fs from 'fs';
import path from 'path';

// Ignorar erro de certificado SSL do portal de Osasco (comum em portais governamentais)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configurações da API de Osasco
const OSASCO_API_URL = 'https://transparencia.osasco.sp.gov.br/paiportalserver/modulovisao/filter';
const CURRENT_EXERCISE = 2026;
const CURRENT_PERIOD = 'MARCO'; // Pode ser automatizado depois

interface PortalRecord {
    ID: number;
    Exercicio: number;
    DescVinculo: string;
    AutorEmenda: string;
    Objeto: string;
    SaldoAtual: string;
    Reservado: string;
    Empenhado: string;
    Liquidado: string;
    ValorPago: string; // Nota: campo no portal é ValorPago ou Pago
}

interface LocalAmendment {
    id: string;
    numeroEmenda: string;
    objeto: string;
    autor: string;
}

interface FinancialRecord {
    amendmentId: string;
    empenhado: string;
    liquidado: string;
    pago: string;
    reservado: string;
    updatedAt: string;
}

async function fetchPortalData() {
    console.log(`\n[1/3] Consultando API de Osasco (${CURRENT_PERIOD}/${CURRENT_EXERCISE})...`);
    
    const payload = {
        "ChaveModulo": "66",
        "NomeVisao": "EmendasParlamentares",
        "Filtros": [],
        "Periodicidade": "MENSAL",
        "Periodo": CURRENT_PERIOD,
        "Exercicio": CURRENT_EXERCISE,
        "Pagina": 1,
        "QuantidadeRegistros": "300", 
        "Ordenacao": [{ "ColunaOrdem": "ID", "TipoOrdem": "ascend", "Ordem": 1 }]
    };

    try {
        const response = await fetch(OSASCO_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://transparencia.osasco.sp.gov.br',
                'Referer': 'https://transparencia.osasco.sp.gov.br/'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.Valores as PortalRecord[];
    } catch (err) {
        console.error("Erro ao buscar dados do portal:", err);
        return [];
    }
}

function parsePortalCurrency(val: string): string {
    if (!val) return "0";
    // "20.000,00" -> "20000.00" (mantendo como string mas formato numérico para o sistema)
    return val.replace(/\./g, '').replace(',', '.').trim();
}

function extractBaseNumber(str: string): string | null {
    if (!str) return null;
    const match = str.match(/(\d+)/);
    return match ? match[1].padStart(3, '0') : null;
}

function main() {
    const dataDir = path.join(process.cwd(), 'data');
    const amendmentsPath = path.join(dataDir, 'amendments.json');
    const financialPath = path.join(dataDir, 'financial.json');

    if (!fs.existsSync(amendmentsPath)) {
        console.error("Erro: arquivo amendments.json não encontrado.");
        return;
    }

    const localAmendments: LocalAmendment[] = JSON.parse(fs.readFileSync(amendmentsPath, 'utf-8'));
    
    fetchPortalData().then(portalRecords => {
        if (portalRecords.length === 0) {
            console.error("Nenhum dado retornado do portal.");
            return;
        }

        console.log(`[2/3] Mapeando ${portalRecords.length} registros do portal para ${localAmendments.length} emendas locais...`);

        const financialUpdates: FinancialRecord[] = [];
        let matchedCount = 0;

        // Tentar carregar financeiro existente para merge
        let existingFinancial: FinancialRecord[] = [];
        try {
            existingFinancial = JSON.parse(fs.readFileSync(financialPath, 'utf-8'));
        } catch { /* novo arquivo */ }

        const financialMap = new Map<string, FinancialRecord>();
        existingFinancial.forEach(r => financialMap.set(r.amendmentId, r));

        for (const local of localAmendments) {
            const localBase = extractBaseNumber(local.numeroEmenda);
            
            // Busca o melhor match no portal
            const portalMatch = portalRecords.find(p => {
                const portalBase = extractBaseNumber(p.DescVinculo);
                
                // Match Primário: Número da Emenda (ex: 066)
                const numberMatch = localBase && portalBase && localBase === portalBase;
                
                // Match Secundário: Objeto (parcial)
                const objectMatch = local.objeto && p.Objeto && 
                                   (local.objeto.substring(0, 30).toLowerCase() === p.Objeto.substring(0, 30).toLowerCase());

                // Match Terciário: Autor
                const authorMatch = local.autor && p.AutorEmenda && 
                                   p.AutorEmenda.toLowerCase().includes(local.autor.split(' ')[0].toLowerCase());

                return numberMatch && (objectMatch || authorMatch);
            });

            if (portalMatch) {
                const now = new Date().toISOString();
                const record: FinancialRecord = {
                    amendmentId: local.id,
                    reservado: parsePortalCurrency(portalMatch.Reservado),
                    empenhado: parsePortalCurrency(portalMatch.Empenhado),
                    liquidado: parsePortalCurrency(portalMatch.Liquidado),
                    pago: parsePortalCurrency(portalMatch.ValorPago),
                    updatedAt: now
                };
                financialMap.set(local.id, record);
                matchedCount++;
            }
        }

        console.log(`[3/3] Sincronização concluída: ${matchedCount} emendas atualizadas.`);

        fs.writeFileSync(financialPath, JSON.stringify(Array.from(financialMap.values()), null, 2));
        console.log(`\n✓ Arquivo data/financial.json atualizado com sucesso!`);
    });
}

main();
