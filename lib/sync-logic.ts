import { readJsonFile, writeJsonFile, FINANCIAL_FILE, AMENDMENTS_FILE, FinancialRecord } from "./json-storage";
import { parseCurrency } from "./amendments-utils";
import fs from "fs/promises";
import path from "path";

const OSASCO_API_URL = 'https://transparencia-osasco.smarapd.com.br/paiportalserver/modulovisao/filter';
const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Escreve diretamente no arquivo JSON local (fallback quando Redis não está disponível).
 * Garante que a sincronização funcione localmente sem Redis ativo.
 */
async function writeJsonFileDirect<T>(filename: string, data: T[]): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}


interface PortalRecord {
    ID: string;
    Exercicio: number;
    Vinculo: string;        // Código numérico: ex. "05.800.0005"
    DescVinculo: string;    // Descrição textual do vínculo
    Emenda: string;
    AnoEmenda: number;
    AutorEmenda: string;
    Justificativa: string;
    Objeto: string;
    TxtJuridico: string;
    SaldoAtual: string;
    OrcamentariasSuplementacao: string;
    Reservado: string;
    AReservar: string;
    Empenhado: string;
    EmpenhadoAnulado: string;
    AEmpenhar: string;
    Liquidado: string;
    LiquidadoAnulado: string;
    ValorPago: string;
    APagar: string;
    DescricaoOrcamentaria: string;
    ClassificacaoFuncional: string;
    DescFuncional: string;
    NaturezaDespesa?: string;
    DescricaoNaturezaDespesa?: string;
}

interface AggregatedPortalRecord {
    Vinculo: string;
    AutorEmenda: string;
    Objeto: string;
    Empenhado: number;
    Liquidado: number;
    ValorPago: number;
    Reservado: number;
    SaldoAtual: number;
    NaturezaDespesa?: string;
    DescricaoNaturezaDespesa?: string;
}

