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
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Mock Steps matching the user request
const steps = [
    { id: 1, label: "Identificação" },
    { id: 2, label: "Classificação" },
    { id: 3, label: "Financeiro" },
    { id: 4, label: "Monitoramento" }
];

// Enhanced Schema
const formSchema = z.object({
    // Step 1: Identificação
    responsavel: z.string().min(1, "Selecione um responsável"),
    cargo: z.string().min(1, "Cargo é obrigatório"),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/, "CNPJ inválido (formato 00.000.000/0000-00)"),
    objeto: z.string().min(10, "Objeto deve ter pelo menos 10 caracteres"),

    // Step 2: Classificação
    sector: z.string().min(1, "Selecione um setor"),
    title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"), // Moving title to classification or keeping in ID? Mock puts "Dados Cadastrais" in step 1. Let's keep ID fields in step 1 and Project specifics in Step 2.

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
            } else {
                await onSubmit(getValues());
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
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
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="bg-white border-2 border-primary p-8 max-w-md text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="size-16 bg-success text-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl">check</span>
                    </div>
                    <h2 className="text-2xl font-bold font-heading mb-2">Projeto Criado!</h2>
                    <p className="text-muted-foreground mb-8">O projeto foi cadastrado com sucesso e já está disponível para gestão.</p>
                    <Link href="/projetos" className="block w-full bg-primary text-white py-3 font-bold uppercase tracking-wide hover:bg-black transition-colors">
                        Voltar para Lista
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* Header (Simplified to match mock layout context within existing app structure) */}
            {/* Note: In a real Next.js app, this might be in layout.tsx, but per instructions, implementing the layout here */}
            <header className="flex items-center justify-between whitespace-nowrap border-b-2 border-primary bg-white px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-4 text-primary">
                    <div className="size-8 flex items-center justify-center bg-primary text-white">
                        <span className="material-symbols-outlined text-[20px]">account_balance</span>
                    </div>
                    <h2 className="text-primary text-xl font-heading font-bold leading-tight tracking-[-0.015em] uppercase">Portal das Emendas Osasco</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/" className="text-foreground hover:text-primary text-sm font-bold uppercase tracking-wide">Dashboard</Link>
                        <Link href="/projetos" className="text-foreground hover:text-primary text-sm font-bold uppercase tracking-wide">Emendas</Link>
                        <Link href="#" className="text-foreground hover:text-primary text-sm font-bold uppercase tracking-wide">Configurações</Link>
                    </div>
                    <button className="flex items-center justify-center h-9 px-4 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm font-bold font-heading uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                        <span>Sair</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area: Split Layout */}
            <main className="flex flex-1 flex-col lg:flex-row h-full">

                {/* Left Panel: Form & Stepper */}
                <div className="flex-1 bg-white flex flex-col lg:border-r-2 border-primary">
                    <div className="max-w-3xl w-full mx-auto px-6 py-10 flex flex-col h-full">
                        {/* Breadcrumb */}
                        <Link href="/projetos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 font-mono text-xs uppercase tracking-wide">
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            Voltar para lista de projetos
                        </Link>

                        <div className="flex flex-col md:flex-row gap-12 flex-1">
                            {/* Vertical Stepper */}
                            <div className="w-full md:w-64 flex-shrink-0">
                                <div className="flex flex-col gap-1 sticky top-24">
                                    <h3 className="font-heading font-bold text-lg mb-6 text-primary leading-tight">Nova Emenda <br />TCESP 2026</h3>

                                    {steps.map((step, index) => {
                                        const isActive = index === currentStep;
                                        const isCompleted = index < currentStep;

                                        return (
                                            <div
                                                key={step.id}
                                                className={`group flex items-center gap-3 py-3 px-3 rounded-none border transition-all duration-200
                                                    ${isActive ? 'bg-primary text-white border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : ''}
                                                    ${!isActive && !isCompleted ? 'text-muted-foreground border-transparent hover:border-gray-200' : ''}
                                                    ${isCompleted ? 'text-primary border-primary bg-gray-50' : ''}
                                                `}
                                            >
                                                <span className={`font-mono text-sm font-bold ${isActive ? 'text-white' : 'text-primary'}`}>0{step.id}</span>
                                                <span className="font-heading font-bold text-sm uppercase tracking-wide">{step.label}</span>
                                                {isCompleted && <span className="material-symbols-outlined text-sm ml-auto">check</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 max-w-lg">
                                <div className="mb-8">
                                    <h1 className="font-heading font-bold text-3xl text-primary mb-2 tracking-tight">
                                        {steps[currentStep].label}
                                    </h1>
                                    <p className="text-muted-foreground">
                                        {currentStep === 0 && "Preencha as informações iniciais para gerar o código de rastreio da emenda."}
                                        {currentStep === 1 && "Defina a classificação setorial e o título oficial do projeto."}
                                        {currentStep === 2 && "Especifique o valor total do orçamento aprovado."}
                                        {currentStep === 3 && "Vincule o cronograma de execução previsto."}
                                    </p>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">

                                        {/* Step 1: Identificação */}
                                        {currentStep === 0 && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="responsavel"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-1">
                                                            <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Responsável pela Emenda</FormLabel>
                                                            <div className="relative">
                                                                <select
                                                                    className="w-full appearance-none bg-background border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
                                                                    {...field}
                                                                >
                                                                    <option value="" disabled>Selecione um parlamentar</option>
                                                                    <option value="dep_carlos">Dep. Carlos Mendes (PL)</option>
                                                                    <option value="dep_ana">Dep. Ana Souza (PT)</option>
                                                                    <option value="ver_joao">Ver. João da Silva (MDB)</option>
                                                                </select>
                                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                                                                    <span className="material-symbols-outlined">expand_more</span>
                                                                </div>
                                                            </div>
                                                            <FormMessage className="text-xs font-mono text-status-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="cargo"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-1">
                                                            <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Cargo do Responsável</FormLabel>
                                                            <FormControl>
                                                                <Input className="w-full bg-white border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans placeholder:text-gray-400 h-auto" {...field} />
                                                            </FormControl>
                                                            <FormMessage className="text-xs font-mono text-status-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="cnpj"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-1">
                                                            <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">CNPJ da Entidade Executora</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="00.000.000/0000-00" className="w-full bg-white border border-primary rounded-none px-4 py-3 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 h-auto" {...field} />
                                                            </FormControl>
                                                            <p className="text-xs text-muted-foreground mt-1">O CNPJ deve conter 14 dígitos formatados corretamente.</p>
                                                            <FormMessage className="text-xs font-mono text-status-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="objeto"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-1">
                                                            <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Objeto da Emenda</FormLabel>
                                                            <FormControl>
                                                                <Textarea placeholder="Descreva sucintamente o objetivo..." className="w-full bg-white border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans placeholder:text-gray-400 min-h-[100px]" {...field} />
                                                            </FormControl>
                                                            <FormMessage className="text-xs font-mono text-status-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {/* Step 2: Classificação */}
                                        {currentStep === 1 && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="sector"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-1">
                                                            <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Setor de Atuação</FormLabel>
                                                            <div className="relative">
                                                                <select
                                                                    className="w-full appearance-none bg-background border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
                                                                    {...field}
                                                                >
                                                                    <option value="" disabled>Selecione um setor</option>
                                                                    <option value="Saúde">Saúde</option>
                                                                    <option value="Educação">Educação</option>
                                                                    <option value="Infraestrutura">Infraestrutura</option>
                                                                    <option value="Cultura">Cultura</option>
                                                                </select>
                                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                                                                    <span className="material-symbols-outlined">expand_more</span>
                                                                </div>
                                                            </div>
                                                            <FormMessage className="text-xs font-mono text-status-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="title"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-1">
                                                            <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Título do Projeto</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ex: Reforma da Praça Central" className="w-full bg-white border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans h-auto" {...field} />
                                                            </FormControl>
                                                            <FormMessage className="text-xs font-mono text-status-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {/* Step 3: Financeiro */}
                                        {currentStep === 2 && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="budget"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-1">
                                                            <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Valor do Orçamento (R$)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ex: 500.000,00" className="w-full bg-white border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono h-auto" {...field} />
                                                            </FormControl>
                                                            <FormMessage className="text-xs font-mono text-status-danger" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {/* Step 4: Monitoramento */}
                                        {currentStep === 3 && (
                                            <>
                                                <div className="flex flex-col gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="startDate"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col gap-1">
                                                                <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Data de Início</FormLabel>
                                                                <FormControl>
                                                                    <Input type="date" className="w-full bg-white border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono h-auto" {...field} />
                                                                </FormControl>
                                                                <FormMessage className="text-xs font-mono text-status-danger" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="endDate"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col gap-1">
                                                                <FormLabel className="text-sm font-bold text-primary font-heading uppercase tracking-wide">Previsão de Término</FormLabel>
                                                                <FormControl>
                                                                    <Input type="date" className="w-full bg-white border border-primary rounded-none px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono h-auto" {...field} />
                                                                </FormControl>
                                                                <FormMessage className="text-xs font-mono text-status-danger" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                disabled={currentStep === 0 || isSubmitting}
                                                className="px-6 py-3 rounded-none border border-transparent text-muted-foreground hover:text-primary font-heading font-bold text-sm uppercase tracking-wide transition-colors disabled:opacity-50"
                                            >
                                                {currentStep === 0 ? "Cancelar" : "Voltar"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                disabled={isSubmitting}
                                                className="px-6 py-3 rounded-none bg-primary text-white border-2 border-primary hover:bg-black font-heading font-bold text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : (
                                                    <>
                                                        {currentStep === steps.length - 1 ? "Finalizar Cadastro" : "Próximo Passo"}
                                                        {currentStep < steps.length - 1 && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Context & Help */}
                <div className="hidden lg:flex w-[400px] bg-background border-l-2 border-primary p-8 flex-col gap-8 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
                    <div className="flex items-center gap-3 text-muted-foreground mb-4">
                        <span className="material-symbols-outlined">menu_book</span>
                        <span className="font-mono text-xs uppercase tracking-wider">Manual de Conformidade</span>
                    </div>

                    <div className="space-y-6">
                        {/* Info Card 1 */}
                        <div className="bg-white border text-foreground border-primary p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                            <h4 className="font-heading font-bold text-lg text-primary mb-3">Diretriz TCESP: Artigo 2</h4>
                            <p className="text-sm text-foreground leading-relaxed mb-4">
                                O CNPJ informado deve corresponder estritamente à entidade executora do recurso (Prefeitura ou Organização Social), conforme Art. 2 da resolução normativa vigente.
                            </p>
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-none flex gap-3 items-start">
                                <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">info</span>
                                <p className="text-xs text-blue-800">
                                    CPF de pessoas físicas não são aceitos para emendas de infraestrutura acima de R$ 100k.
                                </p>
                            </div>
                        </div>

                        {/* Info Card 2 */}
                        <div className="bg-white border border-gray-200 p-5 rounded-none">
                            <h4 className="font-heading font-bold text-lg text-primary mb-3">Dicas de Preenchimento</h4>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-status-success text-sm mt-0.5">check_circle</span>
                                    <span className="text-sm text-muted-foreground">Utilize o CNPJ da matriz, não de filiais, salvo exceções justificadas.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-status-success text-sm mt-0.5">check_circle</span>
                                    <span className="text-sm text-muted-foreground">O cargo deve ser o vigente na data da assinatura do convênio.</span>
                                </li>
                            </ul>
                        </div>

                        {/* External Link */}
                        <Link href="#" className="flex items-center justify-between p-4 border border-gray-300 rounded-none hover:border-primary hover:bg-white transition-all group">
                            <span className="text-sm font-bold text-text-main group-hover:text-primary">Baixar Manual Completo (PDF)</span>
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">open_in_new</span>
                        </Link>
                    </div>

                    {/* Decorative Context Map */}
                    <div className="mt-auto pt-8 border-t border-gray-200">
                        <p className="font-mono text-xs text-muted-foreground uppercase mb-2">Contexto Regional</p>
                        <div className="h-40 w-full bg-gray-200 rounded-none overflow-hidden relative border border-gray-300 filter grayscale opacity-70">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxUrI2WMky-wpkyrBldKkhkWB2GbB5kvVI6_3Jw_K07yww7rWYSdhMSIhQwDMvV44LLg0GW_bV7zyXFB5TMdMGPq8wtkayxk-uFeNKAuDk2PuZXVatnngNoEVPsTljPn5mQ6CqOSeLc8jMc_t13HvQ3wSdTkJcc3ymKlF8ol18v-eg5ajaqOcw99D1RUOFCaQ4dXnLWm_CHxNn6w00UMltEeDVZguFvPB3unpmZgcqr7Ypd3IQFkQkAhdoPp07nQxhStYvjw_H0c8" alt="Map Context" className="w-full h-full object-cover mix-blend-multiply" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-white/80 px-2 py-1 font-mono text-xs text-primary border border-primary/20 backdrop-blur-sm">São Paulo - SP</span>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
