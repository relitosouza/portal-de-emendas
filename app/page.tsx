"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/shared/navbar";

export default function Home() {

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [amendments, setAmendments] = useState<any[]>([]);
  const [sectorStats, setSectorStats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dashboardCards, setDashboardCards] = useState<any[]>([]);

  // ---- Cálculo do total de emendas vs valor destinado (R$ 144 milhões) ----
  const VALOR_DESTINADO = 144_000_000; // R$ 144.000.000,00

  const parseValor = (v: any): number => {
    if (!v) return 0;
    if (typeof v === "number") return v;
    // Remove "R$", pontos de milhar (.) e troca vírgula por ponto
    const cleaned = String(v)
      .replace(/R\$\s*/gi, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const totalEmendas = amendments.reduce((acc, e) => acc + parseValor(e.valor), 0);
  const porcentagemDestinado = VALOR_DESTINADO > 0 ? (totalEmendas / VALOR_DESTINADO) * 100 : 0;
  const porcentagemFormatada = porcentagemDestinado.toFixed(1);
  const totalFormatado = totalEmendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      router.push(`/projetos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Function to calculate sector statistics
  const calculateSectorStats = (data: any[]) => {
    const totalProjects = data.length;
    if (totalProjects === 0) return [];

    // Define target sectors and their icons/colors
    const targetSectors = [
      { name: "Saúde", icon: "medical_services", color: "blue" },
      { name: "Infraestrutura", icon: "engineering", color: "teal" },
      { name: "Educação", icon: "school", color: "amber" }, // Changed to amber for visibility
      { name: "Esporte e Lazer", icon: "sports_soccer", color: "emerald" },
      { name: "Meio Ambiente", icon: "park", color: "green" },
      { name: "Urbanismo", icon: "location_city", color: "indigo" }
    ];

    // Count projects per sector
    const counts: Record<string, number> = {};
    data.forEach(item => {
      const cat = item.categoria || "Outros";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    // Map to display format and sort by count (descending)
    const stats = targetSectors.map(sector => {
      const count = counts[sector.name] || 0;
      const percentage = Math.round((count / totalProjects) * 100);
      return {
        ...sector,
        count,
        percentage
      };
    }).sort((a, b) => b.count - a.count);

    // Filter out sectors with 0 projects if desired, or keep top 3-4
    // For now, let's show top 3 populated ones, or specific defaults if empty
    return stats.filter(s => s.count > 0).slice(0, 5);
  };

  const defaultStats = [
    { label: "Orçamento Aprovado 2026", value: "R$ 12.5M", trend: "+15%", icon: "payments", color: "blue", description: "Valor total disponível para emendas." },
    { label: "Execução Financeira", value: "64%", trend: "Pago", icon: "analytics", color: "teal", description: "Porcentagem do orçamento já executado." },
    { label: "Obras Concluídas", value: "12", total: "/ 45", icon: "verified", color: "amber", description: "Projetos finalizados e entregues." },
  ];

  const stats = dashboardCards.length > 0 ? dashboardCards : defaultStats;

  useEffect(() => {
    async function fetchData() {
      try {
        const [amendRes, cardsRes] = await Promise.all([
          fetch("/api/amendments"),
          fetch("/api/dashboard-cards"),
        ]);
        const data = await amendRes.json();
        if (Array.isArray(data)) {
          setAmendments(data);
          setSectorStats(calculateSectorStats(data));
        }
        const cardsData = await cardsRes.json();
        if (Array.isArray(cardsData) && cardsData.length > 0) {
          setDashboardCards(cardsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] font-sans text-slate-800">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] space-y-8 p-6 lg:p-10">

          {/* Search Section - Moved here */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                search
              </span>
              <input
                type="text"
                placeholder="Pesquisar emendas, bairros ou vereadores..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base font-sans shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          {/* Card de Total de Emendas - Porcentagem vs R$ 144M */}
          <section>
            <div id="card-total-emendas" className="relative overflow-hidden rounded-[20px] border border-blue-100 p-6 md:p-8 shadow-[0_8px_32px_-4px_rgba(37,99,235,0.3)] transition-transform hover:-translate-y-1" style={{ background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 40%, #4338ca 100%)" }}>
              {/* Decorative circles */}
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}></div>
              <div className="absolute -right-4 top-16 h-24 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}></div>
              <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}></div>

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between" style={{ zIndex: 2 }}>
                {/* Left side - Info */}
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined" style={{ color: "#93c5fd" }}>account_balance</span>
                    <p style={{ fontFamily: "monospace", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#93c5fd" }}>
                      Total de Emendas Cadastradas
                    </p>
                  </div>
                  <h3 style={{ fontSize: "2rem", fontWeight: "bold", color: "#ffffff", lineHeight: 1.2 }}>
                    {loading ? "Carregando..." : totalFormatado}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>description</span>
                      {amendments.length} emendas
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>target</span>
                      Meta: R$ 144M
                    </span>
                  </div>
                </div>

                {/* Right side - Circular progress */}
                <div className="flex items-center gap-6">
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "128px", height: "128px" }}>
                    <svg width="128" height="128" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke="#93c5fd"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(Number(porcentagemFormatada), 100) * 3.267} 326.7`}
                      />
                    </svg>
                    <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff" }}>{loading ? "--" : porcentagemFormatada}%</span>
                      <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#93c5fd" }}>utilizado</span>
                    </div>
                  </div>

                  {/* Bar breakdown */}
                  <div className="hidden md:flex" style={{ flexDirection: "column", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", color: "#93c5fd" }}>Cadastrado</span>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: "bold", color: "#ffffff" }}>{loading ? "--" : porcentagemFormatada}%</span>
                      </div>
                      <div style={{ height: "8px", width: "160px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                        <div
                          style={{ height: "100%", borderRadius: "9999px", background: "linear-gradient(to right, #93c5fd, #ffffff)", transition: "width 1s ease-out", width: `${Math.min(Number(porcentagemFormatada), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", color: "#93c5fd" }}>Restante</span>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: "bold", color: "#ffffff" }}>{loading ? "--" : (100 - Math.min(Number(porcentagemFormatada), 100)).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: "8px", width: "160px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                        <div
                          style={{ height: "100%", borderRadius: "9999px", background: "linear-gradient(to right, #fcd34d, #f59e0b)", transition: "width 1s ease-out", width: `${100 - Math.min(Number(porcentagemFormatada), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((stat, index) => (
              <div key={index} className="relative overflow-hidden rounded-[16px] bg-white border border-slate-100 p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1">
                <div className="mb-4 flex items-start justify-between">
                  <p className="font-mono text-sm uppercase tracking-widest text-slate-500">{stat.label}</p>
                  <span className={`material-symbols-outlined text-${stat.color}-500`}>{stat.icon}</span>
                </div>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="font-heading text-4xl font-bold text-slate-800">{stat.value}</h3>
                  {stat.trend && <span className={`font-mono text-sm text-${stat.color}-600 bg-${stat.color}-50 px-2 py-1 rounded`}>{stat.trend}</span>}
                  {stat.total && <span className="text-lg text-slate-400">{stat.total}</span>}
                </div>

                {stat.value.includes("%") && (
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 mt-4">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: stat.value }}></div>
                  </div>
                )}

                {stat.details && (
                  <div className="flex gap-2 mt-4">
                    {stat.details.map((detail: { label: string; color: string }, idx: number) => (
                      <span key={idx} className={`rounded-lg bg-${detail.color}-50 px-2.5 py-1 text-[10px] font-bold uppercase text-${detail.color}-600`}>
                        {detail.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
              <div className="group relative h-[540px] overflow-hidden rounded-[16px] border border-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)] bg-slate-100">
                {/* Iframe OpenStreetMap Osasco */}
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-46.8288803100586%2C-23.57008688863615%2C-46.745109558105476%2C-23.504449880472405&amp;layer=mapnik&amp;marker=-23.537274%2C-46.787"
                  className="absolute inset-0 h-full w-full grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                ></iframe>

                <div className="absolute bottom-6 left-6 flex gap-1 rounded-xl border border-white/50 bg-white/90 p-1 backdrop-blur-[8px] shadow-lg">
                  <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white hover:text-blue-600">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                  <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white hover:text-blue-600">
                    <span className="material-symbols-outlined text-[20px]">remove</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-10 lg:col-span-4">
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-tight text-slate-800">Investimento por Setor</h2>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-4 text-slate-400">Carregando dados...</div>
                  ) : sectorStats.length > 0 ? (
                    sectorStats.map((sector) => (
                      <Link key={sector.name} href={`/projetos?sector=${sector.name}`} className={`group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-white p-4 transition-all hover:border-${sector.color}-100 hover:bg-${sector.color}-50/50`}>
                        <div className="flex items-center gap-4">
                          <div className={`rounded-xl bg-${sector.color}-50 p-2.5 text-${sector.color}-600 transition-colors group-hover:bg-${sector.color}-600 group-hover:text-white`}>
                            <span className="material-symbols-outlined">{sector.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{sector.name}</p>
                            <p className="font-mono text-xs text-slate-400">{sector.count} Projetos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{sector.percentage}%</p>
                          <p className="text-[10px] uppercase text-slate-400">Do total</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400">
                      <p>Nenhum dado categorizado encontrado.</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold uppercase tracking-tight text-slate-800">Atividade Recente</h2>
                      <a href="/projetos" className="text-xs font-bold text-blue-600 hover:text-blue-700">VER TODAS</a>
                    </div>
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-4 text-slate-400">Carregando...</div>
                      ) : amendments.length > 0 ? (
                        amendments.slice(0, 5).map((emenda: any, idx: number) => {
                          // Calcular tempo relativo
                          const createdDate = new Date(emenda.createdAt);
                          const now = new Date();
                          const diffMs = now.getTime() - createdDate.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          let timeLabel = "HOJE";
                          if (diffDays === 1) timeLabel = "ONTEM";
                          else if (diffDays > 1 && diffDays < 7) timeLabel = `${diffDays} DIAS ATRÁS`;
                          else if (diffDays >= 7) timeLabel = createdDate.toLocaleDateString("pt-BR");

                          // Cor do status
                          const statusColor = emenda.status === "concluido" ? "bg-teal-500"
                            : emenda.status === "em_andamento" ? "bg-amber-500"
                              : emenda.status === "cancelado" ? "bg-red-500"
                                : "bg-blue-500";

                          const title = emenda.objeto || emenda.finalidade || `Emenda ${emenda.numeroEmenda || ""}`;
                          const subtitle = emenda.categoria ? `${emenda.categoria} • ${emenda.autor || emenda.responsavelNome || ""}` : (emenda.autor || emenda.responsavelNome || "Sem detalhes");

                          return (
                            <a key={emenda.id || idx} href={`/projetos/${emenda.id}`} className="flex gap-4 rounded-2xl border border-slate-100 bg-white/60 p-4 transition-colors hover:border-blue-200 cursor-pointer">
                              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${statusColor}`}></div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                  <p className="font-mono text-[10px] text-slate-400">{emenda.numeroEmenda || `#${(idx + 1).toString().padStart(3, "0")}`} • {timeLabel}</p>
                                  <span className="material-symbols-outlined text-[16px] text-slate-300">history</span>
                                </div>
                                <p className="text-sm font-bold leading-tight text-slate-800">{title}</p>
                                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{subtitle}</p>
                              </div>
                            </a>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-slate-400">
                          <p>Nenhuma emenda cadastrada ainda.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-mono text-xs text-slate-400">
            © 2026 Portal das Emendas Osasco • Plataforma de Auditoria Participativa
          </p>
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
