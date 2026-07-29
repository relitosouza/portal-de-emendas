import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { mapPublicAmendment, mapPublicFinancial, mapPublicRevenue } from "../lib/public-api/mappers.ts";
import { publicError, publicJson, publicOptions } from "../lib/public-api/http.ts";
import { publicOpenApiDocument } from "../lib/public-api/openapi.ts";
import { filterAndPaginateAmendments, parsePublicQuery } from "../lib/public-api/service.ts";
import { checkRateLimit } from "../lib/rate-limit.ts";

const privateFields = [
    "numeroConta",
    "agencia",
    "documento",
    "ordemBancaria",
    "vinculoDescription",
];

test("mapeia emenda sem expor campos privados e normaliza moeda/data", () => {
    const result = mapPublicAmendment({
        id: "emenda-1",
        createdAt: "2026-03-12T10:00:00Z",
        municipio: "Osasco",
        numeroEmenda: "42/2026",
        autor: "Maria",
        objeto: "Reforma da UBS",
        categoria: "Saúde",
        status: "Em andamento",
        valorAutorizado: "R$ 1.234,56",
        numeroConta: "123-4",
        responsavelNome: "Pessoa interna",
        empenhado: "1.000,00",
    } as never);

    assert.equal(result.valorAutorizado, 1234.56);
    assert.equal(result.execucao.empenhado, 1000);
    assert.equal(result.atualizadoEm, "2026-03-12T10:00:00.000Z");
    for (const field of privateFields) {
        assert.equal(JSON.stringify(result).includes(field), false);
    }
});

test("mapeia execução financeira sem dados bancários", () => {
    const result = mapPublicFinancial({
        amendmentId: "emenda-1",
        empenhado: "500,00",
        liquidado: "400,00",
        pago: "300,00",
        reservado: "600,00",
        updatedAt: "2026-03-12",
        pagamentos: [{
            id: "p1",
            data: "2026-03-10",
            valor: "300,00",
            banco: "Banco",
            agencia: "0001",
            documento: "secreto",
            ordemBancaria: "ob-1",
            descricao: "Pagamento",
            createdAt: "2026-03-10",
        }],
    });

    assert.equal(result.totais.pago, 300);
    assert.deepEqual(result.pagamentos[0], {
        id: "p1",
        data: "2026-03-10T00:00:00.000Z",
        valor: 300,
        descricao: "Pagamento",
    });
});

test("mapeia receita sem descrição interna do vínculo ou transações bancárias", () => {
    const result = mapPublicRevenue({
        id: "r1",
        exercise: 2026,
        author: "Autor",
        history: "Crédito",
        creditDate: "2026-02-01",
        creditedValue: 100,
        operation: "Crédito",
        vinculo: "08.804",
        vinculoDescription: "Interno",
        revenueNature: "Receita",
        revenueDescription: "Descrição",
        bank: "Banco",
        scope: "Federal",
        sourceUrl: "https://example.gov.br",
        updatedAt: "2026-02-02",
        transactions: [],
    });

    assert.equal(result.valorCreditado, 100);
    assert.equal("vinculoDescription" in result, false);
    assert.equal("bank" in result, false);
    assert.equal("transactions" in result, false);
});

test("valida filtros estritamente e rejeita limites acima de 100", () => {
    assert.equal(parsePublicQuery(new URLSearchParams("limit=101")).success, false);
    assert.equal(parsePublicQuery(new URLSearchParams("limit=abc")).success, false);
    assert.equal(parsePublicQuery(new URLSearchParams("ano=2026&limit=20")).success, true);
});

test("filtra sem acentos e pagina por cursor sem duplicar itens", () => {
    const items = [
        { id: "3", createdAt: "2026-03-03", categoria: "Saúde", autor: "C", status: "Novo", municipio: "Osasco", numeroEmenda: "3/2026" },
        { id: "2", createdAt: "2026-03-02", categoria: "Saude", autor: "B", status: "Novo", municipio: "Osasco", numeroEmenda: "2/2026" },
        { id: "1", createdAt: "2025-03-01", categoria: "Educação", autor: "A", status: "Novo", municipio: "Osasco", numeroEmenda: "1/2025" },
    ] as never[];

    const first = filterAndPaginateAmendments(items, { categoria: "saude", limit: 1 });
    const second = filterAndPaginateAmendments(items, { categoria: "saude", limit: 1, cursor: first.nextCursor ?? undefined });

    assert.equal(first.items[0].id, "3");
    assert.equal(second.items[0].id, "2");
    assert.notEqual(first.items[0].id, second.items[0].id);
});

