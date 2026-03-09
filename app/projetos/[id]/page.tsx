import { getAmendmentsFromSheet } from "@/lib/json-storage";
import { getNormalizedStatus, getStatusStep } from "@/lib/status-mapper";
import { VEREADORES_PHOTOS, findVereadorPhoto, parseCurrency, formatCurrency } from "@/lib/amendments-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/navbar";
import ShareCard from "@/components/projects/share-card";
import TechnicalDetailsAccordion from "@/components/projects/technical-details-accordion";

export const revalidate = 60;


interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjetoDetalhePage(props: Props) {
    const params = await props.params;
    const { id } = params;

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

    const valorTotal = parseCurrency(amendment.valorAutorizado || amendment.valor);
    const reservado = parseCurrency(amendment.reservado);
    const empenhado = parseCurrency(amendment.empenhado);
    const liquidado = parseCurrency(amendment.liquidado);
    const pago = parseCurrency(amendment.pago);

    // Status tracker
    const statusSteps = [
        { label: "Não Iniciada", icon: "check" },
        { label: "Em Análise", icon: "check" },
        { label: "Elaboração", icon: "check" },
        { label: "Viabilização", icon: "check" },
        { label: "Contratação", icon: "check" },
        { label: "Execução", icon: "sync" },
        { label: "Executada", icon: "done_all" },
        { label: "Prestação de Contas", icon: "receipt_long" },
        { label: "Cancelada", icon: "block" },
    ];

    const normalizedStatus = getNormalizedStatus(amendment.status as string);
    const currentStep = getStatusStep(normalizedStatus);
    const progressPercent = currentStep <= 6 ? (Math.min(currentStep, 5) / 7) * 100 : 0;

    const autor = amendment.autor || amendment.author || amendment.responsavelNome || "Não informado";
    const autorPhoto = findVereadorPhoto(autor);
    const autorInitials = autor
        .split(" ")
        .filter(Boolean)
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const getStatusLabel = () => {
        if (currentStep === 6) return { label: "Executada", color: "bg-blue-50 border-blue-100 text-blue-600" };
        if (currentStep === 5) return { label: "Execução", color: "bg-emerald-50 border-emerald-100 text-emerald-600" };
        if (currentStep === 7) return { label: "Prestação de Contas", color: "bg-teal-50 border-teal-100 text-teal-600" };
        if (currentStep === 8) return { label: "Cancelada", color: "bg-red-50 border-red-100 text-red-600" };
        if (currentStep === 4) return { label: "Contratação", color: "bg-blue-50 border-blue-100 text-blue-600" };
        if (currentStep === 3) return { label: "Viabilização", color: "bg-purple-50 border-purple-100 text-purple-600" };
        if (currentStep === 2) return { label: "Elaboração", color: "bg-indigo-50 border-indigo-100 text-indigo-600" };
        if (currentStep === 1) return { label: "Em Análise", color: "bg-amber-50 border-amber-100 text-amber-600" };
        return { label: "Não Iniciada", color: "bg-slate-50 border-slate-200 text-slate-600" };
    };

    const statusInfo = getStatusLabel();

    return (
        <>
            {/* ========================================================= */}
            {/* ============ LAYOUT DE IMPRESSÃO (PDF/PAPEL) ============ */}
            {/* ========================================================= */}
            <div className="hidden print:block w-full max-w-[800px] mx-auto bg-white font-sans text-slate-800 p-8">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="size-16 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                            <img src="/brasao-osasco.png" alt="Logo" className="w-10 h-10 filter brightness-0 invert object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900">Prefeitura de Osasco</h1>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Portal de Transparência Municipal</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Emissão Oficial</p>
                        <p className="font-bold text-slate-900">{new Date().toLocaleDateString('pt-BR')}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Ref: {id.slice(0,12).toUpperCase()}</p>
                    </div>
                </div>

                {/* Título Central */}
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-slate-900">Relatório de Execução de Emenda</h2>
                    <div className="h-1 w-12 bg-blue-600 mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Identificação do Projeto */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Identificação do Projeto</h3>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Título da Emenda</p>
                                <p className="text-sm font-bold text-slate-800">{amendment.objeto || amendment.title || "-"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Autor da Emenda</p>
                                <p className="text-sm font-bold text-slate-800">{autor}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Valor Total Autorizado</p>
                                <p className="text-lg font-black text-blue-600">{formatCurrency(valorTotal)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cód. Identificador</p>
                                <p className="text-sm font-bold text-slate-800">{amendment.numeroEmenda || id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estágio de Execução */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Estágio de Execução</h3>
                    </div>
                    <div className="flex flex-col mb-4">
                        <div className="flex items-start justify-between relative px-8">
                            {/* Background Line */}
                            <div className="absolute top-4 left-16 right-16 h-[2px] bg-slate-100 z-0"></div>
                            
                            {/* Aprovação */}
                            <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`size-8 rounded-full flex items-center justify-center text-white ${currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-200 text-slate-400 border-2 border-slate-200'}`}>
                                    <span className="material-symbols-outlined text-[16px]">{currentStep >= 1 ? 'check' : 'pending'}</span>
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>Aprovação</p>
                                    {currentStep >= 1 && <p className="text-[10px] text-slate-400 mt-0.5">OK</p>}
                                </div>
                            </div>

                            {/* Empenho */}
                            <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`size-8 rounded-full flex items-center justify-center text-white ${empenhado > 0 || currentStep >= 4 ? 'bg-blue-600' : 'bg-slate-200 text-slate-400 border-2 border-slate-200'}`}>
                                    <span className="material-symbols-outlined text-[16px]">{empenhado > 0 || currentStep >= 4 ? 'check' : 'pending'}</span>
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${empenhado > 0 || currentStep >= 4 ? 'text-slate-800' : 'text-slate-400'}`}>Empenho</p>
                                </div>
                            </div>

                            {/* Em Execução */}
                            <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`size-8 rounded-full flex items-center justify-center text-white ${(liquidado > 0 || pago > 0) && currentStep < 6 ? 'bg-blue-600 ring-4 ring-blue-50' : (currentStep >= 6 ? 'bg-blue-600' : 'bg-slate-200 text-slate-400 border-2 border-slate-200')}`}>
                                    <span className="material-symbols-outlined text-[16px]">{currentStep >= 6 ? 'check' : 'sync'}</span>
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${pago > 0 || currentStep >= 5 ? 'text-blue-600' : 'text-slate-400'}`}>Em Execução</p>
                                    {pago > 0 && valorTotal > 0 && <p className="text-[10px] font-bold text-blue-500">{Math.round((pago/valorTotal)*100)}% concluído</p>}
                                </div>
                            </div>

                            {/* Conclusão */}
                            <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`size-8 rounded-full flex items-center justify-center text-white ${currentStep >= 6 ? 'bg-blue-600' : 'bg-slate-100 text-slate-300'}`}>
                                    <span className="material-symbols-outlined text-[16px]">done_all</span>
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${currentStep >= 6 ? 'text-slate-800' : 'text-slate-400'}`}>Conclusão</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cronograma Físico-Financeiro */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Cronograma Físico-Financeiro</h3>
                    </div>
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left" aria-label="Cronograma físico-financeiro da emenda">
                            <caption className="sr-only">Fases orçamentárias da emenda: reserva, empenho, liquidação e pagamento</caption>
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fase Orçamentária</th>
                                    <th scope="col" className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Situação</th>
                                    <th scope="col" className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Valor Consolidado (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                <tr>
                                    <th scope="row" className="px-6 py-4 font-bold text-slate-800">01. Reserva de Dotação</th>
                                    <td className="px-6 py-4">{reservado > 0 ? "Confirmado" : "Pendente / Em Lançamento"}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(reservado)}</td>
                                </tr>
                                <tr>
                                    <th scope="row" className="px-6 py-4 font-bold text-slate-800">02. Nota de Empenho</th>
                                    <td className="px-6 py-4">{empenhado > 0 ? "Confirmado" : "Aguardando Contratação"}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(empenhado)}</td>
                                </tr>
                                <tr>
                                    <th scope="row" className="px-6 py-4 font-bold text-slate-800">03. Liquidação Processada</th>
                                    <td className="px-6 py-4">{liquidado > 0 ? "Serviços Preenchidos" : "Aguardando Medição"}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(liquidado)}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-blue-50/50 border-t border-slate-200">
                                <tr>
                                    <td colSpan={2} className="px-6 py-5 text-right text-[10px] font-bold text-slate-700 uppercase tracking-widest">Total Pago Até a Data</td>
                                    <td className="px-6 py-5 text-right font-black text-blue-600 text-sm font-mono">{formatCurrency(pago)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Distribuição de Recursos Aplicados */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Distribuição de Recursos Aplicados</h3>
                    </div>
                    <div className="flex items-center gap-10 py-2 border-b border-slate-100 pb-12">
                        <div className="flex-1 space-y-6">
                            {/* Bar 1 */}
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-600">
                                    <span>Recurso Comprometido (Empenho)</span>
                                    <span className="text-blue-600">{valorTotal > 0 ? Math.round((empenhado/valorTotal)*100) : 0}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${valorTotal > 0 ? Math.min((empenhado/valorTotal)*100, 100) : 0}%` }}></div>
                                </div>
                            </div>
                            {/* Bar 2 */}
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-600">
                                    <span>Recurso Executado (Liquidação)</span>
                                    <span className="text-blue-600">{valorTotal > 0 ? Math.round((liquidado/valorTotal)*100) : 0}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${valorTotal > 0 ? Math.min((liquidado/valorTotal)*100, 100) : 0}%` }}></div>
                                </div>
                            </div>
                            {/* Bar 3 */}
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-600">
                                    <span>Recurso Transferido (Pagamento)</span>
                                    <span className="text-blue-600">{valorTotal > 0 ? Math.round((pago/valorTotal)*100) : 0}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${valorTotal > 0 ? Math.min((pago/valorTotal)*100, 100) : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="w-[180px] shrink-0 flex flex-col items-center">
                            <div className="size-36 rounded-full border-8 border-blue-600 flex flex-col items-center justify-center mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Atual</span>
                                <span className="text-3xl font-black text-blue-600">{valorTotal > 0 ? Math.max(0, Math.round(((valorTotal - pago)/valorTotal)*100)) : 100}%</span>
                            </div>
                            <p className="text-[9px] text-center text-slate-400 italic leading-snug">Percentual de recurso em conta aguardando destinação.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Assinaturas */}
                <div className="flex justify-between items-end pt-4">
                    <div className="max-w-[450px]">
                        <p className="text-[9px] text-slate-500 leading-relaxed mb-10 text-justify">
                            Este documento é uma representação oficial dos dados contidos no Sistema de Gestão de 
                            Emendas da Prefeitura de Osasco. A veracidade das informações pode ser conferida em tempo real no portal da 
                            transparência. Documento gerado eletronicamente em conformidade com as normas legais.
                        </p>
                        <div className="flex gap-8">
                            <div className="flex-1 border-t border-slate-300 pt-3 text-center">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Secretaria de Infraestrutura</p>
                            </div>
                            <div className="flex-1 border-t border-slate-300 pt-3 text-center">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Controladoria Geral</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="p-2 border border-slate-200 bg-slate-50 rounded-lg mb-3">
                            <div className="size-16 bg-white border border-slate-200 p-2 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-slate-300">qr_code_2</span>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Validar Documento</p>
                        <p className="text-[8px] text-slate-400 font-medium tracking-wide mt-1">transparencia.osasco.sp.gov.br/validar</p>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* ============ LAYOUT DE TELA (NAVEGAÇÃO WEB) ============= */}
            {/* ========================================================= */}
            <div className="min-h-screen bg-slate-50 text-slate-900 print:hidden">
                <Navbar />

                <main className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8">
                    {/* Breadcrumb */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <Link className="text-slate-500 text-sm font-medium hover:text-blue-500" href="/">Início</Link>
                        <span className="text-slate-400 text-sm font-medium">/</span>
                        <Link className="text-slate-500 text-sm font-medium hover:text-blue-500" href="/projetos">Emendas</Link>
                        <span className="text-slate-400 text-sm font-medium">/</span>
                        <span className="text-slate-900 text-sm font-semibold">Detalhes da Emenda</span>
                    </div>

                    {/* Status Tracker */}
                    <section className="mb-8 bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-bold">Estágio Atual da Emenda</h2>
                                <p className="text-sm text-slate-500">Acompanhamento em tempo real do fluxo administrativo</p>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusInfo.color}`}>
                                <span className="size-2 rounded-full bg-current animate-pulse"></span>
                                <span className="text-xs font-bold uppercase tracking-widest">{statusInfo.label}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto pb-4">
                            <div
                                role="list"
                                aria-label="Etapas do fluxo administrativo da emenda"
                                className="flex min-w-[1000px] justify-between relative px-4 pt-4"
                            >
                                {/* Background line */}
                                <div className="absolute top-8 left-4 right-4 h-1 bg-slate-100 z-0" aria-hidden="true"></div>
                                {/* Progress line */}
                                <div
                                    className="absolute top-8 left-4 h-1 bg-emerald-500 z-0 transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                    aria-hidden="true"
                                ></div>

                                {statusSteps.map((step, idx) => {
                                    const isCompleted = idx < currentStep;
                                    const isCurrent = idx === currentStep;
                                    const isFuture = idx > currentStep;
                                    const isCancelled = idx === 7;

                                    return (
                                        <div
                                            key={step.label}
                                            role="listitem"
                                            aria-current={isCurrent ? "step" : undefined}
                                            aria-label={`${step.label}${isCurrent ? " — etapa atual" : isCompleted ? " — concluída" : " — pendente"}`}
                                            className={`relative z-10 flex flex-col items-center group w-32 ${isFuture && !isCancelled ? "opacity-40" : ""} ${isCancelled && currentStep !== 7 ? "opacity-40" : ""}`}
                                        >
                                            {isCurrent && idx < 7 ? (
                                                <div className="size-10 -mt-1 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 ring-4 ring-emerald-100 shadow-lg shadow-emerald-500/20">
                                                    <span className="material-symbols-outlined text-lg">{step.icon}</span>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`size-8 rounded-full flex items-center justify-center mb-3 ring-4 ring-white transition-transform hover:scale-110 ${isCompleted
                                                        ? "bg-blue-500 text-white"
                                                        : isFuture || (isCancelled && currentStep !== 7)
                                                            ? "bg-slate-200 text-slate-400"
                                                            : currentStep === 7 && isCancelled
                                                                ? "bg-red-500 text-white"
                                                                : "bg-slate-500 text-white"
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-sm font-bold">{step.icon}</span>
                                                </div>
                                            )}
                                            <span className={`text-[11px] font-bold text-center leading-tight ${isCurrent ? "text-emerald-600 font-black" : "text-slate-900"
                                                }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
                        {/* Left Column */}
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            {/* Project Info */}
                            <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex flex-col gap-2 mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider">
                                            {amendment.categoria || amendment.ambito || "Geral"}
                                        </span>
                                        <span className="text-slate-400 text-sm font-medium">
                                            ID: {amendment.numeroEmenda || amendment.id.slice(0, 8)} &bull; {amendment.tipoEmenda || "Emenda Individual"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-xl font-bold">Objetivo da Emenda</h2>
                                        <p className="text-slate-600 text-base leading-relaxed">
                                            {amendment.objeto || amendment.title || "-"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-xl font-bold">Finalidade</h2>
                                        <p className="text-slate-600 text-base leading-relaxed">
                                            {amendment.finalidade || amendment.description || "-"}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Financial Flow */}
                            <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                                <h2 className="text-xl font-bold mb-8">Fluxo de Execução Orçamentária</h2>
                                <div className="relative space-y-12">
                                    {/* Vertical line */}
                                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                                    {/* Reservado */}
                                    <div className="relative flex items-center gap-6">
                                        <div className={`flex items-center justify-center size-8 rounded-full z-10 shadow-sm ${reservado > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
                                            }`}>
                                            <span className="material-symbols-outlined text-sm font-bold">
                                                {reservado > 0 ? "check" : "more_horiz"}
                                            </span>
                                        </div>
                                        <div className={`flex-1 flex justify-between items-center p-4 rounded-lg ${reservado > 0 ? "bg-slate-50 hover:bg-slate-100" : "bg-white border border-slate-100"
                                            } transition-colors`}>
                                            <div>
                                                <p className={`font-bold ${reservado > 0 ? "text-slate-900" : "text-slate-400"}`}>Reservado</p>
                                                <p className={`text-sm ${reservado > 0 ? "text-slate-500" : "text-slate-400"}`}>Previsão inicial de destinação</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${reservado > 0 ? "text-blue-500" : "text-slate-400"}`}>
                                                    {reservado > 0 ? formatCurrency(reservado) : "R$ 0,00"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {reservado > 0 ? "Confirmado" : "Em processamento"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Empenhado */}
                                    <div className="relative flex items-center gap-6">
                                        <div className={`flex items-center justify-center size-8 rounded-full z-10 shadow-sm ${empenhado > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
                                            }`}>
                                            <span className="material-symbols-outlined text-sm font-bold">
                                                {empenhado > 0 ? "check" : "more_horiz"}
                                            </span>
                                        </div>
                                        <div className={`flex-1 flex justify-between items-center p-4 rounded-lg ${empenhado > 0 ? "bg-slate-50 hover:bg-slate-100" : "bg-white border border-slate-100"
                                            } transition-colors`}>
                                            <div>
                                                <p className={`font-bold ${empenhado > 0 ? "text-slate-900" : "text-slate-400"}`}>Empenhado</p>
                                                <p className={`text-sm ${empenhado > 0 ? "text-slate-500" : "text-slate-400"}`}>Recurso reservado para o projeto</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${empenhado > 0 ? "text-blue-500" : "text-slate-400"}`}>
                                                    {empenhado > 0 ? formatCurrency(empenhado) : "R$ 0,00"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {empenhado > 0 ? "Confirmado" : "Em processamento"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Liquidado */}
                                    <div className="relative flex items-center gap-6">
                                        <div className={`flex items-center justify-center size-8 rounded-full z-10 shadow-sm ${liquidado > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
                                            }`}>
                                            <span className="material-symbols-outlined text-sm font-bold">
                                                {liquidado > 0 ? "check" : "more_horiz"}
                                            </span>
                                        </div>
                                        <div className={`flex-1 flex justify-between items-center p-4 rounded-lg ${liquidado > 0 ? "bg-slate-50 hover:bg-slate-100" : "bg-white border border-slate-100"
                                            } transition-colors`}>
                                            <div>
                                                <p className={`font-bold ${liquidado > 0 ? "text-slate-900" : "text-slate-400"}`}>Liquidado</p>
                                                <p className={`text-sm ${liquidado > 0 ? "text-slate-500" : "text-slate-400"}`}>Serviço/Produto entregue e verificado</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${liquidado > 0 ? "text-blue-500" : "text-slate-400"}`}>
                                                    {liquidado > 0 ? formatCurrency(liquidado) : "R$ 0,00"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {liquidado > 0 ? "Confirmado" : "Em processamento"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pago */}
                                    <div className="relative flex items-center gap-6">
                                        <div className={`flex items-center justify-center size-8 rounded-full z-10 shadow-sm ${pago > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
                                            }`}>
                                            <span className="material-symbols-outlined text-sm font-bold">
                                                {pago > 0 ? "check" : "more_horiz"}
                                            </span>
                                        </div>
                                        <div className={`flex-1 flex justify-between items-center p-4 rounded-lg ${pago > 0 ? "bg-slate-50 hover:bg-slate-100" : "bg-white border border-slate-100"
                                            } transition-colors`}>
                                            <div>
                                                <p className={`font-bold ${pago > 0 ? "text-slate-900" : "text-slate-400"}`}>Pago</p>
                                                <p className={`text-sm ${pago > 0 ? "text-slate-500" : "text-slate-400"}`}>Recurso transferido ao fornecedor</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${pago > 0 ? "text-blue-500" : "text-slate-400"}`}>
                                                    {pago > 0 ? formatCurrency(pago) : "R$ 0,00"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {pago > 0 ? "Confirmado" : "Em processamento"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <TechnicalDetailsAccordion
                                orgaoBeneficiario={amendment.orgaoBeneficiario}
                                municipio={amendment.municipio}
                                cnpj={amendment.cnpj}
                                fornecedor={amendment.fornecedor}
                                instrumentoJuridico={amendment.instrumentoJuridico}
                                prazoAplicacao={amendment.prazoAplicacao}
                                codigoAplicacao={amendment.codigoAplicacao}
                                numeroLicitacao={amendment.numeroLicitacao}
                            />
                        </div>

                        {/* Right Sidebar */}
                        <div className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-24">
                            {/* Value Card */}
                            <div className="bg-blue-500 text-white p-6 rounded-xl shadow-lg shadow-blue-500/20">
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Valor Total Destinado</p>
                                <p className="text-3xl font-extrabold mb-4">
                                    {valorTotal > 0 ? formatCurrency(valorTotal) : "Não informado"}
                                </p>
                                {valorTotal > 0 && pago > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-blue-100">
                                        <span className="material-symbols-outlined text-sm">trending_up</span>
                                        <span>{Math.round((pago / valorTotal) * 100)}% já pago</span>
                                    </div>
                                )}
                            </div>

                            {/* Author Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Autor da Emenda</p>
                                <div className="flex items-center gap-4 mb-6">
                                    {autorPhoto ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={autorPhoto}
                                            alt={autor}
                                            className="size-20 rounded-full object-cover border-2 border-slate-200"
                                        />
                                    ) : (
                                        <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                                            {autorInitials}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-slate-900">{autor}</p>
                                        <p className="text-xs text-slate-500">
                                            {amendment.responsavelCargo || "Parlamentar"}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    {amendment.localidadeBeneficiada && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Local:</span>
                                            <span className="font-medium text-slate-900 text-right max-w-[60%]">{amendment.localidadeBeneficiada}</span>
                                        </div>
                                    )}
                                    {amendment.numeroLicitacao && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Licitação:</span>
                                            <span className="font-mono font-medium text-slate-900">{amendment.numeroLicitacao}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detalhamento da Emenda Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h2 className="text-base font-bold mb-5">Detalhamento da Emenda</h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Âmbito</p>
                                        <p className="text-sm font-medium text-slate-900">{amendment.ambito || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo de Emenda</p>
                                        <p className="text-sm font-medium text-slate-900">{amendment.tipoEmenda || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fundamento Legal</p>
                                        <p className="text-sm font-medium text-slate-900">{amendment.fundamentoLegal || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Função / Subfunção</p>
                                        <p className="text-sm font-medium text-slate-900">{amendment.funcao || "-"} / {amendment.subfuncao || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Destinação</p>
                                        <p className="text-sm font-medium text-slate-900">{amendment.destinacao || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <Link
                                    href={`/projetos/${id}/relatorio`}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-xl">description</span>
                                    Visualizar Relatório
                                </Link>
                                <Link href="/" className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all active:scale-95">
                                    <span className="material-symbols-outlined text-xl">home</span>
                                    Voltar ao Início
                                </Link>
                            </div>

                            {/* Transparency Badge */}
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-emerald-600 mt-0.5">verified</span>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900">Emenda Transparente</p>
                                        <p className="text-xs text-emerald-700">Os dados desta emenda são públicos e auditáveis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto bg-white border-t border-slate-200 py-10">
                    <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3 text-slate-400">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/brasao-osasco.png" alt="Brasão de Osasco" className="w-8 h-8 object-contain opacity-50 grayscale" />
                            <p className="text-sm font-medium">Portal das Emendas - Prefeitura Municipal de Osasco © 2026</p>
                        </div>
                        <div className="flex gap-6">
                            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="https://transparencia.osasco.sp.gov.br/#/dados_abertos" target="_blank" rel="noopener noreferrer">Dados Abertos</a>
                            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Contato</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
