import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getAmendmentsFromSheet } from "@/lib/json-storage";
import { Amendment } from "@/lib/store";
import { getCategoryLabel, formatCurrency, parseCurrency } from "@/lib/amendments-utils";
import { getEffectiveStatus } from "@/lib/status-mapper";
import { normalizeString } from "@/lib/utils";
import PrintReportButton from "./print-button";
import StatusFlowTrack from "@/components/shared/status-flow-track";

export const revalidate = 60;

interface Props {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const FILTER_LABELS: Record<string, string> = {
    reservado: "Com Reserva",
    empenhado: "Com Empenho",
    liquidado: "Com Liquidação",
    pago: "Com Pagamento",
};

function firstValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
}

function getResponsible(amendment: Amendment): string {
    return amendment.autor || amendment.author || amendment.responsavelNome || amendment.responsible || "Não informado";
}

function getTitle(amendment: Amendment): string {
    return amendment.objeto || amendment.title || "-";
}

function getSector(amendment: Amendment): string {
    const dbCategory = getCategoryLabel(amendment.categoria) || "Sem Categoria";
    let sector = dbCategory || "Infraestrutura";

    if (sector === "Sem Categoria") {
        const text = `${amendment.orgaoBeneficiario || amendment.responsible || ""} ${getTitle(amendment)} ${amendment.finalidade || amendment.description || ""}`.toLowerCase();
        if (text.includes("saude") || text.includes("saúde") || text.includes("hospital") || text.includes("ubs")) sector = "Saúde";
        else if (text.includes("educação") || text.includes("escola") || text.includes("creche")) sector = "Educação";
        else if (text.includes("segurança") || text.includes("policia") || text.includes("guarda")) sector = "Segurança";
        else if (text.includes("cultura") || text.includes("teatro") || text.includes("show")) sector = "Cultura";
        else if (text.includes("esporte") || text.includes("lazer") || text.includes("estadio")) sector = "Desporto e Lazer";
    }

    return sector;
}

function matchesFilters(amendment: Amendment, filters: {
    search: string;
    sector: string;
    status: string;
    responsible: string;
    ambito: string;
    filtro: string;
}) {
    const title = normalizeString(getTitle(amendment));
    const author = normalizeString(getResponsible(amendment));
    const sector = normalizeString(getSector(amendment));
    const status = normalizeString(getEffectiveStatus(amendment.status as string, {
        empenhado: amendment.empenhado,
        liquidado: amendment.liquidado,
        pago: amendment.pago,
    }));
    const valueSearch = normalizeString(amendment.numeroEmenda || "");
    const description = normalizeString(amendment.finalidade || amendment.description || "");
    const location = normalizeString(amendment.localidadeBeneficiada || amendment.neighborhood || amendment.address || "");
    const categoria = normalizeString(getCategoryLabel(amendment.categoria) || "");

    const matchesSearch = !filters.search || (
        title.includes(filters.search) ||
        author.includes(filters.search) ||
        valueSearch.includes(filters.search) ||
        description.includes(filters.search) ||
        sector.includes(filters.search) ||
        location.includes(filters.search) ||
        categoria.includes(filters.search)
    );
    const matchesSector = !filters.sector || sector === normalizeString(filters.sector);
    const matchesStatus = !filters.status || status === normalizeString(filters.status);
    const matchesResponsible = !filters.responsible || author === normalizeString(filters.responsible);
    const matchesAmbito = !filters.ambito || normalizeString(amendment.ambito || "") === normalizeString(filters.ambito);
    const matchesFiltro = !filters.filtro || (
        filters.filtro === "reservado" ? parseCurrency(amendment.reservado) > 0 :
            filters.filtro === "empenhado" ? parseCurrency(amendment.empenhado) > 0 :
                filters.filtro === "liquidado" ? parseCurrency(amendment.liquidado) > 0 :
                    filters.filtro === "pago" ? parseCurrency(amendment.pago) > 0 :
                        true
    );

    return matchesSearch && matchesSector && matchesStatus && matchesResponsible && matchesAmbito && matchesFiltro;
}

