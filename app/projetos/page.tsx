"use client";

import Link from "next/link";
import { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Amendment } from "@/lib/store";
import Navbar from "@/components/shared/navbar";
import { getSectorColor } from "@/lib/sector-colors";
import { getNormalizedStatus } from "@/lib/status-mapper";
import { VEREADORES_PHOTOS, findVereadorPhoto, parseCurrency } from "@/lib/amendments-utils";
import GroupedAmendments from "@/components/dashboard/grouped-amendments";
import { cn, normalizeString } from "@/lib/utils";

interface Project {
    id: string;
    numeroEmenda?: string;
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
    ambito?: string;
}

const ITEMS_PER_PAGE = 9;

const FILTRO_LABELS: Record<string, string> = {
    reservado: "Com Reserva",
    empenhado: "Com Empenho",
    liquidado: "Com Liquidação",
    pago: "Com Pagamento",
};

const parseFinanceiro = (v: any): number => {
    return parseCurrency(v);
};

const CATEGORY_MAP: Record<string, string> = {
    "1": "LEGISLATIVA", "2": "JUDICIÁRIA", "3": "ESSENCIAL À JUSTIÇA",
    "4": "ADMINISTRAÇÃO", "5": "DEFESA NACIONAL", "6": "SEGURANÇA PÚBLICA",
    "7": "RELAÇÕES EXTERIORES", "8": "ASSISTÊNCIA SOCIAL", "9": "PREVIDÊNCIA SOCIAL",
    "10": "SAÚDE", "11": "TRABALHO", "12": "EDUCAÇÃO", "13": "CULTURA",
    "14": "DIREITOS DA CIDADANIA", "15": "URBANISMO", "16": "HABITAÇÃO",
    "17": "SANEAMENTO", "18": "GESTÃO AMBIENTAL", "19": "CIÊNCIA E TECNOLOGIA",
    "20": "AGRICULTURA", "21": "ORGANIZAÇÃO AGRÁRIA", "22": "INDÚSTRIA",
    "23": "COMÉRCIO E SERVIÇOS", "24": "COMUNICAÇÕES", "25": "ENERGIA",
    "26": "TRANSPORTE", "27": "DESPORTO E LAZER", "28": "ENCARGOS ESPECIAIS",
    "99": "RESERVA DE CONTIGÊNCIA",
};

function getCategoryLabel(cat?: string): string {
    if (!cat) return "";
    let catNum = cat;
    if (typeof catNum === "string" && catNum.includes(" - ")) catNum = catNum.split(" - ")[0].trim();
    return CATEGORY_MAP[String(catNum)] || cat;
}

