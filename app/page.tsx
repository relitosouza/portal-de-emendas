"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="sticky top-0 flex min-h-screen w-20 flex-col border-r border-slate-200 bg-white lg:w-64">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
          <div className="hidden overflow-hidden lg:block">
            <h1 className="font-heading font-bold leading-none text-slate-800 truncate">Portal das Emendas Osasco</h1>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Portal Transparência</span>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-2 px-4">
          <Link
            href="#"
            className="flex items-center gap-4 rounded-xl bg-blue-50 p-3 font-medium text-blue-600 transition-colors"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="hidden lg:block">Dashboard</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 rounded-xl p-3 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <span className="material-symbols-outlined">map</span>
            <span className="hidden lg:block">Mapa Urbano</span>
          </Link>
          <Link
            href="/projetos"
            className="flex items-center gap-4 rounded-xl p-3 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <span className="material-symbols-outlined">list_alt</span>
            <span className="hidden lg:block">Emendas</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 rounded-xl p-3 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <span className="material-symbols-outlined">monitoring</span>
            <span className="hidden lg:block">Indicadores</span>
          </Link>
        </nav>
        <div className="border-t border-slate-100 p-4">
          <Link
            href="/admin/wizard"
            className="flex items-center gap-4 rounded-xl p-3 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span className="hidden font-medium lg:block">Login Gestor</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                search
              </span>
              <input
                type="text"
                placeholder="Pesquisar emendas ou bairros..."
                className="w-full rounded-2xl border-none bg-slate-100 py-2.5 pl-12 pr-4 text-sm font-sans transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="ml-8 flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="hidden items-center gap-3 sm:block">
              <div className="text-right">
                <p className="font-mono text-xs text-slate-400">STATUS SISTEMA</p>
                <p className="text-xs font-bold text-teal-600">ONLINE</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="space-y-12 p-8 lg:p-12">
          {/* Stats Section */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-[16px] bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)]">
              <div className="absolute -bottom-4 -right-4 opacity-10 transition-transform duration-500 group-hover:scale-110">
                <span className="material-symbols-outlined text-9xl">payments</span>
              </div>
              <p className="mb-4 font-mono text-sm uppercase tracking-widest text-blue-100">
                Orçamento Aprovado 2026
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="font-heading text-4xl font-bold">R$ 12.5M</h3>
                <span className="font-mono text-sm text-blue-200">+15%</span>
              </div>
            </div>

            <div className="rounded-[16px] border border-slate-100 bg-white p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)]">
              <div className="mb-4 flex items-start justify-between">
                <p className="font-mono text-sm uppercase tracking-widest text-slate-400">Execução Financeira</p>
                <span className="material-symbols-outlined text-teal-500">analytics</span>
              </div>
              <div className="mb-4 flex items-baseline gap-2">
                <h3 className="font-heading text-4xl font-bold text-slate-800">64%</h3>
                <span className="text-sm text-slate-400">Pago</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-teal-400 to-teal-600"></div>
              </div>
            </div>

            <div className="rounded-[16px] border border-slate-100 bg-white p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)]">
              <div className="mb-4 flex items-start justify-between">
                <p className="font-mono text-sm uppercase tracking-widest text-slate-400">Obras Concluídas</p>
                <span className="material-symbols-outlined text-blue-500">verified</span>
              </div>
              <div className="mb-4 flex items-baseline gap-2">
                <h3 className="font-heading text-4xl font-bold text-slate-800">12</h3>
                <span className="text-lg text-slate-400">/ 45</span>
              </div>
              <div className="flex gap-2">
                <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-600">
                  8 em curso
                </span>
                <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase text-red-600">
                  2 paradas
                </span>
              </div>
            </div>
          </section>

          {/* Map and Sector Section */}
          <section className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                  <span className="material-symbols-outlined text-blue-600">explore</span>
                  Geolocalização de Investimentos
                </h2>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                    <span className="font-sans text-xs font-medium uppercase tracking-tighter text-slate-500">
                      Normal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="font-sans text-xs font-medium uppercase tracking-tighter text-slate-500">
                      Atenção
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="font-sans text-xs font-medium uppercase tracking-tighter text-slate-500">
                      Crítico
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Card */}
              <div className="group relative h-[540px] overflow-hidden rounded-[16px] border border-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)]">
                <div
                  className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[8px]"
                  style={{ border: "1px solid rgba(255, 255, 255, 0.3)" }}
                ></div>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvO_NNsz74dAZqxDJiDXdeJSh-2jiCNylO-aI88n8AveFfIbVePTFUvyJdZDnHLAx9JVoLBBfeQ1J3QzwNFb1BBtGshuaamWf123m-dIgFsY9wGYWGfEYmbza_6t3VEEqingtR-DrQWxui0MK16Z78eGjXNVUqyVIns3dK54v-X1pMUdIno3GtzzGe_8A4diCVYqdPV9m-ZqdJltoypGLVrc2aeBNX6ZyZv_oUgRADqFh-X6KqQSywzAuZBxxV-WsICHet2SRGfj4"
                  alt="Mapa Urbano"
                  className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale transition-all duration-700 group-hover:opacity-40 group-hover:grayscale-0"
                />

                {/* Pin 1 */}
                <div className="group/pin absolute left-1/3 top-1/4 cursor-pointer">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-20"></div>
                    <div className="relative h-5 w-5 rounded-full border-2 border-white bg-teal-500 shadow-lg"></div>
                  </div>
                  <div className="absolute bottom-full left-1/2 mb-3 w-44 -translate-x-1/2 rounded-xl border border-white bg-white/90 p-3 shadow-xl backdrop-blur opacity-0 transition-all duration-300 pointer-events-none group-hover/pin:opacity-100">
                    <p className="mb-1 text-[10px] font-bold text-teal-600">SAÚDE</p>
                    <p className="text-xs font-bold leading-tight text-slate-800">Reforma UBS Centro</p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[45%] bg-teal-500"></div>
                    </div>
                  </div>
                </div>

                {/* Pin 2 */}
                <div className="group/pin absolute right-1/4 top-1/2 cursor-pointer">
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-red-500 shadow-lg"></div>
                  <div className="absolute bottom-full left-1/2 mb-3 w-44 -translate-x-1/2 rounded-xl border border-white bg-white/90 p-3 shadow-xl backdrop-blur opacity-0 transition-all duration-300 pointer-events-none group-hover/pin:opacity-100">
                    <p className="mb-1 text-[10px] font-bold text-red-600">INFRAESTRUTURA</p>
                    <p className="text-xs font-bold leading-tight text-slate-800">Vila Nova - Pavimentação</p>
                    <p className="mt-1 text-[10px] text-slate-500">Paralisado há 120 dias</p>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 flex gap-1 rounded-xl border border-white/50 bg-white/40 p-1 backdrop-blur-[8px]">
                  <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                  <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white">
                    <span className="material-symbols-outlined text-[20px]">remove</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-10 lg:col-span-4">
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-tight text-slate-800">Investimento por Setor</h2>
                <div className="space-y-4">
                  <div className="group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-white p-4 transition-all hover:border-blue-100 hover:bg-blue-50/50">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <span className="material-symbols-outlined">medical_services</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Saúde</p>
                        <p className="font-mono text-xs text-slate-400">15 Projetos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">35%</p>
                      <p className="text-[10px] uppercase text-slate-400">Do total</p>
                    </div>
                  </div>

                  <div className="group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-white p-4 transition-all hover:border-teal-100 hover:bg-teal-50/50">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                        <span className="material-symbols-outlined">engineering</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Infraestrutura</p>
                        <p className="font-mono text-xs text-slate-400">22 Projetos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">45%</p>
                      <p className="text-[10px] uppercase text-slate-400">Do total</p>
                    </div>
                  </div>

                  <div className="group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-white p-4 transition-all hover:border-slate-100 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600 transition-colors group-hover:bg-slate-600 group-hover:text-white">
                        <span className="material-symbols-outlined">school</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Educação</p>
                        <p className="font-mono text-xs text-slate-400">8 Projetos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">20%</p>
                      <p className="text-[10px] uppercase text-slate-400">Do total</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold uppercase tracking-tight text-slate-800">Atividade Recente</h2>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700">VER TODAS</button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white/60 p-4 transition-colors hover:border-blue-200">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500"></div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-mono text-[10px] text-slate-400">ID-402 • HOJE</p>
                        <span className="material-symbols-outlined text-[16px] text-slate-300">history</span>
                      </div>
                      <p className="text-sm font-bold leading-tight text-slate-800">Reforma UBS Centro</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        Medição nº 4 aprovada. Pagamento liberado.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white/60 p-4 transition-colors hover:border-blue-200">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500"></div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-mono text-[10px] text-slate-400">ID-389 • ONTEM</p>
                        <span className="material-symbols-outlined text-[16px] text-slate-300">history</span>
                      </div>
                      <p className="text-sm font-bold leading-tight text-slate-800">Creche Vila Nova</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        Prazo de entrega revisado (+30 dias).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white p-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="font-mono text-xs text-slate-400">
              © 2026 Portal das Emendas Osasco • Plataforma de Auditoria Participativa
            </p>
            <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <a href="#" className="transition-colors hover:text-blue-600">
                Transparência
              </a>
              <a href="#" className="transition-colors hover:text-blue-600">
                Termos
              </a>
              <a href="#" className="transition-colors hover:text-blue-600">
                Contato
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
