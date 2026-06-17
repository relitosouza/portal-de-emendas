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
    ClassificacaoFuncional: string;
    AutorEmenda: string;
    Objeto: string;
    Empenhado: number;
    EmpenhadoAnulado: number;
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
 * Compara se o vínculo local e do portal são equivalentes.
 * Realiza comparação exata após normalização dos códigos de vínculo.
 */
function matchVinculo(localVinculo: string, portalVinculo: string): boolean {
    return normalizeVinculo(localVinculo) === normalizeVinculo(portalVinculo);
}

/**
 * Agrupa registros do portal pelo campo Vinculo + ClassificacaoFuncional.
 * Considera e deduz os empenhos e liquidações anulados.
 */
function aggregateByVinculo(records: PortalRecord[]): AggregatedPortalRecord[] {
    const map = new Map<string, AggregatedPortalRecord>();

    for (const r of records) {
        const vinculo = r.Vinculo?.trim() || '';
        const cf = r.ClassificacaoFuncional?.trim() || '';
        if (!vinculo) continue;

        const key = `${vinculo}_${cf}`;
        const existing = map.get(key);
        
        const empenhado = parseCurrency(r.Empenhado);
        const liquidado = parseCurrency(r.Liquidado);
        const anuladoVal = Math.abs(parseAnulacao(r.EmpenhadoAnulado));
        const pago = parseCurrency(r.ValorPago);
        const reservado = parseCurrency(r.Reservado);
        const saldo = parseCurrency(r.SaldoAtual);

        if (existing) {
            existing.Empenhado += empenhado;
            existing.EmpenhadoAnulado += anuladoVal;
            existing.Liquidado += liquidado;
            existing.ValorPago += pago;
            existing.Reservado += reservado;
            existing.SaldoAtual += saldo;
        } else {
            map.set(key, {
                Vinculo: vinculo,
                ClassificacaoFuncional: cf,
                AutorEmenda: r.AutorEmenda || '',
                Objeto: r.Objeto || '',
                Empenhado: empenhado,
                EmpenhadoAnulado: anuladoVal,
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
 * Tenta fazer o match entre uma emenda local e todos os registros correspondentes do portal.
 * Retorna todos os sub-vínculos (com diferentes classificações funcionais) que casarem.
 */
function findPortalMatches(
    local: Record<string, string>,
    aggregated: AggregatedPortalRecord[]
): AggregatedPortalRecord[] {

    // 1. Match pelo campo numeroConta ou codigoAplicacao (código de vínculo exato)
    const localVinculoCodes = [
        local.numeroConta,
        local.codigoAplicacao,
        local.codigoAplicacaoVariavel,
    ].filter(Boolean).map(normalizeVinculo);

    if (localVinculoCodes.length > 0) {
        const matches = aggregated.filter(p =>
            localVinculoCodes.includes(normalizeVinculo(p.Vinculo))
        );
        if (matches.length > 0) return matches;
    }

    // 2. Últimos 4 dígitos do número da emenda vs últimos 4 dígitos do vínculo + Autor compatível
    const numEmenda = local.numeroEmenda?.replace(/\D/g, '') || '';
    if (numEmenda.length >= 4) {
        const lastFour = numEmenda.slice(-4);
        const matches = aggregated.filter(p => {
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
        if (matches.length > 0) return matches;
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

    return aggregated.filter(p => authorMatch(p) && objectMatch(p));
}

/**
 * Filtra empenhos históricos cujo valor somado corresponde ao total anulado.
 * Evita exibir empenhos que foram cancelados.
 */
function filterCancelledEmpenhos(movimentos: any[], annulledVal: number): any[] {
    if (annulledVal <= 0 || movimentos.length === 0) return movimentos;

    const items = movimentos.map(m => ({
        mov: m,
        val: parseCurrency(m.VlrEmpenho)
    }));

    const tolerance = 0.01;
    const n = items.length;
    let foundSubset: number[] = [];

    function search(index: number, currentSum: number, currentSubset: number[]): boolean {
        if (Math.abs(currentSum - annulledVal) < tolerance) {
            foundSubset = [...currentSubset];
            return true;
        }
        if (index >= n || currentSum > annulledVal + tolerance) {
            return false;
        }

        if (search(index + 1, currentSum + items[index].val, [...currentSubset, index])) {
            return true;
        }
        if (search(index + 1, currentSum, currentSubset)) {
            return true;
        }
        return false;
    }

    items.sort((a, b) => b.val - a.val);

    if (search(0, 0, [])) {
        const excludedIndices = new Set(foundSubset);
        const activeItems = items.filter((_, idx) => !excludedIndices.has(idx));
        return activeItems.map(item => item.mov);
    }

    return movimentos;
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

    // Agrupa pelo Vinculo + ClassificacaoFuncional, somando valores financeiros
    const aggregated = aggregateByVinculo(portalRecords);
    console.log(`[Sync] ${aggregated.length} sub-vínculos únicos (Vínculo + CF) após agregação.`);

    const mainAmendments = await readJsonFile<any>(AMENDMENTS_FILE);
    const externalAmendments = await readJsonFile<any>("emendas-externas.json");
    const existingFinancial = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

    // Determina os prefixos únicos de vínculos para buscar empenhos
    const prefixes = new Set<string>();
    prefixes.add("05.8");
    prefixes.add("08.8");
    prefixes.add("02.8");
    
    const allAmendmentsForPrefixes = [...mainAmendments, ...externalAmendments];
    for (const a of allAmendmentsForPrefixes) {
        if (a.vinculo) {
            const parts = a.vinculo.split('.');
            if (parts.length >= 2) prefixes.add(`${parts[0]}.${parts[1].substring(0, 1)}`);
        }
    }
    for (const r of existingFinancial) {
        if (r.vinculo) {
            const parts = r.vinculo.split('.');
            if (parts.length >= 2) prefixes.add(`${parts[0]}.${parts[1].substring(0, 1)}`);
        }
    }
    for (const r of aggregated) {
        if (r.Vinculo) {
            const parts = r.Vinculo.split('.');
            if (parts.length >= 2) prefixes.add(`${parts[0]}.${parts[1].substring(0, 1)}`);
        }
    }

    // Busca movimentos de empenho no portal para todos os prefixos de vínculo identificados
    const allMovimentos: any[] = [];
    for (const prefix of Array.from(prefixes)) {
        console.log(`[Sync] Buscando movimentos de empenho para prefixo: ${prefix}`);
        try {
            const payload = {
                "ChaveModulo": "aquisicoes_covid",
                "NomeVisao": "MovimentoEmpenho",
                "Filtros": [
                    { "Campo": "Vinculo", "Valor": prefix, "TipoValor": 8 }
                ],
                "Periodicidade": "ANUAL",
                "Periodo": "",
                "Exercicio": exercise,
                "Pagina": 1,
                "QuantidadeRegistros": "1000",
                "Ordenacao": [{ "ColunaOrdem": "DescrFornecedor", "TipoOrdem": "ascend", "Ordem": 1 }]
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

            if (response.ok) {
                let data = await response.json() as any;
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                if (data && data.Valores) {
                    allMovimentos.push(...data.Valores);
                }
            }
        } catch (error) {
            console.error(`[Sync] Erro ao buscar movimentos de empenho para prefixo ${prefix}:`, error);
        }
    }
    console.log(`[Sync] ${allMovimentos.length} movimentos de empenho obtidos para cruzamento.`);

    // Mantenha cópias para atualizar/inserir novos clones desmembrados
    const updatedMain = [...mainAmendments];
    const updatedExternal = [...externalAmendments];

    const localAmendments = [
        ...mainAmendments.map((a: any) => ({ ...a, originFile: AMENDMENTS_FILE })),
        ...externalAmendments.map((a: any) => ({ ...a, originFile: "emendas-externas.json" }))
    ];

    const financialMap = new Map<string, FinancialRecord>();
    existingFinancial.forEach(r => financialMap.set(r.amendmentId, r));

    let matchedCount = 0;
    const allAmendmentIds = new Set(localAmendments.map((a: any) => a.id));

    for (const local of localAmendments) {
        // Ignora emendas desmembradas clonadas em execuções anteriores, pois as originais
        // serão as responsáveis por gerenciar/recriar as ramificações de classificação funcional.
        if (local.id.includes("_cf_")) {
            continue;
        }

        const portalMatches = findPortalMatches(local, aggregated);

        if (portalMatches.length > 0) {
            // 1. O primeiro match atualiza a emenda original
            const firstMatch = portalMatches[0];
            
            // Busca os empenhos equivalentes para extrair números, anos e fornecedores
            const activeVinculo = firstMatch.Vinculo || local.vinculo;
            let matchedMovimentos: any[] = [];
            if (activeVinculo && firstMatch.Empenhado > 0) {
                const rawMovs = allMovimentos.filter(m => m.Vinculo && matchVinculo(activeVinculo, m.Vinculo));
                matchedMovimentos = filterCancelledEmpenhos(rawMovs, firstMatch.EmpenhadoAnulado);
            }
            const formatted = matchedMovimentos.map(m => {
                const nr = m.NrEmpenho || '';
                const exerc = m.ExercEmpenho || '';
                const prov = m.DescrFornecedor?.trim() || '';
                return `${nr}/${exerc}${prov ? ` - ${prov}` : ''}`;
            });
            const nrEmpenhos = Array.from(new Set(formatted)).join('; ');

            financialMap.set(local.id, {
                amendmentId: local.id,
                reservado: parsePortalCurrency(String(firstMatch.Reservado)),
                empenhado: parsePortalCurrency(String(firstMatch.Empenhado)),
                liquidado: parsePortalCurrency(String(firstMatch.Liquidado)),
                pago: parsePortalCurrency(String(firstMatch.ValorPago)),
                vinculo: firstMatch.Vinculo,
                naturezaDespesa: firstMatch.NaturezaDespesa && firstMatch.DescricaoNaturezaDespesa
                    ? `${firstMatch.NaturezaDespesa.trim()} - ${firstMatch.DescricaoNaturezaDespesa.trim()}`
                    : firstMatch.NaturezaDespesa?.trim(),
                classificacaoFuncional: firstMatch.ClassificacaoFuncional,
                numeroEmpenho: nrEmpenhos || undefined,
                anoEmpenho: undefined,
                updatedAt: new Date().toISOString()
            });
            matchedCount++;
            console.log(`[Sync] ✓ Match (Original): "${local.autor}" / "${local.objeto?.substring(0, 35)}" → CF ${firstMatch.ClassificacaoFuncional} | Empenhos: ${nrEmpenhos || 'nenhum'}`);

            // 2. Matches subsequentes geram emendas clonadas (desmembradas) por classificação funcional
            for (let i = 1; i < portalMatches.length; i++) {
                const match = portalMatches[i];
                const cleanCf = match.ClassificacaoFuncional.replace(/\D/g, '');
                const cloneId = `${local.id}_cf_${cleanCf}`;

                // Busca empenhos para o clone desmembrado
                const activeCloneVinculo = match.Vinculo || local.vinculo;
                let matchedCloneMovimentos: any[] = [];
                if (activeCloneVinculo && match.Empenhado > 0) {
                    const rawMovs = allMovimentos.filter(m => m.Vinculo && matchVinculo(activeCloneVinculo, m.Vinculo));
                    matchedCloneMovimentos = filterCancelledEmpenhos(rawMovs, match.EmpenhadoAnulado);
                }
                const formattedClone = matchedCloneMovimentos.map(m => {
                    const nr = m.NrEmpenho || '';
                    const exerc = m.ExercEmpenho || '';
                    const prov = m.DescrFornecedor?.trim() || '';
                    return `${nr}/${exerc}${prov ? ` - ${prov}` : ''}`;
                });
                const nrCloneEmpenhos = Array.from(new Set(formattedClone)).join('; ');

                if (!allAmendmentIds.has(cloneId)) {
                    console.log(`[Sync] + Desmembrando emenda (Criando Clone por CF): "${local.autor}" -> ID: ${cloneId}`);
                    const clone = {
                        ...local,
                        id: cloneId,
                        classificacaoFuncional: match.ClassificacaoFuncional,
                        objeto: `${local.objeto} (CF ${match.ClassificacaoFuncional.trim()})`
                    };
                    delete (clone as any).originFile;

                    if (local.originFile === AMENDMENTS_FILE) {
                        updatedMain.push(clone);
                    } else {
                        updatedExternal.push(clone);
                    }
                    allAmendmentIds.add(cloneId);
                }

                financialMap.set(cloneId, {
                    amendmentId: cloneId,
                    reservado: parsePortalCurrency(String(match.Reservado)),
                    empenhado: parsePortalCurrency(String(match.Empenhado)),
                    liquidado: parsePortalCurrency(String(match.Liquidado)),
                    pago: parsePortalCurrency(String(match.ValorPago)),
                    vinculo: match.Vinculo,
                    naturezaDespesa: match.NaturezaDespesa && match.DescricaoNaturezaDespesa
                        ? `${match.NaturezaDespesa.trim()} - ${match.DescricaoNaturezaDespesa.trim()}`
                        : match.NaturezaDespesa?.trim(),
                    classificacaoFuncional: match.ClassificacaoFuncional,
                    numeroEmpenho: nrCloneEmpenhos || undefined,
                    anoEmpenho: undefined,
                    updatedAt: new Date().toISOString()
                });
                matchedCount++;
            }
        } else {
            // Se tinha vínculo associado anteriormente, mas agora não tem match válido, limpa
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
                    classificacaoFuncional: "",
                    updatedAt: new Date().toISOString()
                });
            }
        }
    }

    // Salvar as emendas e os dados financeiros
    await writeJsonFile(AMENDMENTS_FILE, updatedMain);
    await writeJsonFile("emendas-externas.json", updatedExternal);
    await writeJsonFile(FINANCIAL_FILE, Array.from(financialMap.values()));
    await writeJsonFile("sync_info.json", [{ lastSync: new Date().toISOString() }]);

    console.log(`[Sync] Concluído: ${matchedCount} emendas atualizadas/criadas.`);
    return matchedCount;
}
