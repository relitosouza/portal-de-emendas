import Link from "next/link";
import { getAmendmentsFromSheet } from "@/lib/json-storage";
import { Amendment } from "@/lib/store";
import { formatCurrency, getCategoryLabel, parseCurrency } from "@/lib/amendments-utils";
import { normalizeString } from "@/lib/utils";
import { getEffectiveStatus } from "@/lib/status-mapper";
import PrintReportButton from "./print-button";

export const revalidate = 60;

interface Props { searchParams?: Promise<Record<string, string | string[] | undefined>>; }

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] || "" : value || "";
const title = (a: Amendment) => a.objeto || a.title || "Objetivo não informado";
const author = (a: Amendment) => a.autor || a.author || "Não informado";
const value = (a: Amendment) => parseCurrency(a.valorAutorizado || a.valor || a.value);

function matches(a: Amendment, p: Record<string, string>) {
    const sector = getCategoryLabel(a.categoria) || "Sem Categoria";
    const status = getEffectiveStatus(a.status, { empenhado: a.empenhado, liquidado: a.liquidado, pago: a.pago, dataCredito: a.dataCredito });
    const haystack = normalizeString(`${title(a)} ${a.finalidade || a.description || ""} ${author(a)} ${a.numeroEmenda || ""} ${sector}`);
    return (!p.search || haystack.includes(p.search))
        && (!p.sector || normalizeString(sector) === normalizeString(p.sector))
        && (!p.status || normalizeString(status) === normalizeString(p.status))
        && (!p.responsible || normalizeString(author(a)) === normalizeString(p.responsible))
        && (!p.ambito || normalizeString(a.ambito || "") === normalizeString(p.ambito))
        && (!p.filtro || (p.filtro === "reservado" ? parseCurrency(a.reservado) > 0 : p.filtro === "empenhado" ? parseCurrency(a.empenhado) > 0 : p.filtro === "liquidado" ? parseCurrency(a.liquidado) > 0 : p.filtro === "pago" ? parseCurrency(a.pago) > 0 : true));
}

