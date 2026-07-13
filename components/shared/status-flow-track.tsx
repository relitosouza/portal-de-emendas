import { getNormalizedStatus, getStatusStep } from "@/lib/status-mapper";

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

function getStatusBadge(currentStep: number) {
    if (currentStep === 8) return { label: "Cancelada", className: "bg-red-50 border-red-100 text-red-600" };
    if (currentStep === 7) return { label: "Prestação de Contas", className: "bg-teal-50 border-teal-100 text-teal-600" };
    if (currentStep === 6) return { label: "Executada", className: "bg-blue-50 border-blue-100 text-blue-600" };
    if (currentStep === 5) return { label: "Execução", className: "bg-emerald-50 border-emerald-100 text-emerald-600" };
    if (currentStep === 4) return { label: "Contratação", className: "bg-blue-50 border-blue-100 text-blue-600" };
    if (currentStep === 3) return { label: "Viabilização", className: "bg-purple-50 border-purple-100 text-purple-600" };
    if (currentStep === 2) return { label: "Elaboração", className: "bg-indigo-50 border-indigo-100 text-indigo-600" };
    if (currentStep === 1) return { label: "Em Análise", className: "bg-amber-50 border-amber-100 text-amber-600" };
    return { label: "Não Iniciada", className: "bg-slate-50 border-slate-200 text-slate-600" };
}

export default function StatusFlowTrack({ status }: { status: string }) {
    const normalizedStatus = getNormalizedStatus(status);
    const currentStep = getStatusStep(normalizedStatus);
    const progressPercent = currentStep <= 6 ? (Math.min(currentStep, 5) / 7) * 100 : 0;
    const statusBadge = getStatusBadge(currentStep);

    return (
        <div
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 print:px-2 print:py-2"
            aria-label={`Fluxo da emenda: ${normalizedStatus}`}
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:flex-row print:items-center print:justify-between mb-2.5 print:mb-1.5">
                <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.16em] leading-none print:text-[8px]">
                        Estágio Atual da Emenda
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500 leading-tight print:text-[8px]">
                        Acompanhamento em tempo real do fluxo administrativo
                    </p>
                </div>
                <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-[0.14em] print:text-[7px] ${statusBadge.className}`}
                >
                    <span className="size-2 rounded-full bg-current" aria-hidden="true"></span>
                    {statusBadge.label}
                </div>
            </div>

            <div className="relative overflow-x-auto print:overflow-visible pb-1">
                <div className="grid min-w-[760px] print:min-w-0 grid-cols-9 gap-0.5 print:gap-0 justify-items-center relative px-1 sm:px-2 pt-2.5">
                    <div className="absolute top-6 left-3 right-3 h-[2px] bg-slate-100 z-0" aria-hidden="true"></div>
                    <div
                        className="absolute top-6 left-3 h-[2px] bg-emerald-500 z-0 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                        aria-hidden="true"
                    ></div>

                    {statusSteps.map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isCurrent = idx === currentStep;
                        const isFuture = idx > currentStep;
                        const isCancelled = idx === 8;
                        const isMuted = isFuture || (isCancelled && currentStep !== 8);

                        return (
                            <div
                                key={step.label}
                                role="listitem"
                                aria-current={isCurrent ? "step" : undefined}
                                aria-label={`${step.label}${isCurrent ? " — etapa atual" : isCompleted ? " — concluída" : " — pendente"}`}
                                className={`relative z-10 flex flex-col items-center w-[78px] print:w-auto ${isMuted ? "opacity-40" : ""}`}
                            >
                                {isCurrent && idx < 8 ? (
                                    <div className="size-7 print:size-6 -mt-0.5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 ring-4 ring-emerald-100 shadow-lg shadow-emerald-500/20">
                                        <span className="material-symbols-outlined text-[12px] print:text-[10px]">{step.icon}</span>
                                    </div>
                                ) : (
                                    <div
                                        className={`size-[26px] print:size-5 rounded-full flex items-center justify-center mb-2 ring-4 ring-white ${
                                            isCompleted
                                                ? "bg-blue-500 text-white"
                                                : isMuted
                                                    ? "bg-slate-200 text-slate-400"
                                                    : currentStep === 8 && isCancelled
                                                        ? "bg-red-500 text-white"
                                                        : "bg-slate-500 text-white"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[10px] print:text-[8px] font-bold">{step.icon}</span>
                                    </div>
                                )}
                                <span
                                    className={`text-[9px] print:text-[7px] font-bold text-center leading-tight max-w-[72px] print:max-w-[58px] ${
                                        isCurrent ? "text-emerald-600" : "text-slate-700"
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
