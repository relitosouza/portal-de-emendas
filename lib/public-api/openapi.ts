const errorResponse = {
    description: "Erro padronizado",
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
    },
};

const operationalResponses = {
    "400": errorResponse,
    "429": errorResponse,
    "500": errorResponse,
};

export const publicOpenApiDocument = {
    openapi: "3.1.0",
    info: {
        title: "Portal das Emendas — API Pública",
        version: "1.0.0",
        description: "Consulta pública e somente leitura das emendas e de sua execução financeira.",
    },
    servers: [{ url: "/api/public/v1" }],
    tags: [
        { name: "Emendas" },
        { name: "Execução financeira" },
        { name: "Receitas creditadas" },
        { name: "Documentação" },
    ],
    paths: {
        "/emendas": {
            get: {
                tags: ["Emendas"],
                summary: "Lista emendas",
                parameters: [
                    { $ref: "#/components/parameters/Ano" },
                    { $ref: "#/components/parameters/Autor" },
                    { $ref: "#/components/parameters/Categoria" },
                    { $ref: "#/components/parameters/Status" },
                    { $ref: "#/components/parameters/Municipio" },
                    { $ref: "#/components/parameters/Limit" },
                    { $ref: "#/components/parameters/Cursor" },
                ],
                responses: {
                    "200": {
                        description: "Página de emendas",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AmendmentListResponse" } } },
                    },
                    ...operationalResponses,
                },
            },
        },
        "/emendas/{id}": {
            get: {
                tags: ["Emendas"],
                summary: "Consulta uma emenda",
                parameters: [{ $ref: "#/components/parameters/Id" }],
                responses: {
                    "200": {
                        description: "Emenda encontrada",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AmendmentResponse" } } },
                    },
                    "404": errorResponse,
                    ...operationalResponses,
                },
            },
        },
        "/emendas/{id}/execucao-financeira": {
            get: {
                tags: ["Execução financeira"],
                summary: "Consulta a execução financeira de uma emenda",
                parameters: [{ $ref: "#/components/parameters/Id" }],
                responses: {
                    "200": {
                        description: "Execução encontrada, incluindo totais zerados quando ainda não houver movimentação",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/FinancialResponse" } } },
                    },
                    "404": errorResponse,
                    ...operationalResponses,
                },
            },
        },
        "/receitas-creditadas": {
            get: {
                tags: ["Receitas creditadas"],
                summary: "Lista receitas creditadas",
                parameters: [
                    { $ref: "#/components/parameters/Limit" },
                    { $ref: "#/components/parameters/Cursor" },
                ],
                responses: {
                    "200": {
                        description: "Página de receitas",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/RevenueListResponse" } } },
                    },
                    ...operationalResponses,
                },
            },
        },
        "/openapi.json": {
            get: {
                tags: ["Documentação"],
                summary: "Retorna esta especificação OpenAPI",
                responses: {
                    "200": { description: "Documento OpenAPI 3.1" },
                    "429": errorResponse,
                },
            },
        },
    },
    components: {
        parameters: {
            Id: { name: "id", in: "path", required: true, schema: { type: "string", maxLength: 240 } },
            Ano: { name: "ano", in: "query", schema: { type: "integer", minimum: 1900, maximum: 2200 } },
            Autor: { name: "autor", in: "query", schema: { type: "string", maxLength: 120 } },
            Categoria: { name: "categoria", in: "query", schema: { type: "string", maxLength: 120 } },
            Status: { name: "status", in: "query", schema: { type: "string", maxLength: 120 } },
            Municipio: { name: "municipio", in: "query", schema: { type: "string", maxLength: 120 } },
            Limit: { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            Cursor: { name: "cursor", in: "query", schema: { type: "string", maxLength: 500 } },
        },
        schemas: {
            Money: { type: "number", minimum: 0, description: "Valor em reais, sem formatação textual" },
            FinancialTotals: {
                type: "object",
                additionalProperties: false,
                required: ["reservado", "empenhado", "liquidado", "pago"],
                properties: {
                    reservado: { $ref: "#/components/schemas/Money" },
                    empenhado: { $ref: "#/components/schemas/Money" },
                    liquidado: { $ref: "#/components/schemas/Money" },
                    pago: { $ref: "#/components/schemas/Money" },
                },
            },
            Amendment: {
                type: "object",
                additionalProperties: false,
                required: ["id", "numero", "ano", "municipio", "ambito", "tipo", "autor", "objeto", "finalidade", "categoria", "funcao", "subfuncao", "orgaoBeneficiario", "localidadeBeneficiada", "valor", "valorAutorizado", "execucao", "status", "atualizadoEm"],
                properties: {
                    id: { type: "string" },
                    numero: { type: ["string", "null"] },
                    ano: { type: ["integer", "null"] },
                    municipio: { type: ["string", "null"] },
                    ambito: { type: ["string", "null"] },
                    tipo: { type: ["string", "null"] },
                    autor: { type: ["string", "null"] },
                    objeto: { type: ["string", "null"] },
                    finalidade: { type: ["string", "null"] },
                    categoria: { type: ["string", "null"] },
                    funcao: { type: ["string", "null"] },
                    subfuncao: { type: ["string", "null"] },
                    orgaoBeneficiario: { type: ["string", "null"] },
                    localidadeBeneficiada: { type: ["string", "null"] },
                    valor: { $ref: "#/components/schemas/Money" },
                    valorAutorizado: { $ref: "#/components/schemas/Money" },
                    execucao: { $ref: "#/components/schemas/FinancialTotals" },
                    status: { type: ["string", "null"] },
                    atualizadoEm: { type: ["string", "null"], format: "date-time" },
                },
            },
            FinancialEvent: {
                type: "object",
                additionalProperties: false,
                required: ["id", "data", "valor", "descricao"],
                properties: {
                    id: { type: "string" },
                    data: { type: ["string", "null"], format: "date-time" },
                    valor: { $ref: "#/components/schemas/Money" },
                    descricao: { type: ["string", "null"] },
                },
            },
            Financial: {
                type: "object",
                additionalProperties: false,
                required: ["amendmentId", "totais", "empenhos", "liquidacoes", "pagamentos", "atualizadoEm"],
                properties: {
                    amendmentId: { type: "string" },
                    totais: { $ref: "#/components/schemas/FinancialTotals" },
                    empenhos: { type: "array", items: { $ref: "#/components/schemas/CommitmentEvent" } },
                    liquidacoes: { type: "array", items: { $ref: "#/components/schemas/FinancialEvent" } },
                    pagamentos: { type: "array", items: { $ref: "#/components/schemas/FinancialEvent" } },
                    atualizadoEm: { type: ["string", "null"], format: "date-time" },
                },
            },
            CommitmentEvent: {
                type: "object",
                additionalProperties: false,
                required: ["id", "data", "valor", "descricao", "numero", "credor", "processo"],
                properties: {
                    id: { type: "string" },
                    data: { type: ["string", "null"], format: "date-time" },
                    valor: { $ref: "#/components/schemas/Money" },
                    descricao: { type: ["string", "null"] },
                    numero: { type: ["string", "null"] },
                    credor: { type: ["string", "null"] },
                    processo: { type: ["string", "null"] },
                },
            },
            Revenue: {
                type: "object",
                additionalProperties: false,
                required: ["id", "exercicio", "numeroEmenda", "autor", "historico", "dataCredito", "valorCreditado", "operacao", "vinculo", "naturezaReceita", "descricaoReceita", "ambito", "fonte", "atualizadoEm"],
                properties: {
                    id: { type: "string" },
                    exercicio: { type: "integer" },
                    numeroEmenda: { type: ["string", "null"] },
                    autor: { type: ["string", "null"] },
                    historico: { type: ["string", "null"] },
                    dataCredito: { type: ["string", "null"], format: "date-time" },
                    valorCreditado: { $ref: "#/components/schemas/Money" },
                    operacao: { type: ["string", "null"] },
                    vinculo: { type: ["string", "null"] },
                    naturezaReceita: { type: ["string", "null"] },
                    descricaoReceita: { type: ["string", "null"] },
                    ambito: { type: ["string", "null"] },
                    fonte: { type: ["string", "null"], format: "uri" },
                    atualizadoEm: { type: ["string", "null"], format: "date-time" },
                },
            },
            Pagination: {
                type: "object",
                required: ["limit", "nextCursor"],
                properties: {
                    limit: { type: "integer" },
                    nextCursor: { type: ["string", "null"] },
                },
            },
            Meta: {
                type: "object",
                required: ["apiVersion", "generatedAt", "requestId"],
                properties: {
                    apiVersion: { const: "1" },
                    generatedAt: { type: "string", format: "date-time" },
                    requestId: { type: "string" },
                },
            },
            AmendmentListResponse: {
                type: "object",
                required: ["data", "pagination", "meta"],
                properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Amendment" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                    meta: { $ref: "#/components/schemas/Meta" },
                },
            },
            RevenueListResponse: {
                type: "object",
                required: ["data", "pagination", "meta"],
                properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Revenue" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                    meta: { $ref: "#/components/schemas/Meta" },
                },
            },
            AmendmentResponse: {
                type: "object",
                required: ["data", "meta"],
                properties: {
                    data: { $ref: "#/components/schemas/Amendment" },
                    meta: { $ref: "#/components/schemas/Meta" },
                },
            },
            FinancialResponse: {
                type: "object",
                required: ["data", "meta"],
                properties: {
                    data: { $ref: "#/components/schemas/Financial" },
                    meta: { $ref: "#/components/schemas/Meta" },
                },
            },
            ErrorResponse: {
                type: "object",
                required: ["error"],
                properties: {
                    error: {
                        type: "object",
                        required: ["code", "message", "requestId"],
                        properties: {
                            code: { type: "string" },
                            message: { type: "string" },
                            requestId: { type: "string" },
                            details: { type: "array", items: { type: "string" } },
                        },
                    },
                },
            },
        },
    },
} as const;