function parsePortalCurrency(val: string): string {
    const num = parseCurrency(val);
    if (!num) return "0,00";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

/**
 * Converte strings de anulação financeiras que podem conter sinal de menos.
 * Retorna valor negativo caso comece com "-".
 */
function parseAnulacao(val?: string | number): number {
    if (!val && val !== 0) return 0;
    if (typeof val === "number") return val;
    
    let str = String(val).trim();
    str = str.replace(/[R$\s]/g, "");
    if (!str) return 0;
    
    const isNegative = str.startsWith("-");
    if (isNegative) {
        str = str.substring(1);
    }
    
    if (str.includes(",") && str.includes(".")) {
        const lastCommaIdx = str.lastIndexOf(",");
        const lastDotIdx = str.lastIndexOf(".");
        if (lastCommaIdx > lastDotIdx) {
            str = str.replace(/\./g, "").replace(",", ".");
        } else {
            str = str.replace(/,/g, "");
        }
    } else if (str.includes(",")) {
        str = str.replace(",", ".");
    }
    
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    return isNegative ? -num : num;
}

/**
 * Extrai o número base de uma emenda local (ex: "202541300010" → "202541300010")
 * ou de um código de vínculo do portal (ex: "05.800.0005" → apenas os dígitos: "058000005")
 * Usamos o campo Vinculo diretamente para matching.
 */
function normalizeVinculo(str: string): string {
    if (!str) return '';
    // Remove pontos e espaços, mantém dígitos
    return str.replace(/[\.\s]/g, '').toLowerCase().trim();
}

/**
 * Agrupa registros do portal pelo campo Vinculo, somando os valores financeiros.
 * Considera e deduz os empenhos e liquidações anulados.
 */
function aggregateByVinculo(records: PortalRecord[]): AggregatedPortalRecord[] {
    const map = new Map<string, AggregatedPortalRecord>();

    for (const r of records) {
        const vinculo = r.Vinculo?.trim() || '';
        if (!vinculo) continue;

        const existing = map.get(vinculo);
        
        // Empenho Líquido (Empenhado - Empenhado Anulado)
        const empenhadoOriginal = parseCurrency(r.Empenhado);
        const empenhadoAnulado = parseAnulacao(r.EmpenhadoAnulado);
        let empenhado = empenhadoOriginal;
        if (empenhadoAnulado < 0) {
            empenhado += empenhadoAnulado;
        } else {
            empenhado -= empenhadoAnulado;
        }
        empenhado = Math.max(0, empenhado);

        // Liquidação Líquida (Liquidado - Liquidado Anulado)
        const liquidadoOriginal = parseCurrency(r.Liquidado);
        const liquidadoAnulado = parseAnulacao(r.LiquidadoAnulado);
        let liquidado = liquidadoOriginal;
        if (liquidadoAnulado < 0) {
            liquidado += liquidadoAnulado;
        } else {
            liquidado -= liquidadoAnulado;
        }
        liquidado = Math.max(0, liquidado);

        const pago = parseCurrency(r.ValorPago);
        const reservado = parseCurrency(r.Reservado);
        const saldo = parseCurrency(r.SaldoAtual);

        if (existing) {
            existing.Empenhado += empenhado;
            existing.Liquidado += liquidado;
            existing.ValorPago += pago;
            existing.Reservado += reservado;
            existing.SaldoAtual += saldo;
        } else {
            map.set(vinculo, {
                Vinculo: vinculo,
                AutorEmenda: r.AutorEmenda || '',
                Objeto: r.Objeto || '',
                Empenhado: empenhado,
                Liquidado: liquidado,
                ValorPago: pago,
                Reservado: reservado,
                SaldoAtual: saldo,
                NaturezaDespesa: r.NaturezaDespesa,
                DescricaoNaturezaDespesa: r.DescricaoNaturezaDespesa,
            });
        }
    }

    return Array.from(map.values());
}

/**
 * Tenta fazer o match entre uma emenda local e os registros agregados do portal.
 *
 * Estratégia de matching (em ordem de prioridade):
 * 1. Vínculo numérico exato: o campo `numeroConta` ou `codigoAplicacao` da emenda local
 *    corresponde ao `Vinculo` do portal (ex: "05.800.0005").
 * 2. Número da emenda contido no vínculo: "202541300010" em "05.800.0010".
 * 3. Correspondência por autor + objeto (fallback).
 */
function findPortalMatch(
    local: Record<string, string>,
    aggregated: AggregatedPortalRecord[]
): AggregatedPortalRecord | undefined {

    // 1. Match pelo campo numeroConta ou codigoAplicacao (código de vínculo exato)
    const localVinculoCodes = [
        local.numeroConta,
        local.codigoAplicacao,
        local.codigoAplicacaoVariavel,
    ].filter(Boolean).map(normalizeVinculo);

    if (localVinculoCodes.length > 0) {
        const exactMatch = aggregated.find(p =>
            localVinculoCodes.includes(normalizeVinculo(p.Vinculo))
        );
        if (exactMatch) return exactMatch;
    }

    // 2. Últimos 4 dígitos do número da emenda vs últimos 4 dígitos do vínculo + Autor compatível
    const numEmenda = local.numeroEmenda?.replace(/\D/g, '') || '';
    if (numEmenda.length >= 4) {
        const lastFour = numEmenda.slice(-4);
        const vinculoMatch = aggregated.find(p => {
            const pVinculoDigits = normalizeVinculo(p.Vinculo);
            // Código de vínculo termina com o sufixo da emenda: "05.800.0010" → "0010"
            const digitsMatch = pVinculoDigits.endsWith(lastFour);
            if (digitsMatch) {
                if (!local.autor || !p.AutorEmenda) return true; // Sem dados de autor para refutar, aceita
                const localFirst = local.autor.split(' ')[0].toLowerCase();
                return p.AutorEmenda.toLowerCase().includes(localFirst);
            }
            return false;
        });
        if (vinculoMatch) return vinculoMatch;
    }

    // 3. Fallback: autor + primeiros 30 chars do objeto
    const authorMatch = (p: AggregatedPortalRecord) => {
        if (!local.autor || !p.AutorEmenda) return false;
        const localFirst = local.autor.split(' ')[0].toLowerCase();
        return p.AutorEmenda.toLowerCase().includes(localFirst);
    };
    const objectMatch = (p: AggregatedPortalRecord) => {
        if (!local.objeto || !p.Objeto) return false;
        return local.objeto.substring(0, 30).toLowerCase() === p.Objeto.substring(0, 30).toLowerCase();
    };

    return aggregated.find(p => authorMatch(p) && objectMatch(p));
}

export async function runFinancialSync() {
    const exercise = new Date().getFullYear();
    console.log(`[Sync] Buscando dados do portal ANUAL: Exercício=${exercise}`);

    // Periodicidade ANUAL — igual ao relatório em:
    // https://transparencia-osasco.smarapd.com.br/#/dinamico/66/EmendasParlamentares?periodicidade=ANUAL&exercicio=2026
    const payload = {
        "ChaveModulo": "66",
        "NomeVisao": "EmendasParlamentares",
        "Filtros": [],
        "Periodicidade": "ANUAL",
        "Periodo": "",
        "Exercicio": exercise,
        "Pagina": 1,
        "QuantidadeRegistros": "1000",
        "Ordenacao": [{ "ColunaOrdem": "Objeto", "TipoOrdem": "ascend", "Ordem": 1 }]
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
    console.log(`[Sync] ${portalRecords.length} registros recebidos do portal.`);

    // Agrupa pelo Vinculo (código numérico), somando valores financeiros
    const aggregated = aggregateByVinculo(portalRecords);
    console.log(`[Sync] ${aggregated.length} vínculos únicos após agregação.`);

    const localAmendments = [
        ...await readJsonFile<Record<string, string>>(AMENDMENTS_FILE),
        ...await readJsonFile<Record<string, string>>("emendas-externas.json"),
    ];
    const existingFinancial = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

    const financialMap = new Map<string, FinancialRecord>();
    existingFinancial.forEach(r => financialMap.set(r.amendmentId, r));

    let matchedCount = 0;
    for (const local of localAmendments) {
        const portalMatch = findPortalMatch(local, aggregated);

        if (portalMatch) {
            financialMap.set(local.id, {
                amendmentId: local.id,
                reservado: parsePortalCurrency(String(portalMatch.Reservado)),
                empenhado: parsePortalCurrency(String(portalMatch.Empenhado)),
                liquidado: parsePortalCurrency(String(portalMatch.Liquidado)),
                pago: parsePortalCurrency(String(portalMatch.ValorPago)),
                vinculo: portalMatch.Vinculo,   // código numérico ex: "08.804.0061"
                naturezaDespesa: portalMatch.NaturezaDespesa && portalMatch.DescricaoNaturezaDespesa
                    ? `${portalMatch.NaturezaDespesa.trim()} - ${portalMatch.DescricaoNaturezaDespesa.trim()}`
                    : portalMatch.NaturezaDespesa?.trim(),
                updatedAt: new Date().toISOString()
            });
            matchedCount++;
            console.log(`[Sync] ✓ Match: "${local.autor}" / "${local.objeto?.substring(0, 40)}" → Vínculo ${portalMatch.Vinculo}`);
        } else {
            // Se tinha vínculo associado anteriormente, mas agora não tem match válido,
            // limpa os dados financeiros e o vínculo para evitar carregar dados incorretos de outro autor.
            const existing = financialMap.get(local.id);
            if (existing && existing.vinculo) {
                console.log(`[Sync] ✗ Desvinculando (sem match válido): "${local.autor}" / "${local.objeto?.substring(0, 40)}"`);
                financialMap.set(local.id, {
                    amendmentId: local.id,
                    reservado: "0,00",
                    empenhado: "0,00",
                    liquidado: "0,00",
                    pago: "0,00",
                    vinculo: "",
                    naturezaDespesa: "",
                    updatedAt: new Date().toISOString()
                });
            }
        }
    }

    await writeJsonFile(FINANCIAL_FILE, Array.from(financialMap.values()));

    // Salvar meta-informação da última sincronização
    await writeJsonFile("sync_info.json", [{ lastSync: new Date().toISOString() }]);

    console.log(`[Sync] Concluído: ${matchedCount} emendas atualizadas de ${localAmendments.length} locais.`);
    return matchedCount;
}