test("resposta pública fornece cache, ETag e suporta 304", () => {
    const context = {
        requestId: "req-1",
        corsOrigin: null,
        rateLimit: { allowed: true, remaining: 59, retryAfterMs: 0 },
        method: "GET",
        path: "/api/public/v1/emendas",
        startedAt: Date.now(),
    };
    const first = publicJson(new Request("http://localhost/api/public/v1/emendas"), context, {
        data: [],
        meta: { generatedAt: "2026-01-01T00:00:00.000Z", requestId: "req-1" },
    });
    const etag = first.headers.get("etag");
    const second = publicJson(new Request("http://localhost/api/public/v1/emendas", {
        headers: { "If-None-Match": etag ?? "" },
    }), { ...context, requestId: "req-2" }, {
        data: [],
        meta: { generatedAt: "2026-01-02T00:00:00.000Z", requestId: "req-2" },
    });

    assert.match(first.headers.get("cache-control") ?? "", /s-maxage=300/);
    assert.ok(etag);
    assert.equal(second.status, 304);
});

test("CORS autoriza origem configurada e rejeita origem não configurada", () => {
    const previous = process.env.PUBLIC_API_CORS_ORIGINS;
    process.env.PUBLIC_API_CORS_ORIGINS = "https://dados.example.br";
    try {
        const allowed = publicOptions(new Request("https://portal.example.br/api/public/v1/emendas", {
            method: "OPTIONS",
            headers: { Origin: "https://dados.example.br" },
        }));
        const denied = publicOptions(new Request("https://portal.example.br/api/public/v1/emendas", {
            method: "OPTIONS",
            headers: { Origin: "https://nao-autorizado.example.br" },
        }));
        assert.equal(allowed.headers.get("access-control-allow-origin"), "https://dados.example.br");
        assert.equal(denied.status, 403);
    } finally {
        if (previous === undefined) delete process.env.PUBLIC_API_CORS_ORIGINS;
        else process.env.PUBLIC_API_CORS_ORIGINS = previous;
    }
});

test("OpenAPI documenta todas as rotas públicas e segurança operacional", () => {
    const paths = Object.keys(publicOpenApiDocument.paths);
    assert.deepEqual(paths.sort(), [
        "/emendas",
        "/emendas/{id}",
        "/emendas/{id}/execucao-financeira",
        "/openapi.json",
        "/receitas-creditadas",
    ]);
    assert.equal(publicOpenApiDocument.openapi, "3.1.0");
    assert.ok(JSON.stringify(publicOpenApiDocument).includes("429"));
});

test("rate limit informa saldo e tempo de reset", async () => {
    const result = await checkRateLimit(`test:${crypto.randomUUID()}`, 2, 10_000);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 1);
    assert.ok(result.retryAfterMs > 0);
});

test("todos os registros locais de emendas respeitam o DTO público", async () => {
    const files = ["../data/amendments.json", "../data/emendas-externas.json"];
    for (const file of files) {
        const amendments = JSON.parse(await readFile(new URL(file, import.meta.url), "utf8"));
        for (const amendment of amendments) {
            const serialized = JSON.stringify(mapPublicAmendment(amendment));
            for (const field of privateFields) assert.equal(serialized.includes(field), false);
        }
    }
});

test("formatador de erro preserva status 500 sem vazar detalhes internos", async () => {
    const response = publicError("req-500", 500, "INTERNAL_ERROR", "Falha controlada.");
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.deepEqual(body, {
        error: {
            code: "INTERNAL_ERROR",
            message: "Falha controlada.",
            requestId: "req-500",
        },
    });
});