function exportToExcel(amendments: Amendment[]) {
    const headers = [
        "ID", "Nº Emenda", "Objeto/Título", "Finalidade", "Autor",
        "Categoria", "Tipo de Emenda", "Âmbito", "Fundamento Legal",
        "Município", "CNPJ", "Responsável", "Cargo do Responsável",
        "Função", "Subfunção", "Destinação", "Órgão Beneficiário",
        "Localidade Beneficiada", "Instrumento Jurídico", "Fornecedor",
        "Nº Licitação", "Prazo de Aplicação",
        "Valor", "Valor Autorizado", "Reservado", "Empenhado", "Liquidado", "Pago",
        "% RCL", "Conta Específica", "Nº Conta",
        "Código Aplicação", "Código Aplicação Variável",
        "Status", "Prioridade",
        "Portal Transparência", "Divulgação Tempo Real", "Link Portal", "Monitoramento",
        "Data de Criação",
    ];

    const escapeCSV = (val: any): string => {
        const str = String(val ?? "").replace(/"/g, '""');
        return `"${str}"`;
    };

    const rows = amendments.map((a) => [
        a.id,
        a.numeroEmenda || "",
        a.objeto || a.title || "",
        a.finalidade || a.description || "",
        a.autor || a.author || "",
        getCategoryLabel(a.categoria),
        a.tipoEmenda || "",
        a.ambito || "",
        a.fundamentoLegal || "",
        a.municipio || "",
        a.cnpj || "",
        a.responsavelNome || a.responsible || "",
        a.responsavelCargo || "",
        a.funcao || "",
        a.subfuncao || "",
        a.destinacao || "",
        a.orgaoBeneficiario || "",
        a.localidadeBeneficiada || a.neighborhood || a.address || "",
        a.instrumentoJuridico || "",
        a.fornecedor || "",
        a.numeroLicitacao || "",
        a.prazoAplicacao || "",
        a.valor || a.value || "",
        a.valorAutorizado || "",
        a.reservado || "",
        a.empenhado || "",
        a.liquidado || "",
        a.pago || "",
        a.percentualRcl || "",
        a.contaEspecifica || "",
        a.numeroConta || "",
        a.codigoAplicacao || "",
        a.codigoAplicacaoVariavel || "",
        getNormalizedStatus(a.status),
        a.priority || "",
        a.portalTransparenciaCheck || "",
        a.divulgacaoTempoReal || "",
        a.linkPortal || "",
        a.monitoramentoCheck || "",
        a.createdAt || "",
    ]);

    const csvContent = "\uFEFF" + [
        headers.map(escapeCSV).join(";"),
        ...rows.map(row => row.map(escapeCSV).join(";")),
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `emendas-osasco-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function ProjectsContent() {
    const searchParams = useSearchParams();
    const initialSector = searchParams.get("sector");
    const initialSearch = searchParams.get("search");
    const filtroParam = searchParams.get("filtro");

    const initialView = searchParams.get("view") === "grouped" ? "grouped" : "individual";
    const initialAmbito = searchParams.get("ambito");
    const [projects, setProjects] = useState<Project[]>([]);
    const [rawAmendments, setRawAmendments] = useState<Amendment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch || "");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<string | null>(initialSector);
    const [selectedResponsible, setSelectedResponsible] = useState<string | null>(null);
    const [selectedAmbito, setSelectedAmbito] = useState<string | null>(initialAmbito);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<"individual" | "grouped">(initialView);

    const availableSectors = useMemo(() => {
        const sectors = new Set(projects.map(p => p.sector).filter((s): s is string => !!s));
        return Array.from(sectors).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [projects]);

    const availableResponsibles = useMemo(() => {
        const responsibles = new Set(projects.map(p => p.responsible).filter((r): r is string => !!r));
        return Array.from(responsibles).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [projects]);

    useEffect(() => {
        async function fetchAmendments() {
            try {
                const response = await fetch("/api/amendments?limit=1000");
                const data = await response.json();

                let rawData: Amendment[] = [];
                if (Array.isArray(data)) {
                    rawData = data;
                } else if (data.data && Array.isArray(data.data)) {
                    rawData = data.data;
                }

                // Force deduplication by ID to prevent duplicate card rendering
                const amendments = Array.from(new Map(rawData.map(a => [a.id, a])).values());

                const mappedProjects: Project[] = amendments.map(a => {
                    let rawCat = (a as any).categoria;
                    if (typeof rawCat === "string" && rawCat.includes(" - ")) rawCat = rawCat.split(" - ")[0].trim();
                    const categoriaNum = rawCat ? String(rawCat) : undefined;

                    // Prioritize category from database mapping
                    const dbCategory = getCategoryLabel(a.categoria);
                    let sector = dbCategory || "Infraestrutura";
                    
                    if (sector === "Sem Categoria") {
                        // Fallback only if no category is assigned in DB
                        const text = ((a.orgaoBeneficiario || a.responsible || "") + (a.objeto || a.title || "") + (a.finalidade || a.description || "")).toLowerCase();
                        if (text.includes("saude") || text.includes("saúde") || text.includes("hospital") || text.includes("ubs")) sector = "Saúde";
                        else if (text.includes("educação") || text.includes("escola") || text.includes("creche")) sector = "Educação";
                        else if (text.includes("segurança") || text.includes("policia") || text.includes("guarda")) sector = "Segurança";
                        else if (text.includes("cultura") || text.includes("teatro") || text.includes("show")) sector = "Cultura";
                        else if (text.includes("esporte") || text.includes("lazer") || text.includes("estadio")) sector = "Desporto e Lazer";
                    }

                    const status = getNormalizedStatus(a.status as string);

                    const progressMap: Record<string, number> = {
                        "Não Iniciada": 0,
                        "Em Análise": 12,
                        "Elaboração": 25,
                        "Viabilização": 37,
                        "Contratação": 50,
                        "Execução": 75,
                        "Executada": 100,
                        "Prestação de Contas": 100,
                        "Cancelada": 0
                    };

                    let progress = progressMap[status] || 0;

                    const responsible = a.autor || a.author || a.orgaoBeneficiario || a.responsible || "Prefeitura";

                    return {
                        id: a.id,
                        numeroEmenda: a.numeroEmenda,
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
                        ambito: a.ambito,
                    };
                });

                setProjects(mappedProjects);
                setRawAmendments(amendments);
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
        const term = normalizeString(searchTerm);
        
        const matchesSearch = !term || (
            normalizeString(project.numeroEmenda || "").includes(term) ||
            normalizeString(project.title).includes(term) ||
            normalizeString(project.description).includes(term) ||
            normalizeString(project.responsible || "").includes(term) ||
            normalizeString(project.sector).includes(term) ||
            normalizeString(project.location).includes(term)
        );

        const matchesSector = selectedSector ? project.sector === selectedSector : true;
        const matchesStatus = selectedStatus ? project.status === selectedStatus : true;
        const matchesResponsible = selectedResponsible ? project.responsible === selectedResponsible : true;
        const matchesAmbito = selectedAmbito ? (project.ambito ? project.ambito.toLowerCase() === selectedAmbito.toLowerCase() : false) : true;
        const matchesFiltro = !filtroParam || (
            filtroParam === "reservado" ? project.hasReservado :
                filtroParam === "empenhado" ? project.hasEmpenhado :
                    filtroParam === "liquidado" ? project.hasLiquidado :
                        filtroParam === "pago" ? project.hasPago :
                            true
        );
        return matchesSearch && matchesSector && matchesStatus && matchesResponsible && matchesAmbito && matchesFiltro;
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
    }, [searchTerm, selectedStatus, selectedSector, selectedResponsible, selectedAmbito]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Prestação de Contas":
                return { bg: "bg-teal-100 text-teal-700", bar: "bg-teal-500" };
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

            <main aria-label="Listagem de emendas parlamentares" className="max-w-7xl mx-auto px-6 py-10 w-full">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-3">Explorar Todas as Emendas</h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Acompanhe em tempo real a destinação de recursos públicos, status de execução e o impacto gerado pelos parlamentares.
                    </p>
                </div>

                {/* Selector de Âmbito (Municipal, Estadual, Federal) */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <button
                        onClick={() => setSelectedAmbito(null)}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                            selectedAmbito === null
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
                        )}
                    >
                        Todas as Emendas
                    </button>
                    <button
                        onClick={() => setSelectedAmbito("Municipal")}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                            selectedAmbito === "Municipal"
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
                        )}
                    >
                        Emendas Municipais
                    </button>
                    <button
                        onClick={() => setSelectedAmbito("Estadual")}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                            selectedAmbito === "Estadual"
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
                        )}
                    >
                        Emendas Estaduais
                    </button>
                    <button
                        onClick={() => setSelectedAmbito("Federal")}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                            selectedAmbito === "Federal"
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
                        )}
                    >
                        Emendas Federais
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px]">
                        <label htmlFor="busca-emendas" className="sr-only">Buscar emendas</label>
                        <div className="relative flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                            <span className="material-symbols-outlined text-slate-400 mr-3" aria-hidden="true">search</span>
                            <input
                                id="busca-emendas"
                                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full"
                                placeholder="Buscar por objetivo, número ou autor..."
                                type="search"
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
                            <label htmlFor="filtro-setor" className="sr-only">Filtrar por setor</label>
                            <select
                                id="filtro-setor"
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] cursor-pointer"
                                value={selectedSector || ""}
                                onChange={(e) => setSelectedSector(e.target.value || null)}
                            >
                                <option value="">Todos os Setores</option>
                                {availableSectors.map(sector => (
                                    <option key={sector} value={sector}>{sector}</option>
                                ))}
                            </select>
                        </div>

                        {/* Agrupamento de Status */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="filtro-status" className="sr-only">Filtrar por status</label>
                            <select
                                id="filtro-status"
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
                                <option value="Prestação de Contas">Prestação de Contas</option>
                                <option value="Cancelada">Cancelada</option>
                            </select>
                        </div>
                        {/* Agrupamento de Autor */}
                        <div className="flex items-center gap-2">
                            <label htmlFor="filtro-autor" className="sr-only">Filtrar por autor</label>
                            <select
                                id="filtro-autor"
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] cursor-pointer"
                                value={selectedResponsible || ""}
                                onChange={(e) => setSelectedResponsible(e.target.value || null)}
                            >
                                <option value="">Todos os Autores</option>
                                {availableResponsibles.map(author => (
                                    <option key={author} value={author}>{author}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-px h-8 bg-slate-200 mx-1"></div>

                        {/* Clear filters */}
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedSector(null);
                                setSelectedStatus(null);
                                setSelectedResponsible(null);
                                setSelectedAmbito(null);
                            }}
                            aria-label="Limpar todos os filtros"
                            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                            <span className="material-symbols-outlined block" aria-hidden="true">filter_list_off</span>
                        </button>

                        {/* Export to Excel */}
                        <button
                            onClick={() => {
                                const filteredIds = new Set(filteredProjects.map(p => p.id));
                                const filtered = rawAmendments.filter(a => filteredIds.has(a.id));
                                exportToExcel(filtered);
                            }}
                            disabled={filteredProjects.length === 0}
                            aria-label={`Exportar ${filteredProjects.length} emenda${filteredProjects.length !== 1 ? "s" : ""} para planilha Excel`}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-40 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">download</span>
                            Exportar
                        </button>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center justify-between mb-8">
                    <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-500 font-medium">
                        {filteredProjects.length} {filteredProjects.length === 1 ? "emenda encontrada" : "emendas encontradas"}
                    </p>

                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setViewMode("individual")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                viewMode === "individual" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <span className="material-symbols-outlined text-sm">grid_view</span>
                            Individual
                        </button>
                        <button
                            onClick={() => setViewMode("grouped")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                viewMode === "grouped" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <span className="material-symbols-outlined text-sm">group_work</span>
                            Por Objetivo
                        </button>
                    </div>
                </div>

                {/* Grid of Cards */}
                {paginatedProjects.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-4 block">search_off</span>
                        <p className="text-lg font-semibold">Nenhuma emenda encontrada</p>
                        <p className="text-sm mt-1">Tente ajustar os filtros ou o termo de busca.</p>
                    </div>
                ) : viewMode === "grouped" ? (
                    <GroupedAmendments 
                        amendments={rawAmendments.filter(a => 
                          filteredProjects.some(fp => fp.id === a.id)
                        )} 
                        initialLimit={10}
                    />
                ) : (
                    <ul aria-label="Lista de emendas parlamentares" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 list-none p-0">
                        {paginatedProjects.map((project, index) => {
                            const style = getStatusStyle(project.status);
                            const sc = getSectorColor(project.sector);

                            return (
                                <li 
                                    key={project.id} 
                                    className="staggered-item"
                                    style={{ "--index": index % 20 } as any}
                                >
                                    <Link
                                        href={`/projetos/${project.id}`}
                                        aria-label={`${project.title} — ${project.status} — ${project.budget} — Autor: ${project.responsible}`}
                                        className="no-underline block h-full"
                                    >
                                        <div className="emenda-card bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 h-[356px] w-[396px] flex flex-col overflow-hidden mx-auto">
                                            {/* 1. Badges */}
                                            <div className="flex justify-between items-start mb-5 h-7">
                                                <div className="flex flex-wrap gap-2" aria-hidden="true">
                                                    <span className={`px-2.5 py-1 ${style.bg} rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                                                        {project.status}
                                                    </span>
                                                    <span className={`px-2.5 py-1 ${sc.badgeBg} ${sc.badgeText} rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                                                        {project.sector}
                                                    </span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-300 text-xl" aria-hidden="true">bookmark</span>
                                            </div>

                                            {/* 2. Title */}
                                            <div className="h-14 mb-4">
                                                <h2 className="text-xl font-bold leading-tight line-clamp-2 text-slate-900" aria-hidden="true">
                                                    {project.title}
                                                </h2>
                                            </div>

                                            {/* 3. Author */}
                                            <div className="flex items-center gap-3 mb-5" aria-hidden="true">
                                                {project.responsiblePhoto ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={project.responsiblePhoto}
                                                        alt=""
                                                        className="size-9 rounded-full object-cover border border-slate-100"
                                                        style={project.responsible && project.responsible.toLowerCase().includes("fiorilo") ? { objectPosition: "center 15%" } : undefined}
                                                    />
                                                ) : (
                                                    <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] ring-1 ring-slate-100">
                                                        {getInitials(project.responsible || "PM")}
                                                    </div>
                                                )}
                                                <div className="overflow-hidden">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Autor</p>
                                                    <p className="text-sm font-bold text-slate-800 leading-none truncate">{project.responsible}</p>
                                                </div>
                                            </div>

                                            {/* 4. Value */}
                                            <div className="mb-auto" aria-hidden="true">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Alocado</p>
                                                <p className="text-2xl font-black text-blue-600 tracking-tight">{project.budget}</p>
                                            </div>

                                            {/* 5. Progress */}
                                            <div className="space-y-2 mt-4">
                                                <div className="flex justify-between items-center" aria-hidden="true">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso de Execução</span>
                                                    <span className="text-[10px] font-bold text-blue-500">{project.progress}%</span>
                                                </div>
                                                <div
                                                    role="progressbar"
                                                    aria-valuenow={project.progress}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden"
                                                >
                                                    <div
                                                        className={`h-full ${style.bar} rounded-full transition-all duration-700`}
                                                        style={{ width: `${project.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* Pagination */}
                {viewMode === "individual" && totalPages > 1 && (
                    <nav aria-label="Paginação das emendas" className="mt-12 flex justify-center items-center gap-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            aria-label="Página anterior"
                            className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                            <span className="material-symbols-outlined block" aria-hidden="true">chevron_left</span>
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
                                        aria-label={`Ir para página ${pageNum}`}
                                        aria-current={currentPage === pageNum ? "page" : undefined}
                                        className={`size-10 rounded-lg font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${currentPage === pageNum
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
                                    <span className="mx-2 text-slate-400" aria-hidden="true">...</span>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        aria-label={`Ir para última página, ${totalPages}`}
                                        className="size-10 rounded-lg border border-slate-200 font-bold hover:bg-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Próxima página"
                            className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                            <span className="material-symbols-outlined block" aria-hidden="true">chevron_right</span>
                        </button>
                    </nav>
                )}
            </main>

            {/* Footer */}
            <footer aria-label="Rodapé do Portal das Emendas" className="mt-auto bg-white border-t border-slate-200 py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brasao.png" alt="Brasão de Osasco" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-slate-400">Portal das Emendas - Prefeitura Municipal de Osasco © 2026</span>
                    </div>
                    <nav aria-label="Links do rodapé" className="flex gap-8">
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded" href="https://transparencia.osasco.sp.gov.br/#/dados_abertos" target="_blank" rel="noopener noreferrer" aria-label="Dados Abertos (abre em nova aba)">Dados Abertos</a>
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded" href="https://transparencia.osasco.sp.gov.br" target="_blank" rel="noopener noreferrer" aria-label="Portal de Transparência (abre em nova aba)">Transparência</a>
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded" href="https://www.osasco.sp.gov.br/faleconosco" target="_blank" rel="noopener noreferrer" aria-label="Contato com a Prefeitura (abre em nova aba)">Contato</a>
                    </nav>
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
