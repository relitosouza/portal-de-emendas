import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/shared/navbar";
import {
    CREDITED_REVENUES_FILE,
    CreditedRevenue,
    readJsonFile,
} from "@/lib/json-storage";
import { findVereadorPhoto } from "@/lib/amendments-utils";
import type { Metadata } from "next";
import { truncateDescription } from "@/lib/seo";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const revenues = await readJsonFile<CreditedRevenue>(CREDITED_REVENUES_FILE);
    const revenue = revenues.find((item) => String(item.id) === String(id));

    if (!revenue) {
        return {
            title: "Receita não encontrada",
            robots: { index: false, follow: false },
        };
    }

    const title = revenue.amendmentNumber
        ? `Emenda creditada ${revenue.amendmentNumber}`
        : `Emenda creditada de ${revenue.author || "Osasco"}`;
    const description = truncateDescription(
        `${revenue.history || revenue.revenueDescription || "Crédito de emenda parlamentar"}. Valor creditado: ${formatCurrency(revenue.creditedValue)}.`
    );
    const pathname = `/projetos/receitas/${encodeURIComponent(String(id))}`;

    return {
        title,
        description,
        alternates: { canonical: pathname },
        openGraph: {
            type: "article",
            url: pathname,
            title,
            description,
            modifiedTime: revenue.updatedAt || undefined,
        },
        twitter: { title, description },
    };
}

function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function initials(name: string) {
    return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default async function CreditedRevenuePage({ params }: Props) {
    const { id } = await params;
    const revenues = await readJsonFile<CreditedRevenue>(CREDITED_REVENUES_FILE);
    const revenue = revenues.find((item) => item.id === id);
    if (!revenue) notFound();

    const authorPhoto = findVereadorPhoto(revenue.author);
    const transactions = revenue.transactions || [];
    const transactionCount = revenue.transactionCount || Math.max(1, transactions.length);
    const isGrouped = transactionCount > 1;
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <main className="max-w-5xl mx-auto px-6 py-10">
                <Link href="/projetos?filtro=creditado" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 mb-8">
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
                    Voltar às emendas creditadas
                </Link>

                <section className="rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-8 md:p-10 text-white shadow-xl shadow-emerald-900/10 mb-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">
                                Emenda Creditada
                            </span>
                            <p className="text-sm font-semibold text-emerald-100 mb-2">{isGrouped ? "Valor total creditado" : "Valor do lançamento"}</p>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{formatCurrency(revenue.creditedValue)}</h1>
                            <p className="mt-4 text-sm text-emerald-50">
                                {isGrouped ? `${transactionCount} lançamentos agrupados · último crédito em ` : "Crédito registrado em "}
                                {revenue.creditDate || "data não informada"}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 border border-white/15 p-4 min-w-56">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Situação no portal</p>
                            <p className="mt-2 font-bold">Aguardando associação</p>
                            <p className="mt-1 text-xs text-emerald-100">Ainda não vinculada a uma emenda cadastrada.</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                        <h2 className="text-lg font-black mb-5">{isGrouped ? "Dados do vínculo agrupado" : "Dados do lançamento"}</h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nº da emenda informado</dt>
                                <dd className="mt-1 font-bold text-slate-800">{revenue.amendmentNumber || "Não identificado"}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Âmbito estimado</dt>
                                <dd className="mt-1 font-bold text-slate-800">{revenue.scope}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vínculo</dt>
                                <dd className="mt-1 font-bold text-slate-800">{revenue.vinculo || "Não informado"}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Operação</dt>
                                <dd className="mt-1 font-bold text-slate-800">{revenue.operation || "Arrecadação"}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Natureza da receita</dt>
                                <dd className="mt-1 font-bold text-slate-800">{revenue.revenueNature || "Não informada"}</dd>
                                <dd className="mt-1 text-sm text-slate-500">{revenue.revenueDescription}</dd>
                            </div>
                            {!isGrouped && (
                                <>
                                    <div className="sm:col-span-2">
                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Histórico oficial</dt>
                                        <dd className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{revenue.history || "Histórico não informado no lançamento."}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conta bancária</dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-700">{revenue.bank || "Não informada"}</dd>
                                    </div>
                                </>
                            )}
                        </dl>

                        {isGrouped && (
                            <div className="mt-7 border-t border-slate-100 pt-6">
                                <h3 className="text-sm font-black text-slate-800 mb-4">Lançamentos reunidos neste vínculo</h3>
                                <div className="space-y-3">
                                    {transactions.map((transaction) => (
                                        <article key={transaction.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-bold text-slate-600">{transaction.creditDate || "Data não informada"}</span>
                                                <span className="font-black text-emerald-700">{formatCurrency(transaction.creditedValue)}</span>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-700">{transaction.history || "Histórico não informado."}</p>
                                            {transaction.bank && <p className="text-xs text-slate-500 mt-2">{transaction.bank}</p>}
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-6">
                        <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Autor localizado no histórico</p>
                            <div className="flex items-center gap-4">
                                {authorPhoto ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={authorPhoto} alt={revenue.author} className="size-16 rounded-2xl object-cover border border-slate-100" />
                                ) : (
                                    <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 text-lg font-black">
                                        {initials(revenue.author)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900 break-words">{revenue.author}</p>
                                    <p className="text-xs text-slate-500 mt-1">Identificado automaticamente</p>
                                </div>
                            </div>
                        </section>

                        <a href={revenue.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900 p-5 text-white hover:bg-slate-800 transition-colors">
                            <div>
                                <p className="text-xs font-black">Conferir fonte oficial</p>
                                <p className="text-[10px] text-slate-300 mt-1">Portal da Transparência de Osasco</p>
                            </div>
                            <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                        </a>
                    </aside>
                </div>
            </main>
        </div>
    );
}
