import { parseCurrency } from "@/lib/amendments-utils";

export function getNormalizedStatus(rawStatus: string | null | undefined): string {
    const s = String(rawStatus || "").toLowerCase().trim();

    if (s.includes("prestação de contas") || s.includes("prestacao de contas") || s.includes("prestação") || s.includes("prestacao")) return "Prestação de Contas";
    if (s.includes("executada") || s.includes("concluido") || s.includes("pago")) return "Executada";
    if (s.includes("execução") || s.includes("execucao") || s.includes("andamento")) return "Execução";
    if (s.includes("contratação") || s.includes("contratacao") || s.includes("aprovado")) return "Contratação";
    if (s.includes("viabilização") || s.includes("viabilizacao")) return "Viabilização";
    if (s.includes("elaboração") || s.includes("elaboracao")) return "Elaboração";
    if (s.includes("análise") || s.includes("analise") || s.includes("pendente")) return "Em Análise";
    if (s.includes("cancelada") || s.includes("cancelado") || s.includes("suspenso")) return "Cancelada";

    // Default fallback
    return "Não Iniciada";
}

export function getEffectiveStatus(
    rawStatus: string | null | undefined,
    financial?: {
        empenhado?: string | number | null;
        liquidado?: string | number | null;
        pago?: string | number | null;
        dataCredito?: string | null;
    }
): string {
    const normalized = getNormalizedStatus(rawStatus);
    const step = getStatusStep(normalized);

    if (financial?.dataCredito && step <= 1) {
        return `Creditado em ${financial.dataCredito}`;
    }

    if (financial && parseCurrency(financial.empenhado ?? undefined) > 0) {
        const step = getStatusStep(normalized);
        if (step < 4) return "Contratação";
    }

    return normalized;
}

export function getStatusStep(status: string): number {
    if (status.startsWith("Creditado")) return 0;

    switch (status) {
        case "Não Iniciada": return 1;
        case "Em Análise": return 2;
        case "Elaboração": return 3;
        case "Viabilização": return 4;
        case "Contratação": return 5;
        case "Execução": return 6;
        case "Executada": return 7;
        case "Prestação de Contas": return 8;
        case "Cancelada": return 9;
        default: return 1;
    }
}
