import { getAmendmentsFromSheet } from "@/lib/json-storage";
import { getNormalizedStatus, getStatusStep } from "@/lib/status-mapper";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintReportButton from "./print-button";

export const revalidate = 60;

interface Props {
    params: Promise<{ id: string }>;
}

export default async function RelatorioPage(props: Props) {
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
        const cleaned = String(val).replace(/[R$\s.]/g, "").replace(",", ".");
        return parseFloat(cleaned) || 0;
    };

    const valorTotal = parseCurrency(amendment.valorAutorizado || amendment.valor);
    const reservado = parseCurrency(amendment.reservado);
    const empenhado = parseCurrency(amendment.empenhado);
    const liquidado = parseCurrency(amendment.liquidado);
    const pago = parseCurrency(amendment.pago);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

    const normalizedStatus = getNormalizedStatus(amendment.status as string);
    const currentStep = getStatusStep(normalizedStatus);

    const autor = amendment.autor || amendment.author || amendment.responsavelNome || "Não informado";

    const categoryMap: Record<string, string> = {
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

    const getCategoryLabel = (cat?: string) => {
        if (!cat) return null;
        let catNum = cat;
        if (typeof catNum === "string" && catNum.includes(" - ")) catNum = catNum.split(" - ")[0].trim();
        return categoryMap[String(catNum)] || cat;
    };

    const categoriaLabel = getCategoryLabel(amendment.categoria);

    const progressPercent = currentStep <= 6 ? (Math.min(currentStep, 5) / 7) * 100 : 0;

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

    const today = new Date().toLocaleDateString("pt-BR");

    return (
        <>
            {/* Action Bar */}
            <div className="no-print w-full bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/projetos/${id}`}
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

            {/* Main Document Container */}
            <div className="bg-slate-100 min-h-screen print:bg-white">
                <div className="print-container max-w-[800px] mx-auto my-8 print:my-0 bg-white shadow-xl print:shadow-none p-12 border border-slate-200 print:border-none min-h-[1123px] relative flex flex-col">
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full -z-0 print:hidden"></div>

                    {/* Header */}
                    <header className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/brasao-osasco.png"
                                    alt="Brasão de Osasco"
                                    className="h-full w-full object-contain drop-shadow"
                                />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight leading-tight">
                                    Portal das Emendas
                                </h1>
                                <p className="text-[10px] uppercase text-slate-500 font-medium">
                                    Prefeitura Municipal de Osasco
                                </p>
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

                    {/* Main Title */}
                    <section className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            Relatório de Execução de Emenda
                        </h2>
                        <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
                    </section>

                    {/* Identification Section */}
                    <section className="mb-10">
                        <h3 className="text-xs uppercase font-bold text-slate-400 mb-4 border-l-4 border-blue-600 pl-3">
                            Identificação do Projeto
                        </h3>
                        <div className="grid grid-cols-2 gap-y-4 border border-slate-200 rounded-lg p-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    Título da Emenda
                                </span>
                                <span className="text-base font-semibold text-slate-800">
                                    {amendment.objeto || amendment.title || "-"}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    Autor da Emenda
                                </span>
                                <span className="text-base font-semibold text-slate-800">{autor}</span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    Valor Total Autorizado
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                    {formatCurrency(valorTotal)}
                                </span>
                            </div>
                            <div className="flex flex-col border-t border-slate-100 pt-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    Cód. Identificador
                                </span>
                                <span className="text-base font-semibold text-slate-800">
                                    {amendment.numeroEmenda || id.slice(0, 8)}
                                </span>
                            </div>
                            {categoriaLabel && (
                                <div className="flex flex-col border-t border-slate-100 pt-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Categoria
                                    </span>
                                    <span className="text-base font-semibold text-slate-800">
                                        {categoriaLabel}
                                    </span>
                                </div>
                            )}
                            {amendment.tipoEmenda && (
                                <div className="flex flex-col border-t border-slate-100 pt-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Tipo de Emenda
                                    </span>
                                    <span className="text-base font-semibold text-slate-800">
                                        {amendment.tipoEmenda}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Status Timeline */}
                    <section className="mb-10">
                        <h3 className="text-xs uppercase font-bold text-slate-400 mb-6 border-l-4 border-blue-600 pl-3">
                            Estágio de Execução
                        </h3>
                        <div className="overflow-x-auto pb-2">
                            <div className="flex min-w-[700px] justify-between relative px-2 pt-2">
                                {/* Background line */}
                                <div className="absolute top-6 left-4 right-4 h-[2px] bg-slate-100 z-0"></div>
                                {/* Progress line */}
                                <div
                                    className="absolute top-6 left-4 h-[2px] bg-blue-500 z-0"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>

                                {statusSteps.map((step, idx) => {
                                    const isCompleted = idx < currentStep;
                                    const isCurrent = idx === currentStep;
                                    const isFuture = idx > currentStep;
                                    const isCancelled = idx === 8;

                                    return (
                                        <div
                                            key={step.label}
                                            className={`relative z-10 flex flex-col items-center w-[72px] ${isFuture && !isCancelled ? "opacity-40" : ""} ${isCancelled && currentStep !== 8 ? "opacity-40" : ""}`}
                                        >
                                            {isCurrent && idx < 8 ? (
                                                <div className="w-7 h-7 -mt-0.5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 ring-3 ring-emerald-100 shadow-lg shadow-emerald-500/20">
                                                    <span className="material-symbols-outlined text-[14px]">{step.icon}</span>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 ring-2 ring-white ${
                                                        isCompleted
                                                            ? "bg-blue-500 text-white"
                                                            : isFuture || (isCancelled && currentStep !== 8)
                                                                ? "bg-slate-200 text-slate-400"
                                                                : currentStep === 8 && isCancelled
                                                                    ? "bg-red-500 text-white"
                                                                    : "bg-slate-500 text-white"
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-[12px] font-bold">{step.icon}</span>
                                                </div>
                                            )}
                                            <span className={`text-[8px] font-bold text-center leading-tight ${
                                                isCurrent ? "text-emerald-600 font-black" : "text-slate-700"
                                            }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Cronograma Físico-Financeiro */}
                    <section className="mb-10">
                        <h3 className="text-xs uppercase font-bold text-slate-400 mb-4 border-l-4 border-blue-600 pl-3">
                            Cronograma Físico-Financeiro
                        </h3>
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                            Fase Orçamentária
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                            Situação
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">
                                            Valor Consolidado (R$)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="px-4 py-3 text-xs font-semibold">
                                            01. Reserva de Dotação
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {reservado > 0 ? "Confirmado" : "Pendente / Em Lançamento"}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-right font-mono">
                                            {formatCurrency(reservado)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-xs font-semibold">
                                            02. Nota de Empenho
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {empenhado > 0 ? "Confirmado" : "Aguardando Contratação"}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-right font-mono">
                                            {formatCurrency(empenhado)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-xs font-semibold">
                                            03. Liquidação Processada
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {liquidado > 0
                                                ? "Serviços Preenchidos"
                                                : "Aguardando Medição"}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-right font-mono">
                                            {formatCurrency(liquidado)}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot className="bg-blue-50/50">
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-4 py-3 text-xs font-bold text-slate-700 text-right uppercase tracking-wider"
                                        >
                                            Total Pago até a data
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right font-mono">
                                            {formatCurrency(pago)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </section>

                    {/* Detalhamento Adicional */}
                    {(amendment.finalidade ||
                        amendment.funcao ||
                        amendment.localidadeBeneficiada ||
                        amendment.orgaoBeneficiario) && (
                        <section className="mb-10">
                            <h3 className="text-xs uppercase font-bold text-slate-400 mb-4 border-l-4 border-blue-600 pl-3">
                                Detalhamento Adicional
                            </h3>
                            <div className="border border-slate-200 rounded-lg p-6 space-y-3">
                                {amendment.finalidade && (
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            Finalidade
                                        </span>
                                        <p className="text-xs text-slate-700 mt-0.5">
                                            {amendment.finalidade}
                                        </p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    {amendment.funcao && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Função / Subfunção
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">
                                                {amendment.funcao}
                                                {amendment.subfuncao
                                                    ? ` / ${amendment.subfuncao}`
                                                    : ""}
                                            </p>
                                        </div>
                                    )}
                                    {amendment.localidadeBeneficiada && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Localidade Beneficiada
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">
                                                {amendment.localidadeBeneficiada}
                                            </p>
                                        </div>
                                    )}
                                    {amendment.orgaoBeneficiario && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Órgão Beneficiário
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">
                                                {amendment.orgaoBeneficiario}
                                            </p>
                                        </div>
                                    )}
                                    {amendment.fundamentoLegal && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Fundamento Legal
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">
                                                {amendment.fundamentoLegal}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Detalhes Técnicos */}
                    {(amendment.municipio ||
                        amendment.cnpj ||
                        amendment.fornecedor ||
                        amendment.instrumentoJuridico ||
                        amendment.prazoAplicacao ||
                        amendment.codigoAplicacao ||
                        amendment.numeroLicitacao) && (
                        <section className="mb-10">
                            <h3 className="text-xs uppercase font-bold text-slate-400 mb-4 border-l-4 border-blue-600 pl-3">
                                Detalhes Técnicos
                            </h3>
                            <div className="border border-slate-200 rounded-lg p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {amendment.municipio && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Município
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">{amendment.municipio}</p>
                                        </div>
                                    )}
                                    {amendment.cnpj && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                CNPJ
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5 font-mono">{amendment.cnpj}</p>
                                        </div>
                                    )}
                                    {amendment.fornecedor && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Fornecedor
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">{amendment.fornecedor}</p>
                                        </div>
                                    )}
                                    {amendment.instrumentoJuridico && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Instrumento Jurídico
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">{amendment.instrumentoJuridico}</p>
                                        </div>
                                    )}
                                    {amendment.prazoAplicacao && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Prazo de Aplicação
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5">{amendment.prazoAplicacao}</p>
                                        </div>
                                    )}
                                    {amendment.codigoAplicacao && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Código de Aplicação
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5 font-mono">{amendment.codigoAplicacao}</p>
                                        </div>
                                    )}
                                    {amendment.numeroLicitacao && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                Nº Licitação
                                            </span>
                                            <p className="text-xs text-slate-700 mt-0.5 font-mono">{amendment.numeroLicitacao}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Footer / Signature */}
                    <footer className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-end">
                        <div className="max-w-[450px]">
                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                                Este documento é uma representação oficial dos dados contidos no
                                Sistema de Gestão de Emendas da Prefeitura de Osasco. A veracidade
                                das informações pode ser conferida em tempo real no portal da
                                transparência. Documento gerado eletronicamente em conformidade
                                com as normas legais.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white border border-slate-200 p-1 mb-2 flex items-center justify-center rounded">
                                <span className="material-symbols-outlined text-5xl text-slate-300">
                                    qr_code_2
                                </span>
                            </div>
                            <span className="text-[9px] font-bold text-blue-600 uppercase">
                                Validar Documento
                            </span>
                            <span className="text-[8px] text-slate-400">
                                transparencia.osasco.sp.gov.br/validar
                            </span>
                        </div>
                    </footer>
                </div>

                {/* Print Tips */}
                <div className="no-print max-w-[800px] mx-auto mb-10 p-6 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-4">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <div>
                        <h4 className="font-bold text-blue-600 text-sm mb-1">
                            Dicas para Impressão:
                        </h4>
                        <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                            <li>
                                Utilize a opção <b>&quot;Salvar como PDF&quot;</b> nas configurações
                                de impressão.
                            </li>
                            <li>
                                Habilite <b>&quot;Gráficos de segundo plano&quot;</b> para manter
                                as cores e barras de progresso.
                            </li>
                            <li>
                                Defina as margens como <b>&quot;Nenhuma&quot;</b> para melhor
                                enquadramento no padrão A4.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
