"use client";

import Link from "next/link";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Amendment } from "@/lib/store";
import Navbar from "@/components/shared/navbar";
import { getSectorColor } from "@/lib/sector-colors";
import { getNormalizedStatus } from "@/lib/status-mapper";

interface Project {
    id: string;
    title: string;
    status: string;
    sector: string;
    budget: string;
    location: string;
    progress: number;
    description: string;
    startDate: string;
    endDate: string;
    responsible?: string;
    responsiblePhoto?: string;
    hasReservado?: boolean;
    hasEmpenhado?: boolean;
    hasLiquidado?: boolean;
    hasPago?: boolean;
    categoriaNum?: string;
}

const VEREADORES_PHOTOS: Record<string, string> = {
    "alexandre capriotti": "https://www.osasco.sp.leg.br/images/vereadores/400x533/45388db9259060c2f847a9acf050a525.jpg",
    "batista comunidade": "https://www.osasco.sp.leg.br/images/vereadores/400x533/a616933d8c8620c941db8c6389743b26.jpg",
    "cantor goleiro": "https://www.osasco.sp.leg.br/images/vereadores/400x533/0767c1963d740186c59c2e830c10e16b.jpg",
    "carmônio bastos": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9ed34e28b9efdc33b9a383d18abc6946.jpg",
    "carmonio bastos": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9ed34e28b9efdc33b9a383d18abc6946.jpg",
    "délbio teruel": "https://www.osasco.sp.leg.br/images/vereadores/400x533/e535033db602c5581a7ac0b1d0315046.jpg",
    "delbio teruel": "https://www.osasco.sp.leg.br/images/vereadores/400x533/e535033db602c5581a7ac0b1d0315046.jpg",
    "elania silva": "https://www.osasco.sp.leg.br/images/vereadores/400x533/2d5fce8da59d004aaf94a048306c88c2.jpg",
    "elsa oliveira": "https://www.osasco.sp.leg.br/images/vereadores/400x533/3ee2bfdd86e0fe13ff2eba5087f754af.JPEG",
    "emerson osasco": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9df54556d1ce3e52f5f92b34e0e902b7.jpg",
    "fábio chirinhan": "https://www.osasco.sp.leg.br/images/vereadores/400x533/7637eecf3bafafa18bf946866c3d7ebb.jpg",
    "fabio chirinhan": "https://www.osasco.sp.leg.br/images/vereadores/400x533/7637eecf3bafafa18bf946866c3d7ebb.jpg",
    "gabriel saúde": "https://www.osasco.sp.leg.br/images/vereadores/400x533/64d036a8536d88813efe862c01f17196.jpg",
    "gabriel saude": "https://www.osasco.sp.leg.br/images/vereadores/400x533/64d036a8536d88813efe862c01f17196.jpg",
    "guilherme prado": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9a0b3136fdaadd2c3eafa95bc9ac8a67.jpg",
    "heber do juntoz": "https://www.osasco.sp.leg.br/images/vereadores/400x533/451dca9078df3a7b78ba7dbcae04f519.jpg",
    "heber": "https://www.osasco.sp.leg.br/images/vereadores/400x533/451dca9078df3a7b78ba7dbcae04f519.jpg",
    "josias da juco": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9af83e98e89d0d11384218be586f9c15.jpg",
    "josias": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9af83e98e89d0d11384218be586f9c15.jpg",
    "laércio mendonça": "https://www.osasco.sp.leg.br/images/vereadores/400x533/24d2dd1f169220dd29a534cab813846f.jpg",
    "laercio mendonca": "https://www.osasco.sp.leg.br/images/vereadores/400x533/24d2dd1f169220dd29a534cab813846f.jpg",
    "lúcia da saúde": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "lucia da saude": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "paulo junior": "https://www.osasco.sp.leg.br/images/vereadores/400x533/1dae1fb1d07087c4955141b0c4a187ae.jpg",
    "pedrinho cantagessi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/1f3f10d6b03bf5dc76cab37061b8bf0a.jpg",
    "ralfi silva": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "ralfi rafael": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "ralfi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "rodrigo gansinho": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9b61b998c846d6a0bf42416efcf1ea12.jpg",
    "sergio fontellas": "https://www.osasco.sp.leg.br/images/vereadores/400x533/ed4f5329b802c35ca71bfe51a0547a4a.jpg",
    "sérgio fontellas": "https://www.osasco.sp.leg.br/images/vereadores/400x533/ed4f5329b802c35ca71bfe51a0547a4a.jpg",
    "stephane rossi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/c019dab55864b3d4a328aeb49686e753.jpg",
};

