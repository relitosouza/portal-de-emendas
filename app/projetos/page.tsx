"use client";

import Link from "next/link";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Amendment } from "@/lib/store";
import Navbar from "@/components/shared/navbar";

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
}

function ProjectsContent() {
    const searchParams = useSearchParams();
    const initialSector = searchParams.get("sector");
    const initialSearch = searchParams.get("search");

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState(initialSearch || "");
    const [selectedSector, setSelectedSector] = useState<string | null>(initialSector);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [showStalledOnly, setShowStalledOnly] = useState(false);

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

                // Exclude pending amendments — they are not yet published by the prefeitura
                amendments = amendments.filter(a => a.status !== "pendente");

                // Map Amendment to Project for UI compatibility
                const mappedProjects: Project[] = amendments.map(a => {
                    // Infer sector from responsible/description/title
                    const text = ((a.orgaoBeneficiario || a.responsible || "") + (a.objeto || a.title || "") + (a.finalidade || a.description || "")).toLowerCase();
                    let sector = "Infraestrutura"; // Default
                    if (text.includes("saude") || text.includes("saúde") || text.includes("hospital") || text.includes("ubs")) sector = "Saúde";
                    else if (text.includes("educação") || text.includes("escola") || text.includes("creche")) sector = "Educação";
                    else if (text.includes("segurança") || text.includes("policia") || text.includes("guarda")) sector = "Segurança";
                    else if (text.includes("cultura") || text.includes("teatro") || text.includes("show")) sector = "Cultura";

                    // Map status
                    let status = "Planejamento";
                    let progress = 0;
                    if (a.status === "em_execucao") { status = "Em andamento"; progress = 45; }
                    else if (a.status === "concluido") { status = "Concluído"; progress = 100; }
                    else if (a.status === "suspenso") { status = "Parado"; progress = 15; }
                    else if (a.status === "aprovado") { status = "Licitação"; progress = 10; }

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
                        responsible: (a.autor || a.author) ? `${a.autor || a.author} (Parlamentar)` : (a.orgaoBeneficiario || a.responsible || "Prefeitura")
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

    // Filter Logic
    const filteredProjects = projects.filter((project) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            project.title.toLowerCase().includes(term) ||
            project.description.toLowerCase().includes(term) ||
            (project.responsible || "").toLowerCase().includes(term) ||
            project.sector.toLowerCase().includes(term) ||
            project.location.toLowerCase().includes(term) ||
            project.id.includes(searchTerm);
        const matchesSector = selectedSector ? project.sector === selectedSector : true;

        const matchesStatus = selectedStatus
            ? (selectedStatus === "Em Execução" ? project.status === "Em andamento" :
                selectedStatus === "Paralisado" ? project.status === "Parado" :
                    selectedStatus === "Concluído" ? project.status === "Concluído" :
                        project.status === selectedStatus)
            : true;

        const matchesStalled = showStalledOnly ? project.status === "Parado" || project.status === "Atenção" : true;

        return matchesSearch && matchesSector && matchesStatus && matchesStalled;
    });

    if (loading) return <div className="flex h-screen items-center justify-center">Carregando emendas...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-800">
            <Navbar />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters */}
                <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200 bg-white">
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        <div>
                            <h2 className="font-heading text-lg font-bold mb-1 text-slate-900">Filtros</h2>
                            <p className="text-xs text-slate-500">Explore as emendas e investimentos.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Status Filter */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Status do Projeto</h3>
                                <div className="space-y-1">
                                    {[
                                        { label: "Em Execução", value: "Em Execução" },
                                        { label: "Paralisado", value: "Paralisado" },
                                        { label: "Concluído", value: "Concluído" }
                                    ].map((status) => (
                                        <label key={status.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                                                checked={selectedStatus === status.value}
                                                onChange={() => setSelectedStatus(selectedStatus === status.value ? null : status.value)}
                                            />
                                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{status.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Sector Filter */}
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Secretaria / Setor</h3>
                                <div className="flex flex-wrap gap-2">
                                    {["Saúde", "Educação", "Infraestrutura", "Segurança", "Cultura"].map((sector) => (
                                        <button
                                            key={sector}
                                            onClick={() => setSelectedSector(selectedSector === sector ? null : sector)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedSector === sector
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-transparent text-slate-600 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                                                }`}
                                        >
                                            {sector}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stalled Alert Filter */}
                            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-rose-700 uppercase tracking-tighter">Apenas Atrasos</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={showStalledOnly}
                                            onChange={(e) => setShowStalledOnly(e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                    </label>
                                </div>
                                <p className="text-[11px] text-rose-600 leading-relaxed">
                                    Filtre projetos com inconsistências entre repasse e progresso.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-slate-100 space-y-3">
                        <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600">
                                <span className="material-symbols-outlined text-[16px]">tune</span>
                                Ordenar
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600">
                                <span className="material-symbols-outlined text-[16px]">download</span>
                                Exportar
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedSector(null);
                                setSelectedStatus(null);
                                setShowStalledOnly(false);
                            }}
                            className="w-full py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors uppercase tracking-wider"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-1 overflow-y-auto bg-slate-50/50 relative">
                    <div className="p-6 lg:p-8 space-y-6">
                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">search</span>
                                <input
                                    type="text"
                                    placeholder="Pesquisar emendas, bairros ou parlamentares..."
                                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <p className="mt-2 text-center font-mono text-xs text-slate-400 uppercase tracking-widest">{filteredProjects.length} resultados encontrados</p>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {filteredProjects.map((project) => {
                                // Style Logic
                                let tagClass = "bg-slate-500/10 text-slate-700 border border-slate-500/20";
                                let dotClass = "bg-slate-400";
                                let statusText: string = project.status;
                                let progressColor = "bg-slate-300";
                                let progressText = "text-slate-400";

                                if (project.status === "Em andamento") {
                                    tagClass = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20";
                                    dotClass = "bg-emerald-500";
                                    statusText = "Em Execução";
                                    progressColor = "bg-emerald-500";
                                    progressText = "text-emerald-600";
                                } else if (project.status === "Parado") {
                                    tagClass = "bg-rose-500/10 text-rose-700 border border-rose-500/20";
                                    dotClass = "bg-rose-500 animate-pulse";
                                    statusText = "Obra Paralisada";
                                    progressColor = "bg-rose-500";
                                    progressText = "text-rose-600";
                                } else if (project.status === "Atenção") {
                                    tagClass = "bg-amber-500/10 text-amber-700 border border-amber-500/20";
                                    dotClass = "bg-amber-500";
                                    statusText = "Atenção Especial";
                                    progressColor = "bg-amber-400";
                                    progressText = "text-amber-600";
                                } else if (project.status === "Concluído") {
                                    tagClass = "bg-slate-100 text-slate-600 border border-slate-200";
                                    dotClass = "hidden";
                                    statusText = "Obra Entregue";
                                    progressColor = "bg-emerald-500";
                                    progressText = "text-emerald-600";
                                } else if (project.status === "Licitação") {
                                    tagClass = "bg-slate-500/10 text-slate-700 border border-slate-500/20";
                                    dotClass = "bg-slate-400";
                                    statusText = "Fase de Licitação";
                                    progressColor = "bg-slate-300";
                                    progressText = "text-slate-400";
                                }

                                return (
                                    <Link href={`/projetos/${project.id}`} key={project.id} className="cursor-pointer">
                                        <article className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${tagClass}`}>
                                                    {project.status === "Concluído" ? (
                                                        <span className="material-symbols-outlined text-[14px]">task_alt</span>
                                                    ) : (
                                                        <span className={`size-1.5 rounded-full ${dotClass}`}></span>
                                                    )}
                                                    {statusText}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400" title={project.id}>ID #{project.id.substring(0, 8)}</span>
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-heading font-bold leading-tight group-hover:text-blue-600 transition-colors text-slate-800">
                                                        {project.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                                                        {project.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 py-3 border-y border-slate-50">
                                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        {project.sector === "Saúde" && <span className="material-symbols-outlined text-lg">medical_services</span>}
                                                        {project.sector === "Educação" && <span className="material-symbols-outlined text-lg">school</span>}
                                                        {project.sector === "Infraestrutura" && <span className="material-symbols-outlined text-lg">engineering</span>}
                                                        {project.sector === "Cultura" && <span className="material-symbols-outlined text-lg">theater_comedy</span>}
                                                        {project.sector === "Segurança" && <span className="material-symbols-outlined text-lg">local_police</span>}
                                                        {/* Default icon */}
                                                        {!["Saúde", "Educação", "Infraestrutura", "Segurança", "Cultura"].includes(project.sector) && <span className="material-symbols-outlined text-lg">work</span>}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Responsável</p>
                                                        <p className="text-xs font-semibold text-slate-700">{project.responsible || "Prefeitura Municipal"}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Valor Total</p>
                                                        <p className="font-mono text-base font-bold text-slate-900">{project.budget}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                                                            {project.status === "Concluído" ? "Status Final" : "Medição Física"}
                                                        </p>
                                                        <p className={`font-mono text-base font-bold ${progressText}`}>
                                                            {project.status === "Concluído" ? "100%" : `${project.progress}%`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-slate-50">
                                                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-tight">
                                                    <span>Progresso</span>
                                                    <span className={progressText}>
                                                        {project.status === "Concluído" ? "FINALIZADO" :
                                                            project.status === "Parado" ? "Gargalo Crítico" :
                                                                "Em Andamento"}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${progressColor}`}
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {filteredProjects.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                Nenhum projeto encontrado.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="font-mono text-xs text-slate-400">
                        © 2026 Portal das Emendas Osasco • Plataforma de Auditoria Participativa
                    </p>
                    <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <a href="#" className="transition-colors hover:text-blue-600">Transparência</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Termos</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function ProjetosPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
            <ProjectsContent />
        </Suspense>
    );
}
