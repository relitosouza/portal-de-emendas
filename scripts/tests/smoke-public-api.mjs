import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 3107;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
        cwd: process.cwd(),
        env: { ...process.env, DISABLE_REDIS: "true" },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
    },
);

let logs = "";
server.stdout.on("data", (chunk) => { logs += chunk.toString(); });
server.stderr.on("data", (chunk) => { logs += chunk.toString(); });

async function fetchWithTimeout(path, init = {}) {
    return fetch(`${baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(5_000),
    });
}

async function waitUntilReady() {
    for (let attempt = 0; attempt < 40; attempt++) {
        try {
            const response = await fetchWithTimeout("/api/public/v1/openapi.json");
            if (response.ok) return;
        } catch {
            // Server is still starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Servidor não iniciou.\n${logs.slice(-2000)}`);
}

try {
    await waitUntilReady();

    const docs = await fetchWithTimeout("/api/docs");
    assert.equal(docs.status, 200);
    assert.match(await docs.text(), /Consulte os dados do portal/);

    const list = await fetchWithTimeout("/api/public/v1/emendas?ano=2026&limit=2");
    assert.equal(list.status, 200);
    assert.ok(list.headers.get("etag"));
    assert.ok(list.headers.get("ratelimit-limit"));
    const listBody = await list.json();
    assert.ok(Array.isArray(listBody.data));
    assert.equal(listBody.pagination.limit, 2);
    const serialized = JSON.stringify(listBody);
    assert.doesNotMatch(serialized, /numeroConta|agencia|ordemBancaria|vinculoDescription/);

    const cached = await fetchWithTimeout("/api/public/v1/emendas?ano=2026&limit=2", {
        headers: { "If-None-Match": list.headers.get("etag") },
    });
    assert.equal(cached.status, 304);

    assert.equal((await fetchWithTimeout("/api/public/v1/emendas?limit=101")).status, 400);
    assert.equal((await fetchWithTimeout("/api/public/v1/emendas/id-inexistente")).status, 404);
    assert.equal((await fetchWithTimeout("/api/public/v1/emendas", {
        headers: { Origin: "https://origem-nao-autorizada.example" },
    })).status, 403);

    let limited = false;
    for (let attempt = 0; attempt < 60; attempt++) {
        const response = await fetchWithTimeout("/api/public/v1/openapi.json");
        if (response.status === 429) {
            assert.ok(response.headers.get("retry-after"));
            limited = true;
            break;
        }
    }
    assert.equal(limited, true);

    console.log("Smoke API pública: 200, 304, 400, 403, 404 e 429 verificados.");
} finally {
    server.kill();
    await Promise.race([
        new Promise((resolve) => server.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
}