function findVereadorPhoto(name: string): string | undefined {
    const normalized = name.toLowerCase().trim();
    // Exact match
    if (VEREADORES_PHOTOS[normalized]) return VEREADORES_PHOTOS[normalized];
    // Partial match: check if any key is contained in the name or vice versa
    for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
        if (normalized.includes(key) || key.includes(normalized)) return url;
    }
    // Match by last name
    const parts = normalized.split(" ");
    for (const part of parts) {
        if (part.length < 3) continue;
        for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
            if (key.split(" ").some(k => k === part)) return url;
        }
    }
    return undefined;
}

const ITEMS_PER_PAGE = 9;

const FILTRO_LABELS: Record<string, string> = {
    reservado: "Com Reserva",
    empenhado: "Com Empenho",
    liquidado: "Com Liquidação",
    pago: "Com Pagamento",
};

const parseFinanceiro = (v: any): number => {
    if (!v) return 0;
    const cleaned = String(v).replace(/R\$\s*/gi, "").replace(/\./g, "").replace(",", ".").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

function ProjectsContent() {
    const searchParams = useSearchParams();
    const initialSector = searchParams.get("sector");
    const initialSearch = searchParams.get("search");
    const filtroParam = searchParams.get("filtro");

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch || "");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<string | null>(initialSector);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        async function fetchAmendments() {
            try {
                const response = await fetch("/api/amendments");
                const data = await response.json();

                let amendments: Amendment[] = [];
                if (Array.isArray(data)) {
                    amendments = data;
                } else if (data.data && Array.isArray(data.data)) {
                    amendments = data.data;
                }

                const mappedProjects: Project[] = amendments.map(a => {
                    let rawCat = (a as any).categoria;
                    if (typeof rawCat === "string" && rawCat.includes(" - ")) rawCat = rawCat.split(" - ")[0].trim();
                    const categoriaNum = rawCat ? String(rawCat) : undefined;

                    const text = ((a.orgaoBeneficiario || a.responsible || "") + (a.objeto || a.title || "") + (a.finalidade || a.description || "")).toLowerCase();
                    let sector = "Infraestrutura";
                    if (text.includes("saude") || text.includes("saúde") || text.includes("hospital") || text.includes("ubs")) sector = "Saúde";
                    else if (text.includes("educação") || text.includes("escola") || text.includes("creche")) sector = "Educação";
                    else if (text.includes("segurança") || text.includes("policia") || text.includes("guarda")) sector = "Segurança";
                    else if (text.includes("cultura") || text.includes("teatro") || text.includes("show")) sector = "Cultura";

                    const status = getNormalizedStatus(a.status as string);

                    const progressMap: Record<string, number> = {
                        "Não Iniciada": 0,
                        "Em Análise": 12,
                        "Elaboração": 25,
                        "Viabilização": 37,
                        "Contratação": 50,
                        "Execução": 75,
                        "Executada": 100,
                        "Cancelada": 0
                    };

                    let progress = progressMap[status] || 0;

                    const responsible = a.autor || a.author || a.orgaoBeneficiario || a.responsible || "Prefeitura";

                    return {
                        id: a.id,
                        title: a.objeto || a.title || "Sem título",
                        status,
                        sector,
                        budget: `R$ ${a.valor || a.value || "0,00"}`,
                        location: a.localidadeBeneficiada || a.neighborhood || a.address || "Local não informado",
                        progress,
                        description: a.finalidade || a.description || "",
                        startDate: a.startDate || "",
                        endDate: a.endDate || "",
                        responsible,
                        responsiblePhoto: findVereadorPhoto(responsible),
                        hasReservado: parseFinanceiro(a.reservado) > 0,
                        hasEmpenhado: parseFinanceiro(a.empenhado) > 0,
                        hasLiquidado: parseFinanceiro(a.liquidado) > 0,
                        hasPago: parseFinanceiro(a.pago) > 0,
                        categoriaNum,
                    };
                });

                setProjects(mappedProjects);
            } catch (error) {
                console.error("Failed to load amendments", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAmendments();
    }, []);

    // Filter logic
    const filteredProjects = projects.filter((project) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            !term ||
            project.title.toLowerCase().includes(term) ||
            project.description.toLowerCase().includes(term) ||
            (project.responsible || "").toLowerCase().includes(term) ||
            project.sector.toLowerCase().includes(term) ||
            project.location.toLowerCase().includes(term);
        const matchesSector = selectedSector ? project.sector === selectedSector : true;
        const matchesStatus = selectedStatus ? project.status === selectedStatus : true;
        const matchesFiltro = !filtroParam || (
            filtroParam === "reservado" ? project.hasReservado :
                filtroParam === "empenhado" ? project.hasEmpenhado :
                    filtroParam === "liquidado" ? project.hasLiquidado :
                        filtroParam === "pago" ? project.hasPago :
                            true
        );
        return matchesSearch && matchesSector && matchesStatus && matchesFiltro;
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedStatus, selectedSector]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Executada":
                return { bg: "bg-blue-100 text-blue-700", bar: "bg-blue-500" };
            case "Execução":
                return { bg: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" };
            case "Cancelada":
                return { bg: "bg-red-100 text-red-700", bar: "bg-red-500" };
            case "Contratação":
                return { bg: "bg-blue-100 text-blue-700", bar: "bg-blue-500" };
            case "Viabilização":
                return { bg: "bg-purple-100 text-purple-700", bar: "bg-purple-500" };
            case "Elaboração":
                return { bg: "bg-indigo-100 text-indigo-700", bar: "bg-indigo-500" };
            case "Em Análise":
                return { bg: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
            case "Não Iniciada":
            default:
                return { bg: "bg-slate-100 text-slate-700", bar: "bg-slate-400" };
        }
    };

    const getInitials = (name: string) => {
        return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex h-[60vh] items-center justify-center text-slate-400">
                    Carregando emendas...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-10 w-full">
                {/* Header */}
                <div className="mb-10">
                    <h2 className="text-4xl font-extrabold tracking-tight mb-3">Explorar Todas as Emendas</h2>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Acompanhe em tempo real a destinação de recursos públicos, status de execução e o impacto gerado pelos parlamentares.
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                            <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
                            <input
                                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full"
                                placeholder="Buscar por título, autor ou palavra-chave..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filtro financeiro ativo (vindo da home) */}
                        {filtroParam && FILTRO_LABELS[filtroParam] && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium">
                                <span className="material-symbols-outlined text-sm">filter_alt</span>
                                <span>{FILTRO_LABELS[filtroParam]}</span>
                                <Link href="/projetos" className="ml-1 opacity-70 hover:opacity-100">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </Link>
                            </div>
                        )}
                        {/* Agrupamento Setorial */}
                        <div className="flex items-center gap-2">
                            <select
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] cursor-pointer"
                                value={selectedSector || ""}
                                onChange={(e) => setSelectedSector(e.target.value || null)}
                            >
                                <option value="">Todos os Setores</option>
                                <option value="Saúde">🏥 Saúde</option>
                                <option value="Educação">📚 Educação</option>
                                <option value="Infraestrutura">🚧 Infraestrutura</option>
                                <option value="Segurança">🚓 Segurança</option>
                                <option value="Cultura">🎭 Cultura</option>
                            </select>
                        </div>

                        {/* Agrupamento de Status */}
                        <div className="flex items-center gap-2">
                            <select
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] cursor-pointer"
                                value={selectedStatus || ""}
                                onChange={(e) => setSelectedStatus(e.target.value || null)}
                            >
                                <option value="">Todos os Status</option>
                                <option value="Não Iniciada">Não Iniciada</option>
                                <option value="Em Análise">Em Análise</option>
                                <option value="Elaboração">Elaboração</option>
                                <option value="Viabilização">Viabilização</option>
                                <option value="Contratação">Contratação</option>
                                <option value="Execução">Execução</option>
                                <option value="Executada">Executada</option>
                                <option value="Cancelada">Cancelada</option>
                            </select>
                        </div>

                        <div className="w-px h-8 bg-slate-200 mx-1"></div>

                        {/* Clear filters */}
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedSector(null);
                                setSelectedStatus(null);
                            }}
                            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                            title="Limpar filtros"
                        >
                            <span className="material-symbols-outlined block">filter_list_off</span>
                        </button>
                    </div>
                </div>

                {/* Results count */}
                <p className="text-sm text-slate-500 mb-6 font-medium">
                    {filteredProjects.length} {filteredProjects.length === 1 ? "emenda encontrada" : "emendas encontradas"}
                </p>

                {/* Grid of Cards */}
                {paginatedProjects.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-4 block">search_off</span>
                        <p className="text-lg font-semibold">Nenhuma emenda encontrada</p>
                        <p className="text-sm mt-1">Tente ajustar os filtros ou o termo de busca.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedProjects.map((project) => {
                            const style = getStatusStyle(project.status);
                            const sc = getSectorColor(project.sector);

                            return (
                                <Link href={`/projetos/${project.id}`} key={project.id}>
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all group h-full flex flex-col">
                                        {/* Status + Sector Badges */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-3 py-1 ${style.bg} rounded-full text-xs font-bold uppercase tracking-wider`}>
                                                    {project.status}
                                                </span>
                                                <span className={`px-3 py-1 ${sc.badgeBg} ${sc.badgeText} rounded-full text-xs font-bold uppercase tracking-wider`}>
                                                    {project.sector}
                                                </span>
                                            </div>
                                            <button
                                                className="text-slate-300 group-hover:text-blue-500 transition-colors"
                                                onClick={(e) => e.preventDefault()}
                                            >
                                                <span className="material-symbols-outlined">bookmark</span>
                                            </button>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-bold leading-tight mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {project.title}
                                        </h3>

                                        {/* Author */}
                                        <div className="flex items-center gap-3 mb-6">
                                            {project.responsiblePhoto ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={project.responsiblePhoto}
                                                    alt={project.responsible || "Vereador"}
                                                    className="size-10 rounded-full object-cover border-2 border-slate-200"
                                                />
                                            ) : (
                                                <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                    {getInitials(project.responsible || "PM")}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Autor</p>
                                                <p className="text-sm font-semibold">{project.responsible}</p>
                                            </div>
                                        </div>

                                        {/* Value */}
                                        <div className="mb-6">
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Valor Alocado</p>
                                            <p className="text-2xl font-extrabold text-blue-500">{project.budget}</p>
                                        </div>

                                        {/* Progress */}
                                        <div className="mt-auto">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-500">Progresso de Execução</span>
                                                <span className="text-xs font-bold text-blue-500">{project.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined block">chevron_left</span>
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`size-10 rounded-lg font-bold transition-colors ${currentPage === pageNum
                                            ? "bg-blue-500 text-white"
                                            : "border border-slate-200 hover:bg-white"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                    <span className="mx-2 text-slate-400">...</span>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="size-10 rounded-lg border border-slate-200 font-bold hover:bg-white transition-colors"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined block">chevron_right</span>
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-auto bg-white border-t border-slate-200 py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brasao-osasco.png" alt="Brasão de Osasco" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-slate-400">Portal das Emendas - Prefeitura Municipal de Osasco © 2026</span>
                    </div>
                    <div className="flex gap-8">
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="https://transparencia.osasco.sp.gov.br/#/dados_abertos" target="_blank" rel="noopener noreferrer">Dados Abertos</a>
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Transparência</a>
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function ProjetosPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Carregando...</div>}>
            <ProjectsContent />
        </Suspense>
    );
}
