export interface Amendment {
    id: string;
    createdAt: string;

    // Identificação
    municipio: string;
    cnpj: string;
    responsavelNome: string;
    responsavelCargo: string;
    loa2026Check: string;

    // Dados da Emenda
    ambito: string;
    tipoEmenda: string;
    tipoEmendaOutro?: string;
    categoria: string; // Nova categorização: Saúde, Educação, etc.
    fundamentoLegal: string;
    autor: string; // Parlamentar
    numeroEmenda: string;
    objeto: string; // Used as title in some views
    finalidade: string;

    // Detalhamento
    funcao: string;
    subfuncao: string;
    destinacao: string;
    orgaoBeneficiario: string;
    localidadeBeneficiada: string;
    instrumentoJuridico: string;
    possuiCronograma: string;
    fornecedor?: string;
    numeroLicitacao?: string;

    // Financeiro
    prazoAplicacao: string;
    valor: string;
    valorAutorizado: string;
    percentualRcl: string;
    contaEspecifica: string;
    numeroConta?: string;
    reservado?: string;
    empenhado?: string;
    liquidado?: string;
    pago?: string;
    codigoAplicacao?: string;
    codigoAplicacaoVariavel?: string;
    dataCredito?: string;      // Data em que o recurso entrou (creditado)
    valorCreditado?: string;   // Valor que foi creditado
    vinculo?: string;          // Código numérico do vínculo no portal SMARAPD (ex: "08.804.0061")
    naturezaDespesa?: string;  // Natureza da Despesa do portal SMARAPD (ex: "3.3.90.30.00 - MATERIAL DE CONSUMO")
    classificacaoFuncional?: string; // Classificação Funcional do portal SMARAPD (ex: "08.245.0018.2.016")
    numeroEmpenho?: string;    // Número do Empenho do portal SMARAPD (ex: "12456")
    anoEmpenho?: string;       // Ano do Empenho do portal SMARAPD (ex: "2026")
    banco?: string;            // Nome/Número do Banco de pagamento
    // Event history (populated from financial.json)
    empenhos?: import("@/lib/json-storage").EmpenhoEvent[];
    liquidacoes?: import("@/lib/json-storage").LiquidacaoEvent[];
    pagamentos?: import("@/lib/json-storage").PagamentoEvent[];

    // Transparência
    portalTransparenciaCheck: string;
    divulgacaoTempoReal: string;
    linkPortal: string;
    monitoramentoCheck: string;

    // Legacy/Compat fields (kept for UI compatibility where needed, or mapped)
    latitude?: number;
    longitude?: number;
    status: string;
    priority: string;

    // Optional compatibility fields if we want to display old records without errors
    title?: string;
    address?: string;
    year?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    responsible?: string;
    value?: string;
    author?: string;
    neighborhood?: string;
}

const STORAGE_KEY = "portal_emendas_data";

/**
 * Safely retrieve amendments from localStorage.
 * Handles corrupted JSON, missing data, and returns empty array on error.
 */
export const getAmendments = (): Amendment[] => {
    if (typeof window === "undefined") return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const parsed = JSON.parse(data);

        // Validate it's an array
        if (!Array.isArray(parsed)) {
            console.warn("localStorage data is not an array, clearing");
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }

        // Validate array items have required fields
        const validated = parsed.filter((item) => {
            return (
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "string" &&
                typeof item.createdAt === "string"
            );
        });

        // If we had to filter out invalid items, save the cleaned data
        if (validated.length < parsed.length) {
            console.warn(
                `Removed ${parsed.length - validated.length} corrupted amendments from localStorage`
            );
            if (validated.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }

        return validated as Amendment[];
    } catch (error) {
        console.error("Error parsing amendments from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
};

export const addAmendment = (amendment: Omit<Amendment, "id" | "createdAt">) => {
    const amendments = getAmendments();
    const newAmendment: Amendment = {
        ...amendment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newAmendment, ...amendments]));
    return newAmendment;
};

export const clearAmendments = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const deleteAmendment = (id: string) => {
    if (typeof window === "undefined") return;
    const amendments = getAmendments();
    const updated = amendments.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
