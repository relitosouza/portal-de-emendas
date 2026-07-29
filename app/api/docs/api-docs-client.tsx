"use client";

import {
    BookOpen,
    Check,
    ChevronDown,
    Clipboard,
    CodeXml,
    ExternalLink,
    LoaderCircle,
    Play,
    RotateCcw,
    Search,
    ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type SchemaValue = {
    type?: string | readonly string[];
    default?: number | string;
    minimum?: number;
    maximum?: number;
    maxLength?: number;
};

type Parameter = {
    name: string;
    in: "query" | "path";
    required?: boolean;
    schema?: SchemaValue;
};

type ParameterReference = Parameter | { $ref: string };

type Operation = {
    tags?: readonly string[];
    summary?: string;
    parameters?: readonly ParameterReference[];
    responses: Record<string, unknown>;
};

type OpenApiSpecification = {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    paths: Record<string, { get?: Operation }>;
    components: {
        parameters: Record<string, Parameter>;
    };
};

type Endpoint = {
    path: string;
    operation: Operation;
    parameters: Parameter[];
};

type RequestResult = {
    status: number;
    statusText: string;
    duration: number;
    body: string;
    headers: { name: string; value: string }[];
};

function resolveParameter(
    parameter: ParameterReference,
    specification: OpenApiSpecification,
): Parameter {
    if ("$ref" in parameter) {
        const key = parameter.$ref.split("/").at(-1) ?? "";
        return specification.components.parameters[key];
    }
    return parameter;
}

function createRequestPath(endpoint: Endpoint, values: Record<string, string>) {
    let path = `/api/public/v1${endpoint.path}`;
    const query = new URLSearchParams();
    for (const parameter of endpoint.parameters) {
        const value = values[parameter.name]?.trim();
        if (!value) continue;
        if (parameter.in === "path") {
            path = path.replace(`{${parameter.name}}`, encodeURIComponent(value));
        } else {
            query.set(parameter.name, value);
        }
    }
    const queryString = query.toString();
    return `${path}${queryString ? `?${queryString}` : ""}`;
}

function responseTone(status: number) {
    if (status >= 200 && status < 300) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (status >= 400 && status < 500) return "text-amber-800 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
}

export function ApiDocsClient({
    specification,
}: {
    specification: OpenApiSpecification;
}) {
    const endpoints = useMemo<Endpoint[]>(() => (
        Object.entries(specification.paths)
            .filter(([, methods]) => methods.get)
            .map(([path, methods]) => ({
                path,
                operation: methods.get as Operation,
                parameters: (methods.get?.parameters ?? [])
                    .map((parameter) => resolveParameter(parameter, specification))
                    .filter(Boolean),
            }))
    ), [specification]);

    const groups = useMemo(() => (
        endpoints.reduce<Record<string, Endpoint[]>>((result, endpoint) => {
            const tag = endpoint.operation.tags?.[0] ?? "Geral";
            result[tag] = [...(result[tag] ?? []), endpoint];
            return result;
        }, {})
    ), [endpoints]);

    const [openPath, setOpenPath] = useState("/emendas");
    const [values, setValues] = useState<Record<string, Record<string, string>>>({});
    const [results, setResults] = useState<Record<string, RequestResult>>({});
    const [loadingPath, setLoadingPath] = useState<string | null>(null);
    const [copiedPath, setCopiedPath] = useState<string | null>(null);
    const [filter, setFilter] = useState("");

    const visibleGroups = useMemo(() => {
        const normalized = filter.trim().toLocaleLowerCase("pt-BR");
        if (!normalized) return groups;
        return Object.fromEntries(
            Object.entries(groups)
                .map(([tag, items]) => [
                    tag,
                    items.filter((endpoint) =>
                        `${endpoint.path} ${endpoint.operation.summary ?? ""} ${tag}`
                            .toLocaleLowerCase("pt-BR")
                            .includes(normalized)
                    ),
                ])
                .filter(([, items]) => (items as Endpoint[]).length > 0)
        ) as Record<string, Endpoint[]>;
    }, [filter, groups]);

    async function execute(endpoint: Endpoint) {
        const endpointValues = values[endpoint.path] ?? {};
        const missing = endpoint.parameters.find(
            (parameter) => parameter.required && !endpointValues[parameter.name]?.trim()
        );
        if (missing) {
            setResults((current) => ({
                ...current,
                [endpoint.path]: {
                    status: 400,
                    statusText: "Preencha os campos obrigatórios",
                    duration: 0,
                    body: JSON.stringify({ campo: missing.name }, null, 2),
                    headers: [],
                },
            }));
            return;
        }

        const requestPath = createRequestPath(endpoint, endpointValues);
        setLoadingPath(endpoint.path);
        const startedAt = performance.now();
        try {
            const response = await fetch(requestPath, { headers: { Accept: "application/json" } });
            const rawBody = await response.text();
            let formattedBody = rawBody;
            try {
                formattedBody = JSON.stringify(JSON.parse(rawBody), null, 2);
            } catch {
                // Keep non-JSON response as received.
            }
            setResults((current) => ({
                ...current,
                [endpoint.path]: {
                    status: response.status,
                    statusText: response.statusText,
                    duration: Math.round(performance.now() - startedAt),
                    body: formattedBody || "Resposta sem conteúdo",
                    headers: ["content-type", "etag", "ratelimit-remaining"]
                        .map((name) => ({ name, value: response.headers.get(name) ?? "" }))
                        .filter((header) => header.value),
                },
            }));
        } catch {
            setResults((current) => ({
                ...current,
                [endpoint.path]: {
                    status: 0,
                    statusText: "Falha de conexão",
                    duration: Math.round(performance.now() - startedAt),
                    body: "Não foi possível acessar a API. Confirme se o servidor está disponível.",
                    headers: [],
                },
            }));
        } finally {
            setLoadingPath(null);
        }
    }

    async function copyRequest(endpoint: Endpoint) {
        const path = createRequestPath(endpoint, values[endpoint.path] ?? {});
        await navigator.clipboard.writeText(`curl "${window.location.origin}${path}"`);
        setCopiedPath(endpoint.path);
        window.setTimeout(() => setCopiedPath(null), 1600);
    }

    return (
        <div className="api-docs-theme min-h-[100dvh] bg-slate-50 text-slate-950">
            <style jsx global>{`
                .api-docs-theme {
                    color-scheme: light;
                }

                @media (prefers-color-scheme: dark) {
                    .api-docs-theme {
                        color-scheme: dark;
                        background: #020617;
                        color: #f8fafc;
                    }

                    .api-docs-theme .bg-white {
                        background-color: #0f172a;
                    }

                    .api-docs-theme .bg-slate-50 {
                        background-color: #111c30;
                    }

                    .api-docs-theme .border-slate-200,
                    .api-docs-theme .border-slate-300 {
                        border-color: #334155;
                    }

                    .api-docs-theme .text-slate-950,
                    .api-docs-theme .text-slate-900,
                    .api-docs-theme .text-slate-800 {
                        color: #f8fafc;
                    }

                    .api-docs-theme .text-slate-700,
                    .api-docs-theme .text-slate-600,
                    .api-docs-theme .text-slate-500 {
                        color: #cbd5e1;
                    }

                    .api-docs-theme input {
                        background-color: #0f172a;
                        border-color: #475569;
                        color: #f8fafc;
                    }

                    .api-docs-theme input::placeholder {
                        color: #94a3b8;
                    }

                    .api-docs-theme .hover\\:bg-slate-50:hover {
                        background-color: #1e293b;
                    }

                    .api-docs-theme .hover\\:bg-blue-50:hover {
                        background-color: #172554;
                    }

                    .api-docs-theme .hover\\:text-blue-900:hover,
                    .api-docs-theme .hover\\:text-blue-800:hover {
                        color: #bfdbfe;
                    }
                }
            `}</style>
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
                        <Image src="/brasao-osasco.png" alt="Brasão de Osasco" width={36} height={36} className="h-9 w-9 object-contain" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-950">Portal das Emendas</p>
                            <p className="truncate text-xs text-slate-600">Documentação da API</p>
                        </div>
                    </Link>
                    <a
                        href="/api/public/v1/openapi.json"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                    >
                        OpenAPI JSON
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    </a>
                </div>
            </header>

            <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
                <section className="mb-8 max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800">
                        <BookOpen aria-hidden="true" className="h-5 w-5" />
                        API Pública
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                        Consulte os dados do portal
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                        Explore os recursos, informe os parâmetros e execute chamadas reais sem sair desta página.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700">
                            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-blue-700" />
                            Somente leitura
                        </span>
                        <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700">
                            OpenAPI {specification.openapi}
                        </span>
                        <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700">
                            Sem chave de acesso
                        </span>
                    </div>
                </section>

                <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="lg:sticky lg:top-5">
                        <label htmlFor="endpoint-search" className="mb-2 block text-sm font-semibold text-slate-800">
                            Buscar endpoint
                        </label>
                        <div className="relative">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                id="endpoint-search"
                                value={filter}
                                onChange={(event) => setFilter(event.target.value)}
                                placeholder="Ex.: emendas"
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <nav aria-label="Recursos da API" className="mt-5 space-y-5">
                            {Object.entries(visibleGroups).map(([tag, items]) => (
                                <div key={tag}>
                                    <h2 className="mb-2 text-xs font-bold text-slate-500">{tag}</h2>
                                    <div className="space-y-1">
                                        {items.map((endpoint) => (
                                            <a
                                                key={endpoint.path}
                                                href={`#${endpoint.path.replaceAll("/", "-").replace(/[{}]/g, "")}`}
                                                className="block rounded-lg px-3 py-2 font-mono text-xs text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                                            >
                                                {endpoint.path}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(visibleGroups).length === 0 && (
                                <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                    Nenhum endpoint encontrado.
                                </p>
                            )}
                        </nav>
                    </aside>

                    <div className="min-w-0 space-y-4">
                        {endpoints.map((endpoint) => {
                            const id = endpoint.path.replaceAll("/", "-").replace(/[{}]/g, "");
                            const isOpen = openPath === endpoint.path;
                            const result = results[endpoint.path];
                            const requestPath = createRequestPath(endpoint, values[endpoint.path] ?? {});
                            return (
                                <section
                                    id={id}
                                    key={endpoint.path}
                                    className="scroll-mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenPath(isOpen ? "" : endpoint.path)}
                                        aria-expanded={isOpen}
                                        className="flex min-h-20 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700 sm:px-5"
                                    >
                                        <span className="rounded-lg bg-blue-700 px-2.5 py-1.5 font-mono text-xs font-bold text-white">
                                            GET
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-mono text-sm font-semibold text-slate-950 sm:text-base">
                                                {endpoint.path}
                                            </span>
                                            <span className="mt-1 block text-sm text-slate-600">
                                                {endpoint.operation.summary}
                                            </span>
                                        </span>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-slate-200 px-4 py-5 sm:px-5 sm:py-6">
                                            {endpoint.parameters.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900">Parâmetros</h3>
                                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                        {endpoint.parameters.map((parameter) => (
                                                            <label key={parameter.name} className="block">
                                                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                                                    {parameter.name}
                                                                    {parameter.required && (
                                                                        <span className="text-xs font-medium text-blue-800">obrigatório</span>
                                                                    )}
                                                                </span>
                                                                <input
                                                                    value={values[endpoint.path]?.[parameter.name] ?? ""}
                                                                    onChange={(event) => setValues((current) => ({
                                                                        ...current,
                                                                        [endpoint.path]: {
                                                                            ...(current[endpoint.path] ?? {}),
                                                                            [parameter.name]: event.target.value,
                                                                        },
                                                                    }))}
                                                                    inputMode={parameter.schema?.type === "integer" ? "numeric" : "text"}
                                                                    placeholder={parameter.schema?.default !== undefined
                                                                        ? String(parameter.schema.default)
                                                                        : `Informe ${parameter.name}`}
                                                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                                                                />
                                                                <span className="mt-1.5 block text-xs text-slate-600">
                                                                    {parameter.in === "path" ? "Parte do endereço" : "Parâmetro de consulta"}
                                                                    {parameter.schema?.maximum ? `, máximo ${parameter.schema.maximum}` : ""}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className={endpoint.parameters.length ? "mt-6" : ""}>
                                                <h3 className="text-sm font-bold text-slate-900">Requisição</h3>
                                                <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl bg-slate-950 p-3 text-slate-100">
                                                    <span className="shrink-0 font-mono text-xs font-bold text-blue-300">GET</span>
                                                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
                                                        {requestPath}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyRequest(endpoint)}
                                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                                        aria-label="Copiar comando curl"
                                                    >
                                                        {copiedPath === endpoint.path
                                                            ? <Check aria-hidden="true" className="h-4 w-4" />
                                                            : <Clipboard aria-hidden="true" className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => execute(endpoint)}
                                                        disabled={loadingPath === endpoint.path}
                                                        className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-800 active:translate-y-px disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                                                    >
                                                        {loadingPath === endpoint.path
                                                            ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                                                            : <Play aria-hidden="true" className="h-4 w-4" />}
                                                        Executar
                                                    </button>
                                                    {(values[endpoint.path] || result) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setValues((current) => ({ ...current, [endpoint.path]: {} }));
                                                                setResults((current) => {
                                                                    const next = { ...current };
                                                                    delete next[endpoint.path];
                                                                    return next;
                                                                });
                                                            }}
                                                            className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                                                        >
                                                            <RotateCcw aria-hidden="true" className="h-4 w-4" />
                                                            Limpar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {result && (
                                                <div className="mt-6" aria-live="polite">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <h3 className="text-sm font-bold text-slate-900">Resposta</h3>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className={`rounded-lg border px-2.5 py-1 font-bold ${responseTone(result.status)}`}>
                                                                {result.status || "ERRO"} {result.statusText}
                                                            </span>
                                                            <span className="font-mono text-slate-600">{result.duration} ms</span>
                                                        </div>
                                                    </div>
                                                    {result.headers.length > 0 && (
                                                        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                                                            {result.headers.map((header) => (
                                                                <div key={header.name} className="flex gap-1">
                                                                    <dt className="font-semibold">{header.name}:</dt>
                                                                    <dd className="font-mono">{header.value}</dd>
                                                                </div>
                                                            ))}
                                                        </dl>
                                                    )}
                                                    <pre className="mt-3 max-h-[520px] overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">
                                                        <code>{result.body}</code>
                                                    </pre>
                                                </div>
                                            )}

                                            <div className="mt-6 border-t border-slate-200 pt-5">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                    <CodeXml aria-hidden="true" className="h-4 w-4 text-blue-700" />
                                                    Códigos de resposta
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {Object.keys(endpoint.operation.responses).map((status) => (
                                                        <span key={status} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                                                            {status}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
