"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Simulate login delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Simple validation (accept any email/password for MVP or specific ones)
        if (email && password) {
            // Success
            // router.push("/admin/wizard");
            window.location.href = "/admin/wizard";
        } else {
            setError("Preencha todos os campos.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-slate-800">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)] border border-slate-100">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
                        <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-slate-800">Login Gestor</h1>
                    <p className="text-sm text-slate-500">Acesse o painel administrativo</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                        Voltar para o Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
