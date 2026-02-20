"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/navbar";
import dynamic from "next/dynamic";

const MapPicker = dynamic(
    () => import("@/components/ui/map-picker").then((mod) => mod.MapPicker),
    { ssr: false, loading: () => <div className="h-64 bg-slate-100 rounded-xl animate-pulse" /> }
);

interface PageProps {
    params: Promise<{ id: string }>;
}

const phases = [
    { key: "identificacao", label: "Identificação", icon: "fingerprint", desc: "Dados do município e responsável" },
    { key: "classificacao", label: "Classificação", icon: "category", desc: "Tipo, categoria e autoria" },
    { key: "detalhamento", label: "Detalhamento", icon: "location_on", desc: "Localização e instrumento jurídico" },
    { key: "financeiro", label: "Financeiro", icon: "payments", desc: "Valores, empenho e execução" },
    { key: "monitoramento", label: "Monitoramento", icon: "query_stats", desc: "Transparência e acompanhamento" },
    { key: "status", label: "Status", icon: "flag", desc: "Status e prioridade da emenda" },
];

export default function EditAmendmentPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [amendment, setAmendment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activePhase, setActivePhase] = useState("identificacao");
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        async function fetchAmendment() {
            try {
                const response = await fetch("/api/amendments");
                const data = await response.json();
                if (Array.isArray(data)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const found = data.find((a: any) => a.id === id);
                    if (found) {
                        setAmendment(found);
                        setFormData({ ...found });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch amendment", error);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchAmendment();
    }, [id]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    // A pending amendment comes from the "Emenda" cadastro sheet and has never been
    // saved to the main sheet. When completing it, we must POST (create) rather than PUT.
    const isPending = amendment?.status === "pendente";

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            // For pending amendments we publish to main sheet via POST, preserving the original ID.
            // For regular amendments we update via PUT.
            const method = isPending ? "POST" : "PUT";
            const payload = isPending
                ? { ...formData, status: formData.status === "pendente" ? "planejamento" : formData.status }
                : formData;

            const res = await fetch("/api/amendments", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const successMsg = isPending
                    ? "Emenda publicada com sucesso! Já está visível no portal."
                    : "Emenda atualizada com sucesso!";
                setFeedback({ type: "success", msg: successMsg });
                // Also save financial data if present
                if (formData.empenhado || formData.liquidado || formData.pago) {
                    await fetch("/api/financial", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amendmentId: formData.id,
                            empenhado: formData.empenhado || "",
                            liquidado: formData.liquidado || "",
                            pago: formData.pago || "",
                        }),
                    });
                }
                if (isPending) {
                    // Redirect back to dashboard after publishing
                    setTimeout(() => router.push("/admin/dashboard"), 1800);
                } else {
                    setTimeout(() => setFeedback(null), 3000);
                }
            } else {
                setFeedback({ type: "error", msg: "Erro ao salvar emenda." });
            }
        } catch {
            setFeedback({ type: "error", msg: "Erro ao salvar emenda." });
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
    const selectClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
    const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5";
    const textareaClass = "w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

    const renderPhaseContent = () => {
        switch (activePhase) {
            case "identificacao":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Município</label>
                                <input className={inputClass} value={formData.municipio || ""} onChange={(e) => handleChange("municipio", e.target.value)} placeholder="Ex: Osasco" />
                            </div>
                            <div>
                                <label className={labelClass}>CNPJ</label>
                                <input className={inputClass} value={formData.cnpj || ""} onChange={(e) => handleChange("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Nome do Responsável</label>
                                <input className={inputClass} value={formData.responsavelNome || ""} onChange={(e) => handleChange("responsavelNome", e.target.value)} placeholder="Nome completo" />
                            </div>
                            <div>
                                <label className={labelClass}>Cargo do Responsável</label>
                                <input className={inputClass} value={formData.responsavelCargo || ""} onChange={(e) => handleChange("responsavelCargo", e.target.value)} placeholder="Ex: Prefeito" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Conformidade LOA 2026</label>
                            <select className={selectClass} value={formData.loa2026Check || ""} onChange={(e) => handleChange("loa2026Check", e.target.value)}>
                                <option value="">Selecione</option>
                                <option value="sim">Sim, conforme LOA 2026</option>
                                <option value="nao">Não</option>
                                <option value="em_analise">Em análise</option>
                            </select>
                        </div>
                    </div>
                );

            case "classificacao":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Âmbito</label>
                                <select className={selectClass} value={formData.ambito || ""} onChange={(e) => handleChange("ambito", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="federal">Federal</option>
                                    <option value="estadual">Estadual</option>
                                    <option value="municipal">Municipal</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Tipo de Emenda</label>
                                <select className={selectClass} value={formData.tipoEmenda || ""} onChange={(e) => handleChange("tipoEmenda", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="individual">Individual</option>
                                    <option value="bancada">Bancada</option>
                                    <option value="comissao">Comissão</option>
                                    <option value="relator">Relator</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                        </div>
                        {formData.tipoEmenda === "outro" && (
                            <div>
                                <label className={labelClass}>Especifique</label>
                                <input className={inputClass} value={formData.tipoEmendaOutro || ""} onChange={(e) => handleChange("tipoEmendaOutro", e.target.value)} />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Categoria</label>
                                <select className={selectClass} value={formData.categoria || ""} onChange={(e) => handleChange("categoria", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="saude">Saúde</option>
                                    <option value="educacao">Educação</option>
                                    <option value="infraestrutura">Infraestrutura</option>
                                    <option value="seguranca">Segurança</option>
                                    <option value="cultura">Cultura</option>
                                    <option value="esporte">Esporte</option>
                                    <option value="meio_ambiente">Meio Ambiente</option>
                                    <option value="assistencia_social">Assistência Social</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Nº da Emenda</label>
                                <input className={inputClass} value={formData.numeroEmenda || ""} onChange={(e) => handleChange("numeroEmenda", e.target.value)} placeholder="Número" />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Autor / Parlamentar</label>
                            <input className={inputClass} value={formData.autor || ""} onChange={(e) => handleChange("autor", e.target.value)} placeholder="Nome do parlamentar" />
                        </div>
                        <div>
                            <label className={labelClass}>Fundamentação Legal</label>
                            <input className={inputClass} value={formData.fundamentoLegal || ""} onChange={(e) => handleChange("fundamentoLegal", e.target.value)} placeholder="Artigo, lei ou normativa" />
                        </div>
                        <div>
                            <label className={labelClass}>Objeto</label>
                            <textarea className={textareaClass} rows={3} value={formData.objeto || ""} onChange={(e) => handleChange("objeto", e.target.value)} placeholder="Descrição do objeto da emenda" />
                        </div>
                        <div>
                            <label className={labelClass}>Finalidade</label>
                            <textarea className={textareaClass} rows={3} value={formData.finalidade || ""} onChange={(e) => handleChange("finalidade", e.target.value)} placeholder="Finalidade da emenda" />
                        </div>
                    </div>
                );

            case "detalhamento":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Programa Vinculado</label>
                                <input className={inputClass} value={formData.programaVinculado || ""} onChange={(e) => handleChange("programaVinculado", e.target.value)} placeholder="Nome do programa" />
                            </div>
                            <div>
                                <label className={labelClass}>Destinação</label>
                                <input className={inputClass} value={formData.destinacao || ""} onChange={(e) => handleChange("destinacao", e.target.value)} placeholder="Destinação do recurso" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Órgão Beneficiário</label>
                                <input className={inputClass} value={formData.orgaoBeneficiario || ""} onChange={(e) => handleChange("orgaoBeneficiario", e.target.value)} placeholder="Órgão que recebe" />
                            </div>
                            <div>
                                <label className={labelClass}>Localidade Beneficiada</label>
                                <input className={inputClass} value={formData.localidadeBeneficiada || ""} onChange={(e) => handleChange("localidadeBeneficiada", e.target.value)} placeholder="Bairro, região" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Instrumento Jurídico</label>
                                <select className={selectClass} value={formData.instrumentoJuridico || ""} onChange={(e) => handleChange("instrumentoJuridico", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="convenio">Convênio</option>
                                    <option value="contrato">Contrato de Repasse</option>
                                    <option value="transferencia_especial">Transferência Especial</option>
                                    <option value="transferencia_obrigatoria">Transferência Obrigatória</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Possui Cronograma?</label>
                                <select className={selectClass} value={formData.possuiCronograma || ""} onChange={(e) => handleChange("possuiCronograma", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="sim">Sim</option>
                                    <option value="nao">Não</option>
                                    <option value="em_elaboracao">Em Elaboração</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Localização no Mapa</label>
                            <div className="rounded-xl overflow-hidden border border-slate-200 mt-1">
                                <MapPicker
                                    lat={formData.latitude || -23.5329}
                                    lng={formData.longitude || -46.7915}
                                    onChange={(lat: number, lng: number) => {
                                        handleChange("latitude", lat);
                                        handleChange("longitude", lng);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );

            case "financeiro":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Valor da Emenda</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                    <input className={`${inputClass} pl-12 font-mono`} value={formData.valor || ""} onChange={(e) => handleChange("valor", e.target.value)} placeholder="0,00" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Valor Autorizado</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                    <input className={`${inputClass} pl-12 font-mono`} value={formData.valorAutorizado || ""} onChange={(e) => handleChange("valorAutorizado", e.target.value)} placeholder="0,00" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Prazo de Aplicação</label>
                                <input className={inputClass} type="date" value={formData.prazoAplicacao || ""} onChange={(e) => handleChange("prazoAplicacao", e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>% da RCL</label>
                                <input className={inputClass} value={formData.percentualRcl || ""} onChange={(e) => handleChange("percentualRcl", e.target.value)} placeholder="Ex: 1.5%" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Possui Conta Específica?</label>
                                <select className={selectClass} value={formData.contaEspecifica || ""} onChange={(e) => handleChange("contaEspecifica", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="sim">Sim</option>
                                    <option value="nao">Não</option>
                                </select>
                            </div>
                            {formData.contaEspecifica === "sim" && (
                                <div>
                                    <label className={labelClass}>Número da Conta</label>
                                    <input className={inputClass} value={formData.numeroConta || ""} onChange={(e) => handleChange("numeroConta", e.target.value)} placeholder="Agência / Conta" />
                                </div>
                            )}
                        </div>

                        {/* Execução Financeira */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-6 space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-600">account_balance</span>
                                <h3 className="text-sm font-bold text-emerald-800">Execução Financeira</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>Empenhado
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                        <input className={`${inputClass} pl-12 font-mono`} value={formData.empenhado || ""} onChange={(e) => handleChange("empenhado", e.target.value)} placeholder="0,00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Liquidado
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                        <input className={`${inputClass} pl-12 font-mono`} value={formData.liquidado || ""} onChange={(e) => handleChange("liquidado", e.target.value)} placeholder="0,00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Pago
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                        <input className={`${inputClass} pl-12 font-mono`} value={formData.pago || ""} onChange={(e) => handleChange("pago", e.target.value)} placeholder="0,00" />
                                    </div>
                                </div>
                            </div>
                            {/* Flow visualization */}
                            <div className="flex items-center gap-2 pt-2">
                                <div className="flex-1 h-2 rounded-full bg-blue-200 overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: formData.empenhado ? "100%" : "0%" }}></div></div>
                                <span className="material-symbols-outlined text-[12px] text-slate-300">arrow_forward</span>
                                <div className="flex-1 h-2 rounded-full bg-amber-200 overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: formData.liquidado ? "100%" : "0%" }}></div></div>
                                <span className="material-symbols-outlined text-[12px] text-slate-300">arrow_forward</span>
                                <div className="flex-1 h-2 rounded-full bg-emerald-200 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: formData.pago ? "100%" : "0%" }}></div></div>
                            </div>
                        </div>
                    </div>
                );

            case "monitoramento":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Portal de Transparência</label>
                                <select className={selectClass} value={formData.portalTransparenciaCheck || ""} onChange={(e) => handleChange("portalTransparenciaCheck", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="sim">Sim, publicado</option>
                                    <option value="nao">Não publicado</option>
                                    <option value="em_publicacao">Em processo de publicação</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Divulgação em Tempo Real</label>
                                <select className={selectClass} value={formData.divulgacaoTempoReal || ""} onChange={(e) => handleChange("divulgacaoTempoReal", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option value="sim">Sim</option>
                                    <option value="nao">Não</option>
                                    <option value="parcial">Parcial</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Link do Portal de Transparência</label>
                            <input className={inputClass} type="url" value={formData.linkPortal || ""} onChange={(e) => handleChange("linkPortal", e.target.value)} placeholder="https://..." />
                        </div>
                        <div>
                            <label className={labelClass}>Monitoramento Ativo</label>
                            <select className={selectClass} value={formData.monitoramentoCheck || ""} onChange={(e) => handleChange("monitoramentoCheck", e.target.value)}>
                                <option value="">Selecione</option>
                                <option value="sim">Sim, monitoramento ativo</option>
                                <option value="nao">Não possui</option>
                                <option value="em_implantacao">Em implantação</option>
                            </select>
                        </div>
                    </div>
                );

            case "status":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Status da Emenda</label>
                                <select
                                    className={selectClass}
                                    value={formData.status === "pendente" ? "planejamento" : (formData.status || "planejamento")}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                >
                                    <option value="planejamento">Planejamento</option>
                                    <option value="aprovado">Aprovado</option>
                                    <option value="em_execucao">Em Execução</option>
                                    <option value="concluido">Concluído</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Prioridade</label>
                                <select className={selectClass} value={formData.priority || ""} onChange={(e) => handleChange("priority", e.target.value)}>
                                    <option value="normal">Normal</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                        </div>

                        {/* Visual status indicator */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resumo</p>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: "Planejamento", value: "planejamento", color: "blue" },
                                    { label: "Aprovado", value: "aprovado", color: "purple" },
                                    { label: "Em Execução", value: "em_execucao", color: "amber" },
                                    { label: "Concluído", value: "concluido", color: "emerald" },
                                ].map((s) => (
                                    <div
                                        key={s.value}
                                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${formData.status === s.value
                                            ? `bg-${s.color}-100 text-${s.color}-700 ring-2 ring-${s.color}-500`
                                            : "bg-slate-100 text-slate-400"
                                            }`}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${formData.status === s.value ? `bg-${s.color}-500` : "bg-slate-300"}`}></span>
                                        {s.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const currentPhase = phases.find((p) => p.key === activePhase)!;

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                        <span className="text-sm text-slate-400">Carregando emenda...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!amendment) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <span className="material-symbols-outlined text-[48px] text-slate-300">error</span>
                        <p className="text-lg font-bold text-slate-700">Emenda não encontrada</p>
                        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Voltar ao Painel
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-[1400px] p-6 lg:p-10">
                    {/* Breadcrumb + Header */}
                    <div className="mb-8 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <Link href="/admin/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-slate-700 font-bold">{isPending ? "Completar Emenda Pendente" : "Editar Emenda"}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{formData.objeto || (isPending ? "Completar Emenda" : "Editar Emenda")}</h1>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {isPending
                                        ? "Preencha os dados da prefeitura para publicar esta emenda no portal."
                                        : "Atualize os dados da emenda por seção no menu lateral."}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                    Voltar
                                </Link>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 ${
                                        isPending
                                            ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/20"
                                            : "bg-gradient-to-r from-blue-600 to-teal-500 shadow-blue-500/20"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {saving ? "hourglass_empty" : isPending ? "publish" : "save"}
                                    </span>
                                    {saving ? (isPending ? "Publicando..." : "Salvando...") : isPending ? "Publicar Emenda" : "Salvar Alterações"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Banner for pending amendments from councilor cadastro */}
                    {isPending && (
                        <div className="mb-6 flex items-start gap-4 rounded-xl border border-orange-200 bg-orange-50 p-5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                                <span className="material-symbols-outlined">assignment_ind</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-orange-800">Emenda cadastrada pelo vereador — aguarda complemento da prefeitura</p>
                                <p className="text-xs text-orange-600 mt-1 leading-relaxed">
                                    O vereador <strong>{formData.autor || "—"}</strong> cadastrou esta emenda no sistema. Os campos preenchidos por ele
                                    estão exibidos abaixo. Complete as informações da prefeitura (município, CNPJ, fundamentação, valores, monitoramento, etc.)
                                    e clique em <strong>Publicar Emenda</strong> para torná-la visível no portal público.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {feedback && (
                        <div className={`mb-6 flex items-center gap-3 rounded-xl p-4 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            <span className="material-symbols-outlined text-[18px]">{feedback.type === "success" ? "check_circle" : "error"}</span>
                            {feedback.msg}
                        </div>
                    )}

                    {/* Layout: Sidebar + Content */}
                    <div className="flex gap-8">
                        {/* Sidebar */}
                        <aside className="hidden lg:block w-64 shrink-0">
                            <nav className="sticky top-24 space-y-1">
                                {phases.map((phase) => (
                                    <button
                                        key={phase.key}
                                        onClick={() => setActivePhase(phase.key)}
                                        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${activePhase === phase.key
                                            ? "bg-white border border-blue-200 shadow-sm text-blue-700"
                                            : "text-slate-500 hover:bg-white hover:border hover:border-slate-100 hover:shadow-sm border border-transparent"
                                            }`}
                                    >
                                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${activePhase === phase.key
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-slate-50 text-slate-400"
                                            }`}>
                                            <span className="material-symbols-outlined text-[20px]">{phase.icon}</span>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${activePhase === phase.key ? "text-blue-700" : "text-slate-700"}`}>{phase.label}</p>
                                            <p className="text-[10px] text-slate-400 leading-tight">{phase.desc}</p>
                                        </div>
                                        {activePhase === phase.key && (
                                            <span className="material-symbols-outlined ml-auto text-blue-400 text-[18px]">chevron_right</span>
                                        )}
                                    </button>
                                ))}

                                {/* Quick info card */}
                                <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Info Rápida</p>
                                    <div className="space-y-2 text-xs text-slate-500">
                                        <div className="flex justify-between">
                                            <span>ID</span>
                                            <span className="font-mono text-slate-700">{formData.id?.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Autor</span>
                                            <span className="font-bold text-slate-700">{formData.autor || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Valor</span>
                                            <span className="font-mono text-slate-700">R$ {formData.valor || "0"}</span>
                                        </div>
                                    </div>
                                </div>
                            </nav>
                        </aside>

                        {/* Mobile phase selector */}
                        <div className="lg:hidden w-full mb-6">
                            <select
                                className={selectClass}
                                value={activePhase}
                                onChange={(e) => setActivePhase(e.target.value)}
                            >
                                {phases.map((p) => (
                                    <option key={p.key} value={p.key}>{p.label} — {p.desc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                                {/* Section Header */}
                                <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <span className="material-symbols-outlined">{currentPhase.icon}</span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">{currentPhase.label}</h2>
                                            <p className="text-sm text-slate-500">{currentPhase.desc}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Content */}
                                <div className="p-8">
                                    {renderPhaseContent()}
                                </div>

                                {/* Section Footer */}
                                <div className="flex items-center justify-between border-t border-slate-100 px-8 py-4 bg-slate-50/30">
                                    <button
                                        onClick={() => {
                                            const idx = phases.findIndex((p) => p.key === activePhase);
                                            if (idx > 0) setActivePhase(phases[idx - 1].key);
                                        }}
                                        disabled={activePhase === phases[0].key}
                                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-colors disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                        Anterior
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        {phases.map((p) => (
                                            <div
                                                key={p.key}
                                                className={`h-1.5 rounded-full transition-all ${activePhase === p.key ? "w-6 bg-blue-500" : "w-1.5 bg-slate-200"}`}
                                            ></div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const idx = phases.findIndex((p) => p.key === activePhase);
                                            if (idx < phases.length - 1) setActivePhase(phases[idx + 1].key);
                                        }}
                                        disabled={activePhase === phases[phases.length - 1].key}
                                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-colors disabled:opacity-30"
                                    >
                                        Próximo
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="font-mono text-xs text-slate-400">© 2026 Portal das Emendas Osasco • Painel Administrativo</p>
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
