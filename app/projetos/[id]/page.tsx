import { getAmendmentsFromSheet } from "@/lib/google-sheets";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/navbar";

export const revalidate = 60;

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
    if (VEREADORES_PHOTOS[normalized]) return VEREADORES_PHOTOS[normalized];
    for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
        if (normalized.includes(key) || key.includes(normalized)) return url;
    }
    const parts = normalized.split(" ");
    for (const part of parts) {
        if (part.length < 3) continue;
        for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
            if (key.split(" ").some(k => k === part)) return url;
        }
    }
    return undefined;
}

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

    const parseCurrency = (val?: string) => {
        if (!val) return 0;
        if (typeof val === "number") return val;
        const cleaned = String(val)
            .replace(/[R$\s.]/g, "")
            .replace(",", ".");
        return parseFloat(cleaned) || 0;
    };

    const valorTotal = parseCurrency(amendment.valorAutorizado || amendment.valor);
    const empenhado = parseCurrency(amendment.empenhado);
    const liquidado = parseCurrency(amendment.liquidado);
    const pago = parseCurrency(amendment.pago);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    // Status tracker
    const statusSteps = [
        { label: "Não Iniciada", icon: "check" },
        { label: "Em Análise", icon: "check" },
        { label: "Elaboração", icon: "check" },
        { label: "Viabilização", icon: "check" },
        { label: "Contratação", icon: "check" },
        { label: "Execução", icon: "sync" },
        { label: "Executada", icon: "done_all" },
        { label: "Cancelada", icon: "block" },
    ];

    const statusMap: Record<string, number> = {
        planejamento: 0,
        aprovado: 3,
        em_execucao: 5,
        concluido: 6,
        suspenso: 7,
    };

    const currentStep = statusMap[amendment.status as string] ?? 0;
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
        if (amendment.status === "concluido") return { label: "Executada", color: "bg-blue-50 border-blue-100 text-blue-600" };
        if (amendment.status === "em_execucao") return { label: "Em Execução", color: "bg-emerald-50 border-emerald-100 text-emerald-600" };
        if (amendment.status === "suspenso") return { label: "Cancelada / Impedida", color: "bg-red-50 border-red-100 text-red-600" };
        if (amendment.status === "aprovado") return { label: "Contratação", color: "bg-blue-50 border-blue-100 text-blue-600" };
        return { label: "Não Iniciada", color: "bg-slate-50 border-slate-200 text-slate-600" };
    };

    const statusInfo = getStatusLabel();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
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
                        <div className="flex min-w-[1000px] justify-between relative px-4 pt-4">
                            {/* Background line */}
                            <div className="absolute top-8 left-4 right-4 h-1 bg-slate-100 z-0"></div>
                            {/* Progress line */}
                            <div
                                className="absolute top-8 left-4 h-1 bg-emerald-500 z-0 transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>

                            {statusSteps.map((step, idx) => {
                                const isCompleted = idx < currentStep;
                                const isCurrent = idx === currentStep;
                                const isFuture = idx > currentStep;
                                const isCancelled = idx === 7;

                                return (
                                    <div
                                        key={step.label}
                                        className={`relative z-10 flex flex-col items-center group w-32 ${isFuture && !isCancelled ? "opacity-40" : ""} ${isCancelled && currentStep !== 7 ? "opacity-40" : ""}`}
                                    >
                                        {isCurrent && idx < 7 ? (
                                            <div className="size-10 -mt-1 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 ring-4 ring-emerald-100 shadow-lg shadow-emerald-500/20">
                                                <span className="material-symbols-outlined text-lg">{step.icon}</span>
                                            </div>
                                        ) : (
                                            <div
                                                className={`size-8 rounded-full flex items-center justify-center mb-3 ring-4 ring-white transition-transform hover:scale-110 ${
                                                    isCompleted
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
                                        <span className={`text-[11px] font-bold text-center leading-tight ${
                                            isCurrent ? "text-emerald-600 font-black" : "text-slate-900"
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
                                <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
                                    {amendment.objeto || amendment.title || "Sem Título"}
                                </h1>
                            </div>
                            <div className="flex flex-col gap-4">
                                <h2 className="text-xl font-bold">Descrição do Projeto</h2>
                                <p className="text-slate-600 text-base leading-relaxed">
                                    {amendment.finalidade || amendment.description || "Sem descrição disponível para esta emenda."}
                                </p>
                            </div>
                        </section>

                        {/* Financial Flow */}
                        <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold mb-8">Fluxo de Execução Orçamentária</h2>
                            <div className="relative space-y-12">
                                {/* Vertical line */}
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                                {/* Empenhado */}
                                <div className="relative flex items-center gap-6">
                                    <div className={`flex items-center justify-center size-8 rounded-full z-10 shadow-sm ${
                                        empenhado > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
                                    }`}>
                                        <span className="material-symbols-outlined text-sm font-bold">
                                            {empenhado > 0 ? "check" : "more_horiz"}
                                        </span>
                                    </div>
                                    <div className={`flex-1 flex justify-between items-center p-4 rounded-lg ${
                                        empenhado > 0 ? "bg-slate-50 hover:bg-slate-100" : "bg-white border border-slate-100"
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
                                    <div className={`flex items-center justify-center size-8 rounded-full z-10 shadow-sm ${
                                        liquidado > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
                                    }`}>
                                        <span className="material-symbols-outlined text-sm font-bold">
                                            {liquidado > 0 ? "check" : "more_horiz"}
                                        </span>
                                    </div>
                                    <div className={`flex-1 flex justify-between items-center p-4 rounded-lg ${
                                        liquidado > 0 ? "bg-slate-50 hover:bg-slate-100" : "bg-white border border-slate-100"
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
                                    <div className={`flex items-center justify-center size-8 rounded-full z-10 shadow-sm ${
                                        pago > 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"
                                    }`}>
                                        <span className="material-symbols-outlined text-sm font-bold">
                                            {pago > 0 ? "check" : "more_horiz"}
                                        </span>
                                    </div>
                                    <div className={`flex-1 flex justify-between items-center p-4 rounded-lg ${
                                        pago > 0 ? "bg-slate-50 hover:bg-slate-100" : "bg-white border border-slate-100"
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
                                {amendment.orgaoBeneficiario && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Órgão:</span>
                                        <span className="font-medium text-slate-900 text-right max-w-[60%]">{amendment.orgaoBeneficiario}</span>
                                    </div>
                                )}
                                {amendment.localidadeBeneficiada && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Local:</span>
                                        <span className="font-medium text-slate-900 text-right max-w-[60%]">{amendment.localidadeBeneficiada}</span>
                                    </div>
                                )}
                                {amendment.fornecedor && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Fornecedor:</span>
                                        <span className="font-medium text-slate-900 text-right max-w-[60%]">{amendment.fornecedor}</span>
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

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95">
                                <span className="material-symbols-outlined text-xl">notifications_active</span>
                                Acompanhar Execução
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all active:scale-95">
                                <span className="material-symbols-outlined text-xl">description</span>
                                Baixar Documentos
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all text-sm active:scale-95">
                                <span className="material-symbols-outlined text-xl">share</span>
                                Compartilhar
                            </button>
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
                        <img src="/brasao-osasco.png" alt="Brasão de Osasco" className="w-8 h-8 object-contain" />
                        <p className="text-sm font-medium">Portal das Emendas - Prefeitura Municipal de Osasco © 2026</p>
                    </div>
                    <div className="flex gap-6">
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Privacidade</a>
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Dados Abertos</a>
                        <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
