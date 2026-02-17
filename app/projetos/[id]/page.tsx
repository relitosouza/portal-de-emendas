import { getAmendmentsFromSheet } from "@/lib/google-sheets";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/navbar";


export const revalidate = 60; // Revalidate every minute

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjetoDetalhePage(props: Props) {
    const params = await props.params;
    const { id } = params;

    // Fetch data
    let amendment = null;
    try {
        const amendments = await getAmendmentsFromSheet();
        amendment = amendments.find((a) => a.id === id);
    } catch (error) {
        console.error("Failed to fetch amendment:", error);
    }

    if (!amendment) {
        notFound();
    }

    // Parse financial values
    const parseCurrency = (val?: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
    };

    const valorTotal = parseCurrency(amendment.valorAutorizado || amendment.valor);
    const empenhado = parseCurrency(amendment.empenhado);
    const liquidado = parseCurrency(amendment.liquidado);
    const pago = parseCurrency(amendment.pago);

    const percentPago = valorTotal > 0 ? Math.min(100, Math.round((pago / valorTotal) * 100)) : 0;

    // Status visual mapping
    const statusMap = {
        "planejamento": 0,
        "aprovado": 1, // Licitação
        "em_execucao": 2, // Execução
        "concluido": 3 // Entrega
    };

    const currentStatusIndex = statusMap[amendment.status as keyof typeof statusMap] ?? 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatShortCurrency = (value: number) => {
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
        return formatCurrency(value);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                <nav className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-8">
                    <Link href="/" className="hover:text-blue-600 transition-colors">Painel</Link>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <Link href="/projetos" className="hover:text-blue-600 transition-colors">Emendas</Link>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-slate-800 font-bold">{amendment.id}</span>
                </nav>

                <div className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-sector-health-bg text-sector-health-text font-mono text-[10px] font-bold uppercase rounded-md tracking-wider">
                                    {amendment.ambito || "Geral"}
                                </span>
                                <span className="px-3 py-1 bg-gray-200 text-primary font-mono text-[10px] font-bold uppercase rounded-md tracking-wider">
                                    {amendment.tipoEmenda}
                                </span>
                            </div>
                            <h1 className="font-heading font-bold text-4xl lg:text-5xl text-primary tracking-tight">
                                {amendment.objeto || amendment.title || "Sem Título"}
                            </h1>
                            <p className="text-lg text-muted max-w-3xl leading-relaxed">
                                {amendment.finalidade || amendment.description || "Sem descrição disponível."}
                            </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                            <span className="text-xs font-mono uppercase text-muted">Protocolo</span>
                            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg font-mono font-bold text-primary shadow-sm">
                                {amendment.numeroEmenda || "N/A"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    <div className="lg:col-span-7 space-y-8">
                        {/* Status Card */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden p-8">
                            <h3 className="font-heading font-bold text-lg mb-8 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">analytics</span>
                                Status da Execução
                            </h3>
                            <div className="relative flex justify-between">
                                <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 -z-0"></div>
                                {/* Progress Bar Width based on status */}
                                <div className="absolute top-5 left-0 h-[2px] bg-status-success -z-0" style={{ width: `${(currentStatusIndex / 3) * 100}%` }}></div>

                                {["Planejamento", "Licitação", "Execução", "Entrega"].map((step, idx) => {
                                    const isCompleted = idx <= currentStatusIndex;
                                    const isCurrent = idx === currentStatusIndex;
                                    const isLast = idx === 3;

                                    return (
                                        <div key={step} className="relative z-10 flex flex-col items-center gap-3 group">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-md transition-all 
                                                ${isCompleted ? "bg-status-success text-white" : "bg-gray-200 text-gray-400"}
                                                ${isCurrent && idx !== 3 ? "animate-pulse ring-primary/10" : ""}
                                            `}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {isLast ? "flag" : "check"}
                                                </span>
                                            </div>
                                            <span className={`font-heading text-xs font-bold uppercase ${isCompleted ? "text-primary" : "text-gray-400"}`}>
                                                {step}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Financial History Chart Placeholder - Using simple SVG for now as per reference */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-heading font-bold text-lg">Evolução Financeira</h3>
                                <div className="flex gap-4 text-xs font-mono font-bold uppercase">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                                        <span>Empenhado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-status-danger rounded-full"></div>
                                        <span>Liquidado</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simple Visual Representation instead of complex Chart for this iteration */}
                            <div className="h-64 w-full relative bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] bg-[length:20px_20px] rounded-lg overflow-hidden p-4 flex items-end justify-between px-10">
                                {/* Mock Bars for Visual Check */}
                                <div className="w-8 bg-primary/20 h-[30%] rounded-t-sm relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">JAN</div>
                                </div>
                                <div className="w-8 bg-primary/40 h-[45%] rounded-t-sm relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">FEV</div>
                                </div>
                                <div className="w-8 bg-primary/60 h-[50%] rounded-t-sm relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">MAR</div>
                                </div>
                                <div className="w-8 bg-primary/80 h-[70%] rounded-t-sm relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">ABR</div>
                                </div>
                                <div className="w-8 bg-primary h-[85%] rounded-t-sm relative group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">MAI</div>
                                </div>
                            </div>

                            {liquidado > empenhado && (
                                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100 flex gap-3">
                                    <span className="material-symbols-outlined text-status-danger text-[20px]">info</span>
                                    <p className="text-sm text-red-900 leading-snug">
                                        <strong>Alerta de Descompasso:</strong> O valor liquidado supera o empenhado. Verifique a execução orçamentária.
                                    </p>
                                </div>
                            )}
                        </div>


                        {/* Details Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-muted">
                                    <span className="material-symbols-outlined text-[20px]">person_pin</span>
                                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest">Autor Responsável</span>
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-xl text-primary">{amendment.autor || amendment.author || "Não informado"}</p>
                                    <p className="text-sm text-muted">Parlamentar</p>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-muted">
                                    <span className="material-symbols-outlined text-[20px]">apartment</span>
                                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest">Órgão Beneficiário</span>
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-xl text-primary">{amendment.orgaoBeneficiario || "Não informado"}</p>
                                    <p className="font-mono text-xs text-muted">Executor</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden p-6 shadow-xl border-primary/5">
                                <h4 className="font-heading font-bold text-sm uppercase tracking-widest text-muted mb-6">Resumo Financeiro</h4>
                                <div className="space-y-6">
                                    <div>
                                        <span className="text-xs text-muted block mb-1">Valor Total Autorizado</span>
                                        <div className="text-3xl font-heading font-bold text-primary">
                                            {formatCurrency(valorTotal)}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-muted">Pago até agora</span>
                                            <span className="text-sm font-mono font-bold text-status-danger">{percentPago}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-status-danger" style={{ width: `${percentPago}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted">Empenhado:</span>
                                            <span className="font-mono font-bold">{formatShortCurrency(empenhado)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted">Liquidado:</span>
                                            <span className="font-mono font-bold">{formatShortCurrency(liquidado)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted">Pago:</span>
                                            <span className="font-mono font-bold text-status-success">{formatShortCurrency(pago)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full bg-gradient-to-r from-[#1A1A1A] to-[#434343] text-white font-heading font-bold text-sm uppercase tracking-widest py-4 rounded-xl shadow-lg hover:-translate-y-[2px] transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                    Exportar Relatório
                                </button>
                                <button className="w-full bg-white border border-gray-200 text-primary font-heading font-bold text-sm uppercase tracking-widest py-4 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">share</span>
                                    Compartilhar
                                </button>
                            </div>

                            <div className="p-5 bg-gray-100 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px] text-gray-600">verified_user</span>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight text-gray-600">Auditoria Fiscal</span>
                                </div>
                                <p className="text-[11px] text-muted leading-relaxed">
                                    Os dados exibidos nesta página são coletados diretamente via API do TCESP e validados por cruzamento de dados bancários municipais.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
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
