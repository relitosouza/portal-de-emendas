import { z } from "zod";

export const publicMoneySchema = z.number().finite().nonnegative();
export const publicNullableTextSchema = z.string().trim().min(1).nullable();

export const publicFinancialTotalsSchema = z.object({
    reservado: publicMoneySchema,
    empenhado: publicMoneySchema,
    liquidado: publicMoneySchema,
    pago: publicMoneySchema,
}).strict();

export const publicAmendmentSchema = z.object({
    id: z.string().min(1),
    numero: publicNullableTextSchema,
    ano: z.number().int().min(1900).max(2200).nullable(),
    municipio: publicNullableTextSchema,
    ambito: publicNullableTextSchema,
    tipo: publicNullableTextSchema,
    autor: publicNullableTextSchema,
    objeto: publicNullableTextSchema,
    finalidade: publicNullableTextSchema,
    categoria: publicNullableTextSchema,
    funcao: publicNullableTextSchema,
    subfuncao: publicNullableTextSchema,
    orgaoBeneficiario: publicNullableTextSchema,
    localidadeBeneficiada: publicNullableTextSchema,
    valor: publicMoneySchema,
    valorAutorizado: publicMoneySchema,
    execucao: publicFinancialTotalsSchema,
    status: publicNullableTextSchema,
    atualizadoEm: z.string().datetime().nullable(),
}).strict();

const publicFinancialEventBaseSchema = z.object({
    id: z.string().min(1),
    data: z.string().datetime().nullable(),
    valor: publicMoneySchema,
    descricao: publicNullableTextSchema,
}).strict();

export const publicFinancialSchema = z.object({
    amendmentId: z.string().min(1),
    totais: publicFinancialTotalsSchema,
    empenhos: z.array(publicFinancialEventBaseSchema.extend({
        numero: publicNullableTextSchema,
        credor: publicNullableTextSchema,
        processo: publicNullableTextSchema,
    }).strict()),
    liquidacoes: z.array(publicFinancialEventBaseSchema),
    pagamentos: z.array(publicFinancialEventBaseSchema),
    atualizadoEm: z.string().datetime().nullable(),
}).strict();

export const publicRevenueSchema = z.object({
    id: z.string().min(1),
    exercicio: z.number().int(),
    numeroEmenda: publicNullableTextSchema,
    autor: publicNullableTextSchema,
    historico: publicNullableTextSchema,
    dataCredito: z.string().datetime().nullable(),
    valorCreditado: publicMoneySchema,
    operacao: publicNullableTextSchema,
    vinculo: publicNullableTextSchema,
    naturezaReceita: publicNullableTextSchema,
    descricaoReceita: publicNullableTextSchema,
    ambito: publicNullableTextSchema,
    fonte: z.string().url().nullable(),
    atualizadoEm: z.string().datetime().nullable(),
}).strict();

export const publicQuerySchema = z.object({
    ano: z.coerce.number().int().min(1900).max(2200).optional(),
    autor: z.string().trim().min(1).max(120).optional(),
    categoria: z.string().trim().min(1).max(120).optional(),
    status: z.string().trim().min(1).max(120).optional(),
    municipio: z.string().trim().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().trim().min(1).max(500).optional(),
}).strict();

export type PublicAmendment = z.infer<typeof publicAmendmentSchema>;
export type PublicFinancial = z.infer<typeof publicFinancialSchema>;
export type PublicRevenue = z.infer<typeof publicRevenueSchema>;
export type PublicQuery = z.infer<typeof publicQuerySchema>;