export default async function RelatorioObjetivosPage({ searchParams }: Props) {
    const params = searchParams ? await searchParams : {};
    let amendments: Amendment[] = [];
    try { amendments = await getAmendmentsFromSheet(); } catch (error) { console.error("Failed to fetch amendments:", error); }
    const filters = { search: normalizeString(first(params.search)), sector: first(params.sector), status: first(params.status), responsible: first(params.responsible), ambito: first(params.ambito), filtro: first(params.filtro) };
    const visible = amendments.filter(a => matches(a, filters));
    const groups = Array.from(visible.reduce((map, a) => {
        const key = title(a).trim() || "Objetivo não informado";
        const group = map.get(key) || { objective: key, amendments: [] as Amendment[], total: 0 };
        group.amendments.push(a); group.total += value(a); map.set(key, group); return map;
    }, new Map<string, { objective: string; amendments: Amendment[]; total: number }>()).values()).sort((a, b) => b.total - a.total || a.objective.localeCompare(b.objective, "pt-BR"));
    const total = visible.reduce((sum, a) => sum + value(a), 0);
    const categorySummary = Array.from(new Set(visible.map(a => getCategoryLabel(a.categoria) || "Sem categoria"))).sort((a, b) => a.localeCompare(b, "pt-BR")).join(", ");
    const filterLabels: Record<string, string> = {
        search: "Busca",
        sector: "Categoria",
        status: "Status",
        responsible: "Autor",
        ambito: "Âmbito",
        filtro: "Financeiro",
    };
    const criteria = Object.entries(filters).filter(([, v]) => v).map(([key, v]) => `${filterLabels[key]}: ${v}`);
    if (!filters.sector && categorySummary) criteria.push(`Categoria: ${categorySummary}`);
    const active = criteria.join(" • ");
    const today = new Date().toLocaleDateString("pt-BR");

    return <>
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-50">
            <Link href={`/projetos${active ? "?" + new URLSearchParams(Object.entries(filters).filter(([, v]) => v)) : ""}`} className="text-sm font-medium text-slate-500 hover:text-blue-600">← Voltar para emendas</Link>
            <PrintReportButton />
        </div>
        <main className="min-h-screen bg-slate-100 print:bg-white">
            <div className="print-container mx-auto my-8 min-h-[1123px] max-w-[980px] bg-white px-10 py-9 shadow-xl print:my-0 print:shadow-none">
                <header className="mb-7 flex items-start justify-between gap-8 border-b-2 border-blue-600 pb-5">
                    <div className="flex items-start gap-3">
                        <img src="/brasao.png" alt="Brasão de Osasco" className="mt-0.5 h-11 w-11 shrink-0 object-contain" />
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-700">Portal das Emendas</p>
                            <h1 className="mt-1 text-[25px] font-bold leading-tight tracking-tight text-slate-900">Emendas por objetivo</h1>
                            <p className="mt-1 text-[10px] text-slate-500">Prefeitura Municipal de Osasco · relatório consolidado</p>
                        </div>
                    </div>
                    <div className="shrink-0 text-right"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Emitido em</p><p className="mt-1 font-mono text-base font-bold tabular-nums text-slate-800">{today}</p></div>
                </header>
                <section className="mb-7 grid grid-cols-[1fr_1fr_1.25fr] gap-3" aria-label="Resumo do relatório">
                    <div className="border-l-2 border-slate-300 bg-slate-50 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Objetivos</p><p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">{groups.length}</p></div>
                    <div className="border-l-2 border-slate-300 bg-slate-50 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Emendas</p><p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">{visible.length}</p></div>
                    <div className="border-l-2 border-blue-600 bg-blue-50 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-wider text-blue-700">Valor total autorizado</p><p className="mt-1 font-mono text-xl font-bold tabular-nums text-blue-800">{formatCurrency(total)}</p></div>
                </section>
                {active && <section className="mb-6 border-y border-slate-200 py-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Critério da consulta</p><p className="mt-1 text-[11px] leading-relaxed text-slate-700">{active}</p></section>}
                {groups.length === 0 ? <div className="border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">Nenhuma emenda encontrada para os filtros informados.</div> : <div className="space-y-6">{groups.map(group => <section key={group.objective} className="overflow-hidden border border-slate-200">
                    <div className="flex items-start justify-between gap-5 border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <div><p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-blue-700">Objetivo</p><h2 className="max-w-[680px] text-sm font-bold leading-snug text-slate-900">{group.objective}</h2></div>
                        <div className="shrink-0 pt-1 text-right"><p className="text-[9px] uppercase tracking-wider text-slate-500">{group.amendments.length} emenda{group.amendments.length !== 1 ? "s" : ""}</p></div>
                    </div>
                    <table className="w-full border-collapse text-left"><thead className="[display:table-header-group]"><tr className="border-b border-slate-200"><th className="w-[5%] px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">#</th><th className="w-[49%] px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Autor e número da emenda</th><th className="w-[26%] px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Natureza da despesa</th><th className="w-[20%] px-4 py-2 text-right text-[9px] font-bold uppercase tracking-wider text-slate-400">Valor</th></tr></thead><tbody>{group.amendments.map((a, index) => <tr key={a.id} className="break-inside-avoid border-b border-slate-100 last:border-0"><td className="px-4 py-2 font-mono text-[10px] tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</td><td className="px-2 py-2 text-[10px] text-slate-700"><span className="font-semibold text-slate-900">{author(a)}</span>{a.numeroEmenda && <span className="ml-1 text-slate-500">· {a.numeroEmenda}</span>}</td><td className="px-2 py-2 text-[10px] text-slate-600">{a.naturezaDespesa || "Não informado"}</td><td className="px-4 py-2 text-right font-mono text-[10px] font-semibold tabular-nums text-slate-800">{formatCurrency(value(a))}</td></tr>)}</tbody></table>
                </section>)}</div>}
                <footer className="mt-8 flex items-center justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400"><span>Portal das Emendas de Osasco</span><span>Documento para impressão e consulta pública</span></footer>
            </div>
        </main>
    </>;
}
