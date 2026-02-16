"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/lib/data";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const project = projects.find((p) => p.id === id);

    if (!project) {
        notFound();
    }

    // Colors mapping based on sector/status
    const getSectorColors = (sector: string) => {
        switch (sector) {
            case "Saúde": return { bg: "bg-blue-50", text: "text-blue-700" };
            case "Infraestrutura": return { bg: "bg-teal-50", text: "text-teal-700" };
            case "Educação": return { bg: "bg-amber-50", text: "text-amber-700" };
            default: return { bg: "bg-gray-50", text: "text-gray-700" };
        }
    };

    const sectorColors = getSectorColors(project.sector);
    const isStalled = project.status === "Parado" || project.status === "Atenção";
    const statusColor = isStalled ? "text-red-600" : (project.status === "Concluído" ? "text-emerald-600" : "text-slate-900");
    const progressBarColor = isStalled ? "bg-red-600" : (project.status === "Concluído" ? "bg-emerald-500" : "bg-slate-900");

    return (
        <div className="bg-[#F8F9FA] min-h-screen text-slate-800 font-sans flex flex-col">
            {/* Header (Breadcrumbs + Title) */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-4">
                        <Link href="/" className="hover:text-slate-900 transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <Link href="/projetos" className="hover:text-slate-900 transition-colors">Projetos</Link>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-blue-600 font-bold">ID-{project.id}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 ${sectorColors.bg} ${sectorColors.text} font-mono text-[10px] font-bold uppercase rounded-md tracking-wider`}>
                                    {project.sector}
                                </span>
                                <span className="px-3 py-1 bg-gray-200 text-slate-800 font-mono text-[10px] font-bold uppercase rounded-md tracking-wider">
                                    Emenda Impositiva
                                </span>
                            </div>
                            <h1 className="font-heading font-bold text-3xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
                                {project.title}
                            </h1>
                            <p className="text-lg text-slate-500 max-w-3xl leading-relaxed">
                                {project.description}
                            </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                            <span className="text-xs font-mono uppercase text-slate-400">Protocolo de Auditoria</span>
                            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg font-mono font-bold text-slate-800 shadow-sm">
                                TCESP-{project.id}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 flex-1 w-full">
                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

                    {/* Left Column (Main Stats & Visuals) */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Status Tracker */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-[12px] p-8 overflow-hidden">
                            <h3 className="font-heading font-bold text-lg mb-8 flex items-center gap-2 text-slate-800">
                                <span className="material-symbols-outlined text-blue-600">analytics</span>
                                Status da Execução
                            </h3>
                            <div className="relative flex justify-between">
                                {/* Connector Lines */}
                                <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 -z-0"></div>
                                {/* Active Progress Line - Simplified logic */}
                                <div className={`absolute top-5 left-0 h-[2px] ${progressBarColor} -z-0`} style={{ width: `${project.progress}%` }}></div>

                                {/* Steps */}
                                {["Planejamento", "Licitação", "Em andamento", "Concluído"].map((step, index) => {
                                    // Map data status to steps
                                    const steps = ["Planejamento", "Licitação", "Em andamento", "Concluído"];
                                    const currentStatusIndex = steps.indexOf(project.status === "Atenção" || project.status === "Parado" ? "Em andamento" : project.status);
                                    const stepIndex = index;

                                    const isPast = stepIndex <= currentStatusIndex;
                                    const isCurrent = stepIndex === currentStatusIndex;

                                    // Visual Label Mapping
                                    const label = step === "Em andamento" ? "Execução" : (step === "Concluído" ? "Entrega" : step);

                                    // Custom visual logic
                                    let circleColor = isPast ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500";

                                    if (isCurrent && isStalled && step === "Em andamento") {
                                        circleColor = "bg-red-500 text-white animate-pulse";
                                    } else if (isCurrent && project.status === "Atenção") {
                                        circleColor = "bg-amber-500 text-white";
                                    } else if (!isPast) {
                                        circleColor = "bg-gray-200 text-gray-400";
                                    }

                                    return (
                                        <div key={step} className="relative z-10 flex flex-col items-center gap-3 group">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-md transition-colors ${circleColor}`}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {step === "Planejamento" ? "flag" :
                                                        step === "Licitação" ? "gavel" :
                                                            step === "Em andamento" ? "construction" : "check_circle"}
                                                </span>
                                            </div>
                                            <span className={`font-heading text-xs font-bold uppercase ${isPast ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-[12px] p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-heading font-bold text-lg text-slate-800">Histórico de Evolução</h3>
                                <div className="flex gap-4 text-xs font-mono font-bold uppercase">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
                                        <span className="text-slate-600">Físico</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                        <span className="text-slate-600">Financeiro</span>
                                    </div>
                                </div>
                            </div>

                            {/* SVG Chart Mockup */}
                            <div className="h-64 w-full relative bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:20px_20px] rounded-lg overflow-hidden p-4">
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                                    {/* Financial Line (Red) */}
                                    <path
                                        d="M0,180 L200,150 L400,100 L600,60 L800,20 L1000,10"
                                        fill="none" stroke="#D93025" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"
                                        className="drop-shadow-sm opacity-80"
                                    ></path>
                                    {/* Physical Line (Black) */}
                                    <path
                                        d="M0,180 L200,175 L400,160 L600,150 L800,140 L1000,130"
                                        fill="none" stroke="#1A1A1A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"
                                        className="drop-shadow-sm"
                                    ></path>
                                    {/* Points at current date (mocked at 60% width) */}
                                    <circle cx="600" cy="60" r="4" fill="#D93025" stroke="white" strokeWidth="2"></circle>
                                    <circle cx="600" cy="150" r="4" fill="#1A1A1A" stroke="white" strokeWidth="2"></circle>
                                </svg>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-mono text-slate-400 uppercase">
                                    <span>Jan</span>
                                    <span>Fev</span>
                                    <span>Mar</span>
                                    <span>Abr</span>
                                    <span>Mai</span>
                                </div>
                            </div>

                            {/* Insight / Alert */}
                            {isStalled ? (
                                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100 flex gap-3">
                                    <span className="material-symbols-outlined text-red-600 text-[20px]">info</span>
                                    <p className="text-sm text-red-900 leading-snug">
                                        <strong>Alerta de Descompasso:</strong> A execução financeira superou a física. O desembolso atual não condiz com a entrega registrada em canteiro de obras.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                                    <span className="material-symbols-outlined text-blue-600 text-[20px]">check_circle</span>
                                    <p className="text-sm text-blue-900 leading-snug">
                                        <strong>Execução Normal:</strong> O cronograma físico-financeiro está dentro das margens esperadas para o período.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Entities Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-100 shadow-sm rounded-[12px] p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">person_pin</span>
                                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest">Autor Responsável</span>
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-xl text-slate-900">{project.responsible || "Prefeitura Municipal"}</p>
                                    <p className="text-sm text-slate-500">Partido Liberal Progressista (PLP)</p>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-[12px] p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">apartment</span>
                                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest">Empresa Executora</span>
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-xl text-slate-900">Construtora Vértice Ltda</p>
                                    <p className="font-mono text-xs text-slate-500">CNPJ: 12.345.678/0001-90</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery / Log */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-[12px] p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-heading font-bold text-lg text-slate-800">Diário de Obra</h3>
                                <div className="text-xs font-bold uppercase text-blue-600 hover:underline cursor-pointer">Ver todas</div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Mocks */}
                                {[
                                    { date: "12/03/26", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYw8UY9-rfOTPjZIMUwoWFUh6Gul6GDGtt7yPUJU1eJtHoHoZ7zP9hpRjGHTUCZKIV7p7SGqDwBNiQ2u8r3IOPeovivnZK0OThM3FyEmg1eW892RQH8lRWN_-Jtt7mtVUzUGeBNzaGqopLrpQw59ZD1dZqKThzCKr4wBMAdfHX9ivqV_EFyJ2jEQUDvF3714izklYaTuNFCzhBEqRC7YbWtQ_Nvp665_l14I2jQ2erLDv23Btj_v3UJfy_fqvZDP6bExzJcMy1Bb0" },
                                    { date: "05/03/26", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJ0HIxWOgYkTrBAnXVIr0KKkAmDCR8rrbuw86xAQhAobaZPZ02u3G07Og1KJmnCOBScgbyyKItnsqI-OHxdmgufC9IGkb9Jjp9AqtSk9k6gwkwUKZaPyu3hzCeEOaeq8l3riyleCoqwEIY81FM2vVKY0L7D2LBAxct7NMAxmKx8EvBlXfcgIu56dSAGfrVjox6ouT8bbALVlihrBGoWFmkP3XzJk3zoX6SnMhjDe0L4qvPzzeompjcPuvWOi2_Sxv_CuE46G-Spu8" },
                                    { date: "22/02/26", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuActDII4nsl9NLPrE5Sl5CgpWtamZTRvHEgYXLaVIqju72DaJcnthneDA3mPlDx2ELzWhfL7gLTTRhBtwPfdUG0WCvPCgmds4Dsqs_EK7TKWHajWImi5gYncTnowEXjVxg2qm8E6iFLdmMsDByYzKRm72krRuEaF4P0hHvwylyOgfOCPAsMEJ1Zwjk_5ke4_X8A_oxGr-8BA8CRLqZg7NfzRse4lyZwHQlfWjy0eFGHDGFV6f_y1flIYktQ5IQ2DapMgiVjyN2z6ok" },
                                    { date: "10/02/26", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyb6zdc0KpZ6j3y9k69IV-H3C1HjoRWy5PCR6h58XVBKCUzTQVYgcuiPhF8_KTM6bx0meWptk7TNpETUJXd1bJxIYuds1li4JYYeMgLAuqc4dWS_8CWEATL5pXqfg3DitY-0Qfia8RUvynWtREvQKpA5Ev23WTupbyQEEhmpdk7o_hr9gxDjfG1NjVJ7zz3AfHOUQvqAIAng8HSINss6oJ6eaOAOQToigUMlEQ65s704GkeeCr8dcrQXFPsqWsqotsEQfg72Ngons" }
                                ].map((item, i) => (
                                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-slate-100">
                                        <img src={item.img} alt="Obra" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <span className="absolute bottom-2 left-2 bg-black/60 text-[9px] text-white px-2 py-1 rounded font-mono border border-white/20">{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 space-y-6">

                            {/* Finance Summary */}
                            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-[12px] p-6">
                                <h4 className="font-heading font-bold text-sm uppercase tracking-widest text-slate-400 mb-6">Resumo Financeiro</h4>
                                <div className="space-y-6">
                                    <div>
                                        <span className="text-xs text-slate-500 block mb-1">Valor Total Autorizado</span>
                                        <div className="text-3xl font-heading font-bold text-slate-900">{project.budget}</div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-slate-500">Pago até agora</span>
                                            <span className={`text-sm font-mono font-bold ${isStalled ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {Math.min(project.progress + 20, 100)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${isStalled ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(project.progress + 20, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-100 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Empenhado:</span>
                                            <span className="font-mono font-bold text-slate-700">R$ --</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Liquidado:</span>
                                            <span className="font-mono font-bold text-slate-700">R$ --</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Saldo em Conta:</span>
                                            <span className="font-mono font-bold text-emerald-600">R$ --</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-sm uppercase tracking-widest py-4 rounded-[12px] shadow-lg hover:-translate-y-[2px] transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                    Exportar Relatório
                                </button>
                                <button className="w-full bg-white border border-gray-200 text-slate-800 font-heading font-bold text-sm uppercase tracking-widest py-4 rounded-[12px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">share</span>
                                    Compartilhar
                                </button>
                                <button className="w-full bg-red-50 text-red-600 border border-red-100 font-heading font-bold text-sm uppercase tracking-widest py-4 rounded-[12px] hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">report</span>
                                    Denunciar Obra
                                </button>
                            </div>

                            {/* Disclaimer */}
                            <div className="p-5 bg-gray-100 rounded-[12px] border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px] text-gray-600">verified_user</span>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight text-gray-600">Auditoria Fiscal</span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Os dados exibidos nesta página são coletados diretamente via API do TCESP e validados por cruzamento de dados bancários municipais.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-primary text-white py-16 mt-0">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-2 space-y-6">
                        <h2 className="font-heading font-bold text-2xl tracking-tighter">PORTAL DAS EMENDAS OSASCO</h2>
                        <p className="text-gray-400 max-w-sm font-sans">
                            Plataforma independente de fiscalização de recursos públicos. Transformamos dados complexos em transparência radical para todo cidadão.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h5 className="font-heading font-bold text-sm uppercase tracking-widest">Navegação</h5>
                        <ul className="text-gray-400 space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-white">Explorar Emendas</Link></li>
                            <li><Link href="#" className="hover:text-white">Ranking de Municípios</Link></li>
                            <li><Link href="#" className="hover:text-white">API para Desenvolvedores</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="font-heading font-bold text-sm uppercase tracking-widest">Legal</h5>
                        <ul className="text-gray-400 space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-white">Termos de Uso</Link></li>
                            <li><Link href="#" className="hover:text-white">Privacidade</Link></li>
                            <li><Link href="#" className="hover:text-white">LGPD</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                    <span>© 2026 Portal das Emendas Osasco - Transparência Governamental</span>
                    <span>Versão 2.4.0 (Stable)</span>
                </div>
            </footer>
        </div>
    );
}
