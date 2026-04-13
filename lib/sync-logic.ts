import { readJsonFile, writeJsonFile, FINANCIAL_FILE, AMENDMENTS_FILE, FinancialRecord } from "./json-storage";
import { parseCurrency } from "./amendments-utils";

const OSASCO_API_URL = 'https://transparencia-osasco.smarapd.com.br/paiportalserver/modulovisao/filter';

const MONTHS_PT = [
    'JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

function getCurrentExerciseAndPeriod(): { exercise: number; period: string } {
    const now = new Date();
    return {
        exercise: now.getFullYear(),
        period: MONTHS_PT[now.getMonth()],
    };
}

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
    ValorPago: string;
}

function parsePortalCurrency(val: string): string {
    const num = parseCurrency(val);
    if (!num) return "0,00";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function extractBaseNumber(str: string): string | null {
    if (!str) return null;
    const match = str.match(/(\d+)/);
    return match ? match[1].padStart(3, '0') : null;
}

export async function runFinancialSync() {
    const { exercise, period } = getCurrentExerciseAndPeriod();
    console.log(`[Sync] Buscando dados do portal: Exercício=${exercise}, Período=${period}`);

    const payload = {
        "ChaveModulo": "66",
        "NomeVisao": "EmendasParlamentares",
        "Filtros": [
            { "Coluna": "DescVinculo", "Operador": "contem", "Valor": "08.804" }
        ],
        "Periodicidade": "MENSAL",
        "Periodo": period,
        "Exercicio": exercise,
        "Pagina": 1,
        "QuantidadeRegistros": "300", 
        "Ordenacao": [{ "ColunaOrdem": "ID", "TipoOrdem": "ascend", "Ordem": 1 }]
    };

    const response = await fetch(OSASCO_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://transparencia-osasco.smarapd.com.br',
            'Referer': 'https://transparencia-osasco.smarapd.com.br/'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    let portalData = await response.json();
    
    // O portal SMARAPD às vezes retorna o JSON como uma string dentro do JSON principal
    if (typeof portalData === 'string') {
        portalData = JSON.parse(portalData);
    }

    const portalRecords = portalData.Valores as PortalRecord[];

    const localAmendments = await readJsonFile<any>(AMENDMENTS_FILE);
    const existingFinancial = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

    const financialMap = new Map<string, FinancialRecord>();
    existingFinancial.forEach(r => financialMap.set(r.amendmentId, r));

    let matchedCount = 0;
    for (const local of localAmendments) {
        const localBase = extractBaseNumber(local.numeroEmenda);
        
        const portalMatch = portalRecords.find(p => {
            const portalBase = extractBaseNumber(p.DescVinculo);
            const numberMatch = localBase && portalBase && localBase === portalBase;
            const objectMatch = local.objeto && p.Objeto && 
                               (local.objeto.substring(0, 30).toLowerCase() === p.Objeto.substring(0, 30).toLowerCase());
            const authorMatch = local.autor && p.AutorEmenda && 
                               p.AutorEmenda.toLowerCase().includes(local.autor.split(' ')[0].toLowerCase());

            return numberMatch && (objectMatch || authorMatch);
        });

        if (portalMatch) {
            financialMap.set(local.id, {
                amendmentId: local.id,
                reservado: parsePortalCurrency(portalMatch.Reservado),
                empenhado: parsePortalCurrency(portalMatch.Empenhado),
                liquidado: parsePortalCurrency(portalMatch.Liquidado),
                pago: parsePortalCurrency(portalMatch.ValorPago),
                updatedAt: new Date().toISOString()
            });
            matchedCount++;
        }
    }

    await writeJsonFile(FINANCIAL_FILE, Array.from(financialMap.values()));
    
    // Salvar meta-informação da última sincronização
    await writeJsonFile("sync_info.json", [{ lastSync: new Date().toISOString() }]);
    
    return matchedCount;
}
