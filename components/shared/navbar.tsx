"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
    { href: "/", label: "Painel", icon: "dashboard" },
    { href: "/projetos", label: "Emendas", icon: "list_alt" },
    { href: "/admin", label: "Área do Gestor", icon: "admin_panel_settings" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative flex size-10 shrink-0 items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/brasao-osasco.svg"
                                alt="Brasão de Osasco"
                                className="h-full w-full object-contain drop-shadow"
                            />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-sm font-bold leading-tight text-slate-800">Portal das Emendas</h1>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Prefeitura de Osasco</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-200 ${isActive(link.href)
                                    ? "bg-blue-50 font-semibold text-blue-600"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                                {link.label}
                                {isActive(link.href) && (
                                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-blue-500" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <button className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                            </span>
                        </button>
                        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Online</span>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-50"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {mobileOpen ? "close" : "menu"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Nav Dropdown */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 animate-in slide-in-from-top-2 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${isActive(link.href)
                                    ? "bg-blue-50 font-semibold text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </header>
        </>
    );
}
