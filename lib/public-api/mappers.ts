import type { Amendment } from "../store.ts";
import type {
    CreditedRevenue,
    EmpenhoEvent,
    FinancialRecord,
    LiquidacaoEvent,
    PagamentoEvent,
} from "../json-storage.ts";
import { parseCurrency } from "../amendments-utils.ts";
import {
    publicAmendmentSchema,
    publicFinancialSchema,
    publicRevenueSchema,
    type PublicAmendment,
    type PublicFinancial,
    type PublicRevenue,
} from "./schemas.ts";

function text(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized || null;
}

export function toIsoDate(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const trimmed = value.trim();
    const brDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    const normalized = brDate
        ? `${brDate[3]}-${brDate[2]}-${brDate[1]}T00:00:00.000Z`
        : trimmed;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function amendmentYear(amendment: Amendment): number | null {
    const candidates = [amendment.year, amendment.numeroEmenda, amendment.createdAt];
    for (const candidate of candidates) {
        const match = typeof candidate === "string" ? /(19|20|21)\d{2}/.exec(candidate) : null;
        if (match) return Number(match[0]);
    }
    return null;
}

export function mapPublicAmendment(amendment: Amendment): PublicAmendment {
    return publicAmendmentSchema.parse({
        id: String(amendment.id),
        numero: text(amendment.numeroEmenda),
        ano: amendmentYear(amendment),
        municipio: text(amendment.municipio),
        ambito: text(amendment.ambito),
        tipo: text(amendment.tipoEmenda),
        autor: text(amendment.autor || amendment.author),
        objeto: text(amendment.objeto || amendment.title),
        finalidade: text(amendment.finalidade || amendment.description),
        categoria: text(amendment.categoria),
        funcao: text(amendment.funcao),
        subfuncao: text(amendment.subfuncao),
        orgaoBeneficiario: text(amendment.orgaoBeneficiario),
        localidadeBeneficiada: text(amendment.localidadeBeneficiada || amendment.neighborhood),
        valor: parseCurrency(amendment.valor || amendment.value),
        valorAutorizado: parseCurrency(amendment.valorAutorizado),
        execucao: {
            reservado: parseCurrency(amendment.reservado),
            empenhado: parseCurrency(amendment.empenhado),
            liquidado: parseCurrency(amendment.liquidado),
            pago: parseCurrency(amendment.pago),
        },
        status: text(amendment.status),
        atualizadoEm: toIsoDate(amendment.createdAt),
    });
}

function mapBaseEvent(event: LiquidacaoEvent | PagamentoEvent) {
    return {
        id: String(event.id),
        data: toIsoDate(event.data),
        valor: parseCurrency(event.valor),
        descricao: text(event.descricao),
    };
}

function mapEmpenho(event: EmpenhoEvent) {
    return {
        ...mapBaseEvent(event),
        numero: text(event.numero),
        credor: text(event.credor),
        processo: text(event.processo),
    };
}

export function mapPublicFinancial(record: FinancialRecord): PublicFinancial {
    return publicFinancialSchema.parse({
        amendmentId: String(record.amendmentId),
        totais: {
            reservado: parseCurrency(record.reservado),
            empenhado: parseCurrency(record.empenhado),
            liquidado: parseCurrency(record.liquidado),
            pago: parseCurrency(record.pago),
        },
        empenhos: (record.empenhos ?? []).map(mapEmpenho),
        liquidacoes: (record.liquidacoes ?? []).map(mapBaseEvent),
        pagamentos: (record.pagamentos ?? []).map(mapBaseEvent),
        atualizadoEm: toIsoDate(record.updatedAt),
    });
}

export function emptyPublicFinancial(amendmentId: string): PublicFinancial {
    return publicFinancialSchema.parse({
        amendmentId,
        totais: { reservado: 0, empenhado: 0, liquidado: 0, pago: 0 },
        empenhos: [],
        liquidacoes: [],
        pagamentos: [],
        atualizadoEm: null,
    });
}

export function mapPublicRevenue(revenue: CreditedRevenue): PublicRevenue {
    return publicRevenueSchema.parse({
        id: String(revenue.id),
        exercicio: revenue.exercise,
        numeroEmenda: text(revenue.amendmentNumber),
        autor: text(revenue.author),
        historico: text(revenue.history),
        dataCredito: toIsoDate(revenue.creditDate),
        valorCreditado: parseCurrency(revenue.creditedValue),
        operacao: text(revenue.operation),
        vinculo: text(revenue.vinculo),
        naturezaReceita: text(revenue.revenueNature),
        descricaoReceita: text(revenue.revenueDescription),
        ambito: text(revenue.scope),
        fonte: text(revenue.sourceUrl),
        atualizadoEm: toIsoDate(revenue.updatedAt),
    });
}

