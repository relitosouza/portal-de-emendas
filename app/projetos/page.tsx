"use client";

import Link from "next/link";
import { projects } from "@/lib/data";
import { useState } from "react";

export default function ProjetosPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [showStalledOnly, setShowStalledOnly] = useState(false);

    // Filter Logic
    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.id.includes(searchTerm);
        const matchesSector = selectedSector ? project.sector === selectedSector : true;
        // In the new layout, status buttons are explicit filters. Status in data: "Em andamento", "Concluído", "Parado", "Atenção", "Licitação"
        // UI Checkboxes: "Em Execução" (Em andamento), "Paralisado" (Parado), "Concluído"
        // Let's map strict UI filters to data statuses.
        const matchesStatus = selectedStatus
            ? (selectedStatus === "Em Execução" ? project.status === "Em andamento" :
                selectedStatus === "Paralisado" ? project.status === "Parado" :
                    selectedStatus === "Concluído" ? project.status === "Concluído" :
                        project.status === selectedStatus) // Fallback for direct matches
            : true;

        const matchesStalled = showStalledOnly ? project.status === "Parado" || project.status === "Atenção" : true;

        return matchesSearch && matchesSector && matchesStatus && matchesStalled;
    });

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header (Project List Context) */}
            {/* Note: The user requested layout has a Header inside the page structure or global? 
               Looking at provided HTML, it has a Global Header. Since we have a RootLayout, we might have duplication if I put the global header here.
               However, the user's HTML replaces the whole "Projetos" page content.
               I will implement the Sidebar + Main Content structure here, assuming the RootHeader is either separate or I should hide it.
               The previous implementation had a RootLayout. I should probably ONLY implement the <main> part if RootLayout is persistent.
               But the user provided a full HTML with <body>.
               I'll implement the layout *within* the page for now, but I might need to check if RootLayout allows it.
               The Sidebar is specific to this page in the HTML.
            */}

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-80px)]">
                {/* Sidebar Filters */}
                <aside className="hidden lg:flex w-80 flex-col border-r border-slate-200 bg-white">
                    <div className="p-8 space-y-8 overflow-y-auto">
                        <div>
                            <h2 className="font-heading text-xl font-bold mb-2 text-slate-900">Filtros</h2>
                            <p className="text-sm text-slate-500">Explore as emendas e investimentos do seu município.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Status Filter */}
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Status do Projeto</h3>
                                <div className="space-y-2">
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
                            <div className="space-y-4">
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
                                    Filtre projetos que possuem inconsistências entre repasse financeiro e progresso físico.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto p-8 border-t border-slate-100">
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedSector(null);
                                setSelectedStatus(null);
                                setShowStalledOnly(false);
                            }}
                            className="w-full py-3 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors uppercase tracking-wider"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-1 overflow-y-auto bg-slate-50/50 relative">
                    {/* Sticky Header */}
                    <div className="p-8 bg-white border-b border-slate-200 flex flex-col md:flex-row gap-6 items-center justify-between sticky top-0 z-10 shadow-sm">
                        <div className="relative w-full max-w-xl">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900/20 transition-all text-sm outline-none"
                                placeholder="Pesquisar por obra, ID ou parlamentar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{filteredProjects.length} Resultados</span>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600">
                                <span className="material-symbols-outlined text-lg">tune</span>
                                ORDENAR
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600">
                                <span className="material-symbols-outlined text-lg">download</span>
                                EXPORTAR
                            </button>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="p-8 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
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
                                <Link href={`/projetos/${project.id}`} key={project.id}>
                                    <article className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative flex flex-col h-full cursor-pointer">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${tagClass}`}>
                                                {project.status === "Concluído" ? (
                                                    <span className="material-symbols-outlined text-[14px]">task_alt</span>
                                                ) : (
                                                    <span className={`size-1.5 rounded-full ${dotClass}`}></span>
                                                )}
                                                {statusText}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">ID #{project.id}</span>
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
                    <div className="p-8 flex items-center justify-between border-t border-slate-200 bg-white/50 backdrop-blur-md sticky bottom-0">
                        <p className="text-xs font-medium text-slate-500">Mostrando <strong>1 - {filteredProjects.length}</strong> de {filteredProjects.length} projetos</p>
                        <div className="flex gap-2">
                            <button className="size-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 disabled:opacity-30" disabled>
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="size-10 flex items-center justify-center bg-slate-900 text-white rounded-xl text-sm font-bold">1</button>
                            <button className="size-10 flex items-center justify-center border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">2</button>
                            <button className="size-10 flex items-center justify-center border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">3</button>
                            <button className="size-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
