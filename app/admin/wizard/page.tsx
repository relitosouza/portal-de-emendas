import { WizardForm } from "@/components/admin/wizard-form";

export default function WizardPage() {
    return (
        <div className="bg-[#F8F9FA] font-sans text-[#2D2D2D] antialiased min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1A1A1A] flex items-center justify-center rounded-xl shadow-lg shadow-black/5">
                        <span className="material-symbols-outlined text-white text-xl">account_balance</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight leading-none">Portal das Emendas</h1>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Portal de Transparência</span>
                    </div>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    <a className="text-sm font-medium text-gray-500 hover:text-[#1A1A1A] transition-colors" href="/admin/dashboard">Dashboard</a>
                    <a className="text-sm font-semibold text-[#1A1A1A]" href="/admin/wizard">Gestão de Emendas</a>
                    <a className="text-sm font-medium text-gray-500 hover:text-[#1A1A1A] transition-colors" href="/projetos">Projetos</a>
                </nav>
                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-gray-500">notifications</span>
                    </button>
                    <div className="h-8 w-[1px] bg-gray-100"></div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold leading-none">Gestor Público</p>
                            <p className="text-[10px] text-gray-400">Painel Administrativo</p>
                        </div>
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            G
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Form Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <WizardForm />
            </main>

            {/* Footer */}
            <footer className="mt-auto py-12 px-8 border-t border-gray-100 text-center">
                <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Portal das Emendas Osasco © 2026 • Plataforma de Transparência Fiscal</p>
            </footer>
        </div>
    );
}