export default async function RelatorioIndicacoesPage(props: Props) {
    const params = await props.params;
    const searchParams = props.searchParams ? await props.searchParams : {};
    const { id } = params;

    let amendment: Amendment | null = null;
    let amendments: Amendment[] = [];

    try {
        amendments = await getAmendmentsFromSheet();
        amendment = amendments.find((a) => String(a.id) === String(id)) || null;
    } catch (error) {
        console.error("Failed to fetch amendment:", error);
    }

    if (!amendment) {
        notFound();
    }

    const filters = {
        search: normalizeString(firstValue(searchParams.search)),
        sector: firstValue(searchParams.sector),
        status: firstValue(searchParams.status),
        responsible: firstValue(searchParams.responsible),
        ambito: firstValue(searchParams.ambito),
        filtro: firstValue(searchParams.filtro),
    };

    const activeFilters = [
        { label: "Busca", value: filters.search },
        { label: "Setor", value: filters.sector },
        { label: "Status", value: filters.status },
        { label: "Autor", value: filters.responsible },
        { label: "Âmbito", value: filters.ambito },
        { label: "Financeiro", value: FILTER_LABELS[filters.filtro] || "" },
    ].filter((item) => item.value);

    const hasActiveFilters = Boolean(
        filters.search ||
        filters.sector ||
        filters.status ||
        filters.responsible ||
        filters.ambito ||
        filters.filtro
    );

    const visibleAmendments = hasActiveFilters
        ? amendments.filter((item) => matchesFilters(item, filters))
        : [amendment];

    const totalValue = visibleAmendments.reduce(
        (acc, item) => acc + parseCurrency(item.valorAutorizado || item.valor),
        0
    );

    const today = new Date().toLocaleDateString("pt-BR");
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
        const entry = Array.isArray(value) ? value[0] : value;
        if (entry) query.set(key, entry);
    }
    const backHref = `/projetos/${id}${query.toString() ? `?${query.toString()}` : ""}`;

    return (
        <>
            <div className="no-print w-full bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href={backHref}
                        className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar
                    </Link>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <span className="material-symbols-outlined text-blue-600">description</span>
                    <span className="font-bold text-sm uppercase tracking-wider text-slate-700">
                        Visualização de Impressão (PDF/A4)
                    </span>
                </div>
                <PrintReportButton />
            </div>

            <div className="bg-slate-100 min-h-screen print:bg-white">
                <div className="print-container max-w-[980px] mx-auto my-8 print:my-0 bg-white shadow-xl print:shadow-none p-10 border border-slate-200 print:border-none min-h-[1123px] relative flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full -z-0 print:hidden"></div>

                    <header className="flex items-start justify-between gap-6 border-b-2 border-blue-600 pb-5 mb-6 relative z-10">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                                Relatório de Indicações
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src="/brasao.png"
                                        alt="Brasão de Osasco"
                                        className="h-full w-full object-contain drop-shadow"
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-500 font-semibold leading-none">
                                        Portal das Emendas
                                    </p>
                                    <p className="text-[9px] uppercase text-slate-400 font-medium leading-none mt-0.5">
                                        Prefeitura Municipal de Osasco
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-blue-600 mb-1">EMISSÃO OFICIAL</p>
                            <p className="text-xl font-semibold text-slate-800">{today}</p>
                            <p className="text-[10px] text-slate-400">
                                Ref: {(amendment.numeroEmenda || id.slice(0, 12)).toUpperCase()}
                            </p>
                        </div>
                    </header>

                    <section className="mb-6">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <h3 className="text-xs uppercase font-bold text-slate-400 border-l-4 border-blue-600 pl-3">
                                Filtro aplicado
                            </h3>
                            <p className="text-xs font-semibold text-slate-500">
                                {visibleAmendments.length} emenda{visibleAmendments.length !== 1 ? "s" : ""} encontrada{visibleAmendments.length !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40">
                            {activeFilters.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {activeFilters.map((item) => (
                                        <div key={item.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs">
                                            <span className="font-bold text-slate-500 uppercase">{item.label}:</span>
                                            <span className="font-semibold text-slate-800">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Nenhum filtro ativo foi aplicado.</p>
                            )}
                        </div>
                    </section>

                    <section className="mb-6">
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="w-full table-fixed text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="w-[22%] px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Autor da Emenda</th>
                                        <th className="w-[14%] px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Categoria</th>
                                        <th className="w-[42%] px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Título da Emenda</th>
                                        <th className="w-[22%] px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Valor da Emenda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleAmendments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                                                Nenhuma emenda encontrada para os filtros informados.
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleAmendments.map((item) => {
                                            const status = getEffectiveStatus(item.status as string, {
                                                empenhado: item.empenhado,
                                                liquidado: item.liquidado,
                                                pago: item.pago,
                                            });

                                            return (
                                                <Fragment key={item.id}>
                                                    <tr key={`${item.id}-data`} className={item.id === id ? "bg-blue-50/60" : ""}>
                                                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-800 print:text-[10px]">
                                                            {getResponsible(item)}
                                                        </td>
                                                        <td className="px-4 py-3 text-[10px] leading-snug text-slate-600 print:text-[9px]">
                                                            {getCategoryLabel(item.categoria) || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-800">
                                                            <span className="block line-clamp-2 text-[10px] leading-snug print:text-[9px]">
                                                                {getTitle(item)}
                                                            </span>
                                                            {item.id === id && (
                                                                <span className="inline-flex mt-1 text-[9px] font-bold uppercase tracking-widest text-blue-600 print:text-[8px]">
                                                                    Emenda atual
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-[11px] font-semibold text-right font-mono whitespace-nowrap print:text-[10px]">
                                                            {formatCurrency(parseCurrency(item.valorAutorizado || item.valor))}
                                                        </td>
                                                    </tr>
                                                    <tr key={`${item.id}-flow`} className="border-b border-slate-200">
                                                        <td colSpan={4} className="px-4 pb-4 pt-1">
                                                            <StatusFlowTrack status={status} />
                                                        </td>
                                                    </tr>
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mb-8">
                        <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-lg p-4 bg-white">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Valor total do recorte</p>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Documento</p>
                                <p className="text-sm font-bold font-mono text-slate-800">
                                    {(amendment.numeroEmenda || id.slice(0, 8)).toUpperCase()}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Portal das Emendas · Prefeitura de Osasco
                                </p>
                            </div>
                        </div>
                    </section>

                    <footer className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-end">
                        <div className="max-w-[520px]">
                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                                Este documento consolida as indicações exibidas a partir dos filtros
                                aplicados na consulta. A verificação das informações pode ser feita
                                diretamente no Portal das Emendas da Prefeitura de Osasco.
                            </p>
                        </div>
                        <div className="flex flex-col items-end text-right border border-slate-200 bg-slate-50 rounded-lg px-4 py-3 min-w-[180px]">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Identificação do Documento
                            </span>
                            <span className="text-sm font-bold font-mono text-slate-800">
                                {(amendment.numeroEmenda || id.slice(0, 8)).toUpperCase()}
                            </span>
                            <span className="mt-1.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Relatório de Indicações
                            </span>
                            <span className="text-[8px] text-slate-400 mt-2">
                                Portal das Emendas · Prefeitura de Osasco
                            </span>
                        </div>
                    </footer>
                </div>

                <div className="no-print max-w-[980px] mx-auto mb-10 p-6 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-4">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <div>
                        <h4 className="font-bold text-blue-600 text-sm mb-1">Dicas para Impressão:</h4>
                        <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                            <li>
                                Utilize a opção <b>&quot;Salvar como PDF&quot;</b> nas configurações de impressão.
                            </li>
                            <li>
                                Habilite <b>&quot;Gráficos de segundo plano&quot;</b> para manter as cores.
                            </li>
                            <li>
                                Defina as margens como <b>&quot;Nenhuma&quot;</b> para melhor enquadramento no padrão A4.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
