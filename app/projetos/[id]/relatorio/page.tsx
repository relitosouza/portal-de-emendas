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

    // Calculate percentages
    const pctEmpenhado = valorTotal > 0 ? Math.round((empenhado / valorTotal) * 100) : 0;
    const pctLiquidado = valorTotal > 0 ? Math.round((liquidado / valorTotal) * 100) : 0;
    const pctPago = valorTotal > 0 ? Math.round((pago / valorTotal) * 100) : 0;
    const pctSaldo = valorTotal > 0 ? Math.max(0, Math.round(((valorTotal - pago) / valorTotal) * 100)) : 100;

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
                            <div className="bg-blue-600 p-2 rounded-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/brasao-osasco.png"
                                    alt="Brasão de Osasco"
                                    className="w-8 h-8 filter brightness-0 invert object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    Portal das Emendas
                                </h1>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                    Portal de Transparência Municipal
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
                            {amendment.categoria && (
                                <div className="flex flex-col border-t border-slate-100 pt-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Categoria
                                    </span>
                                    <span className="text-base font-semibold text-slate-800">
                                        {amendment.categoria}
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
                        <div className="flex items-center w-full px-4 relative">
                            {/* Background Line */}
                            <div className="absolute h-[2px] bg-slate-100 left-12 right-12 top-4 -z-0"></div>
                            {/* Active Line */}
                            <div
                                className="absolute h-[2px] bg-blue-600 left-12 top-4 -z-0"
                                style={{
                                    width: `${currentStep >= 6 ? 100 : currentStep >= 5 ? 65 : currentStep >= 4 ? 45 : currentStep >= 1 ? 20 : 0}%`,
                                }}
                            ></div>

                            {/* Step: Aprovação */}
                            <div className="flex flex-col items-center flex-1 relative z-10">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                        currentStep >= 1
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 border border-slate-200 text-slate-300"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {currentStep >= 1 ? "check" : "pending"}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] font-bold uppercase ${
                                        currentStep >= 1 ? "text-slate-800" : "text-slate-400"
                                    }`}
                                >
                                    Aprovação
                                </span>
                            </div>

                            {/* Step: Empenho */}
                            <div className="flex flex-col items-center flex-1 relative z-10">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                        empenhado > 0 || currentStep >= 4
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 border border-slate-200 text-slate-300"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {empenhado > 0 || currentStep >= 4 ? "check" : "pending"}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] font-bold uppercase ${
                                        empenhado > 0 || currentStep >= 4
                                            ? "text-slate-800"
                                            : "text-slate-400"
                                    }`}
                                >
                                    Empenho
                                </span>
                            </div>

                            {/* Step: Em Execução (Current) */}
                            <div className="flex flex-col items-center flex-1 relative z-10">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                        currentStep >= 6
                                            ? "bg-blue-600 text-white"
                                            : pago > 0 || currentStep >= 5
                                              ? "border-2 border-blue-600 bg-white text-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
                                              : "bg-slate-100 border border-slate-200 text-slate-300"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm font-bold">
                                        {currentStep >= 6 ? "check" : "sync"}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] font-bold uppercase ${
                                        pago > 0 || currentStep >= 5
                                            ? "text-blue-600"
                                            : "text-slate-400"
                                    }`}
                                >
                                    Em Execução
                                </span>
                                {pago > 0 && valorTotal > 0 && (
                                    <span className="text-[10px] text-blue-600/70 font-medium">
                                        {pctPago}% concluído
                                    </span>
                                )}
                            </div>

                            {/* Step: Conclusão */}
                            <div className="flex flex-col items-center flex-1 relative z-10">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                        currentStep >= 6
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 border border-slate-200 text-slate-300"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {currentStep >= 6 ? "check" : "event"}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] font-bold uppercase ${
                                        currentStep >= 6 ? "text-slate-800" : "text-slate-400"
                                    }`}
                                >
                                    Conclusão
                                </span>
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

                    {/* Distribuição de Recursos Aplicados */}
                    <section className="mb-10">
                        <h3 className="text-xs uppercase font-bold text-slate-400 mb-4 border-l-4 border-blue-600 pl-3">
                            Distribuição de Recursos Aplicados
                        </h3>
                        <div className="grid grid-cols-[1fr_200px] gap-10 items-center">
                            <div className="space-y-4">
                                {/* Empenhado */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span>Recurso Comprometido (Empenho)</span>
                                        <span className="text-blue-600">{pctEmpenhado}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(pctEmpenhado, 100)}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                {/* Liquidado */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span>Recurso Executado (Liquidação)</span>
                                        <span className="text-blue-600">{pctLiquidado}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(pctLiquidado, 100)}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                {/* Pago */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span>Recurso Transferido (Pagamento)</span>
                                        <span className="text-blue-600">{pctPago}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(pctPago, 100)}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 border-8 border-blue-600 rounded-full flex flex-col items-center justify-center bg-blue-50/50">
                                    <span className="text-xs font-bold text-slate-500 uppercase leading-none">
                                        Saldo
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {pctSaldo}%
                                    </span>
                                </div>
                                <p className="text-[9px] text-center mt-3 text-slate-400 font-medium italic">
                                    Percentual de recurso em conta aguardando destinação.
                                </p>
                            </div>
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
                            <div className="flex gap-10 mt-6">
                                <div className="flex flex-col items-center">
                                    <div className="w-32 border-b border-slate-400 mb-1"></div>
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">
                                        Secretaria de Infraestrutura
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-32 border-b border-slate-400 mb-1"></div>
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">
                                        Controladoria Geral
                                    </span>
                                </div>
                            </div>
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
