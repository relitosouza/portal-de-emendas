"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Mock Steps with Icons
const steps = [
    { id: 1, label: "Identificação", icon: "fingerprint" },
    { id: 2, label: "Classificação", icon: "category" },
    { id: 3, label: "Financeiro", icon: "payments" },
    { id: 4, label: "Monitoramento", icon: "query_stats" }
];

// Schema
const formSchema = z.object({
    // Step 1: Identificação
    responsavel: z.string().min(1, "Selecione um responsável"),
    cargo: z.string().min(1, "Cargo é obrigatório"),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/, "CNPJ inválido (formato 00.000.000/0000-00)"),
    objeto: z.string().min(10, "Objeto deve ter pelo menos 10 caracteres"),

    // Step 2: Classificação
    sector: z.string().min(1, "Selecione um setor"),
    title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),

    // Step 3: Financeiro
    budget: z.string().min(1, "Orçamento é obrigatório"),

    // Step 4: Monitoramento
    startDate: z.string().min(1, "Data de início é obrigatória"),
    endDate: z.string().min(1, "Data de fim é obrigatória"),
});

type FormValues = z.infer<typeof formSchema>;

export default function WizardPage() {
    const [currentStep, setCurrentStep] = useState(0); // 0-indexed
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            responsavel: "",
            cargo: "Deputado Estadual",
            cnpj: "",
            objeto: "",
            sector: "",
            title: "",
            budget: "",
            startDate: "",
            endDate: "",
        },
        mode: "onChange",
    });

    const { trigger, getValues } = form;

    const handleNext = async () => {
        let fieldsToValidate: (keyof FormValues)[] = [];
        if (currentStep === 0) {
            fieldsToValidate = ["responsavel", "cargo", "cnpj", "objeto"];
        } else if (currentStep === 1) {
            fieldsToValidate = ["sector", "title"];
        } else if (currentStep === 2) {
            fieldsToValidate = ["budget"];
        } else if (currentStep === 3) {
            fieldsToValidate = ["startDate", "endDate"];
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            if (currentStep < steps.length - 1) {
                setCurrentStep((prev) => prev + 1);
                window.scrollTo(0, 0);
            } else {
                await onSubmit(getValues());
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("Form Data:", data);
        setIsSubmitting(false);
        setIsSuccess(true);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-paper p-4 font-body">
                <div className="bg-surface rounded-xl shadow-lg border border-gray-100 p-10 max-w-md text-center">
                    <div className="size-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-bold font-display text-primary mb-2">Projeto Criado!</h2>
                    <p className="text-gray-500 mb-8">O projeto foi cadastrado com sucesso e já está disponível para gestão.</p>
                    <Link href="/projetos" className="block w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl">
                        Voltar para Lista
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-paper font-body text-text-main antialiased min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-surface border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-black/5">
                        <span className="material-symbols-outlined text-white text-xl">account_balance</span>
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg tracking-tight leading-none">Impacto Cidadão</h1>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Portal de Transparência</span>
                    </div>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">Dashboard</Link>
                    <Link href="/projetos" className="text-sm font-semibold text-primary">Gestão de Emendas</Link>
                    <Link href="#" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">Relatórios</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-gray-500">notifications</span>
                    </button>
                    <div className="h-8 w-[1px] bg-gray-100"></div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold leading-none">Gestor Público</p>
                            <p className="text-[10px] text-gray-400">ID: 4829-X</p>
                        </div>
                        <div className="w-9 h-9 bg-gray-200 rounded-full border-2 border-white overflow-hidden">
                            <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xs">GP</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl w-full mx-auto px-6 py-12 flex-1">
                {/* Horizontal Stepper */}
                <div className="flex items-start justify-between mb-16 relative px-4">
                    {/* Stepper Logic to connect lines */}
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <div key={step.id} className="contents">
                                <div className="flex flex-col items-center z-10 relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg
                                        ${isActive || isCompleted ? 'bg-accent text-white shadow-accent/20' : 'bg-white border-2 border-gray-200 text-gray-400'}
                                    `}>
                                        <span className="material-symbols-outlined text-xl">{isCompleted ? 'check' : step.icon}</span>
                                    </div>
                                    <span className={`mt-3 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-accent' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-[2px] flex-grow margin-0 mx-3 mt-5 relative ${index < currentStep ? 'bg-accent' : 'bg-gray-200'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-surface rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100">
                    <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="font-display font-bold text-3xl text-primary tracking-tight">Cadastro de Emenda</h2>
                        <p className="text-gray-500 mt-2 max-w-2xl">
                            {currentStep === 0 && "Passo 1: Identificação dos responsáveis e conformidade legal inicial exigida pelo TCESP 2026."}
                            {currentStep === 1 && "Passo 2: Definição da classificação setorial e do título oficial do projeto."}
                            {currentStep === 2 && "Passo 3: Detalhamento financeiro e orçamentário da emenda."}
                            {currentStep === 3 && "Passo 4: Definição do cronograma de execução e monitoramento."}
                        </p>
                    </div>

                    <div className="p-10">
                        <Form {...form}>
                            <form onSubmit={(e) => e.preventDefault()} className="space-y-12">

                                {/* Step 1 content */}
                                {currentStep === 0 && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-display font-bold text-lg text-primary">Responsabilidade</h3>
                                                <p className="text-sm text-gray-500 mt-1">Defina o autor e cargo do responsável pela proposição.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="responsavel"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-2">
                                                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Autor da Emenda</label>
                                                                <div className="relative group">
                                                                    <select
                                                                        className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-primary appearance-none focus:outline-none focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all"
                                                                        {...field}
                                                                    >
                                                                        <option value="" disabled>Selecione...</option>
                                                                        <option value="dep_carlos">Dep. Carlos Mendes (PL)</option>
                                                                        <option value="dep_ana">Dep. Ana Souza (PT)</option>
                                                                        <option value="ver_joao">Ver. João da Silva (MDB)</option>
                                                                    </select>
                                                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                                </div>
                                                                <FormMessage className="text-xs text-danger" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="cargo"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-2">
                                                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Cargo</label>
                                                                <Input className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-primary focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all" {...field} />
                                                                <FormMessage className="text-xs text-danger" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100"></div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-display font-bold text-lg text-primary">Entidade Executora</h3>
                                                <p className="text-sm text-gray-500 mt-1">Dados técnicos para rastreabilidade fiscal e auditoria.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="cnpj"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">CNPJ da Entidade</label>
                                                                {/* Example of validation feedback implementation */}
                                                                {form.formState.errors.cnpj && (
                                                                    <span className="text-[10px] font-bold text-danger flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[14px]">info</span>
                                                                        INVÁLIDO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Input
                                                                placeholder="00.000.000/0000-00"
                                                                className={`w-full h-12 border rounded-xl px-4 font-mono text-sm transition-all focus:outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] 
                                                                    ${form.formState.errors.cnpj
                                                                        ? 'bg-red-50/30 border-red-200 text-danger focus:ring-red-500/10'
                                                                        : 'bg-white border-gray-200 text-primary focus:border-accent'}`
                                                                }
                                                                {...field}
                                                            />
                                                            <FormMessage className="text-xs text-danger ml-1" />
                                                            {form.formState.errors.cnpj && <p className="text-[11px] text-danger mt-1.5 ml-1">O formato do CNPJ não atende aos requisitos do Art. 2 da TCESP.</p>}
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="objeto"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-2">
                                                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Objeto do Projeto</label>
                                                            <Textarea placeholder="Ex: Reforma da Unidade Básica de Saúde Central..." className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-primary focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all resize-none min-h-[100px]" {...field} />
                                                            <FormMessage className="text-xs text-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Other Steps (Simplified for brevity but keeping structure) */}
                                {currentStep === 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                        <div className="md:col-span-4">
                                            <h3 className="font-display font-bold text-lg text-primary">Classificação</h3>
                                            <p className="text-sm text-gray-500 mt-1">Defina o setor e título.</p>
                                        </div>
                                        <div className="md:col-span-8 space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="sector"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Setor</label>
                                                        <div className="relative">
                                                            <select className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-primary appearance-none focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all" {...field}>
                                                                <option value="" disabled>Selecione...</option>
                                                                <option value="Saúde">Saúde</option>
                                                                <option value="Educação">Educação</option>
                                                                <option value="Infraestrutura">Infraestrutura</option>
                                                                <option value="Cultura">Cultura</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                        <FormMessage className="text-xs text-danger" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Título</label>
                                                        <Input className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-primary focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all" {...field} />
                                                        <FormMessage className="text-xs text-danger" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                        <div className="md:col-span-4">
                                            <h3 className="font-display font-bold text-lg text-primary">Financeiro</h3>
                                            <p className="text-sm text-gray-500 mt-1">Defina o orçamento.</p>
                                        </div>
                                        <div className="md:col-span-8 space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="budget"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Valor (R$)</label>
                                                        <Input className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-primary focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all" placeholder="0,00" {...field} />
                                                        <FormMessage className="text-xs text-danger" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                        <div className="md:col-span-4">
                                            <h3 className="font-display font-bold text-lg text-primary">Cronograma</h3>
                                            <p className="text-sm text-gray-500 mt-1">Datas de execução.</p>
                                        </div>
                                        <div className="md:col-span-8 space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="startDate"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-2">
                                                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Início</label>
                                                            <Input type="date" className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-primary focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all" {...field} />
                                                            <FormMessage className="text-xs text-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="endDate"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-2">
                                                            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">Término</label>
                                                            <Input type="date" className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-primary focus:border-accent focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all" {...field} />
                                                            <FormMessage className="text-xs text-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="h-[1px] bg-gray-100"></div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between pt-4">
                                    <Link href="/projetos" className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xl">close</span>
                                        CANCELAR
                                    </Link>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            className="px-8 py-3 bg-white border border-gray-200 text-primary rounded-xl text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                                        >
                                            SALVAR RASCUNHO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={isSubmitting}
                                            className="px-10 py-3 bg-gradient-to-br from-[#1A1A1A] to-[#333333] hover:from-[#333333] hover:to-[#444444] text-white rounded-xl text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-3 transition-all disabled:opacity-70"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="animate-spin" size={20} />
                                            ) : (
                                                <>
                                                    {currentStep === steps.length - 1 ? "FINALIZAR" : "PRÓXIMO PASSO"}
                                                    {currentStep < steps.length - 1 && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>

                {/* Info Cards (Visible mostly on large screens or stacked) */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                            <span className="material-symbols-outlined">menu_book</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-blue-900">Diretriz TCESP: Artigo 2</h4>
                            <p className="text-xs text-blue-800/70 mt-1 leading-relaxed">
                                O CNPJ informado deve corresponder à entidade executora direta do recurso, conforme resolução normativa 2026.
                            </p>
                            <a href="#" className="inline-flex items-center text-[11px] font-bold text-blue-600 mt-3 hover:underline">
                                VER MANUAL COMPLETO
                                <span className="material-symbols-outlined text-[14px] ml-1">open_in_new</span>
                            </a>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400 border border-gray-200">
                            <span className="material-symbols-outlined">lightbulb</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-700">Dica de Preenchimento</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Utilize o CNPJ da matriz administrativa. O cargo do responsável deve ser o vigente na data de envio.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-auto py-12 px-8 border-t border-gray-100 text-center">
                <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Plataforma Impacto Cidadão © 2024 • Desenvolvido para Transparência Fiscal</p>
            </footer>
        </div>
    );
}
