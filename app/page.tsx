"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/shared/navbar";
import CouncilorRanking from "@/components/dashboard/councilor-ranking";
import { useCountUp } from "@/hooks/useCountUp";
import { getSectorColor } from "@/lib/sector-colors";
import { getNormalizedStatus } from "@/lib/status-mapper";
import { CATEGORY_MAP, parseCurrency as parseValor, findVereadorPhoto } from "@/lib/amendments-utils";
import GroupedAmendments from "@/components/dashboard/grouped-amendments";
import AmendmentPieChart from "@/components/dashboard/amendment-pie-chart";
import SectorRanking from "@/components/dashboard/sector-ranking";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [amendments, setAmendments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAmbito, setSelectedAmbito] = useState<string | null>(null);

  const filteredAmendments = amendments.filter((e: any) => {
    return selectedAmbito ? (e.ambito ? e.ambito.toLowerCase() === selectedAmbito.toLowerCase() : false) : true;
  });

  const totalReservado = filteredAmendments.reduce((acc, e) => {
    const res = parseValor(e.reservado);
    const emp = parseValor(e.empenhado);
    // O valor "sai" da reserva quando é empenhado
    return acc + Math.max(0, res - emp);
  }, 0);
  const totalEmpenhado = filteredAmendments.reduce((acc, e) => acc + parseValor(e.empenhado), 0);
  const totalLiquidado = filteredAmendments.reduce((acc, e) => acc + parseValor(e.liquidado), 0);
  const totalPago = filteredAmendments.reduce((acc, e) => acc + parseValor(e.pago), 0);
  const totalValor = filteredAmendments.reduce((acc: number, e: any) => acc + parseValor(e.valor), 0);

  const porcentagemEmpenhada = totalValor > 0 ? (totalEmpenhado / totalValor) * 100 : 0;
  const porcentagemFormatada = porcentagemEmpenhada.toFixed(1);
  const porcentagemReservada = totalValor > 0 ? (totalReservado / totalValor) * 100 : 0;
  const porcentagemReservadaFormatada = porcentagemReservada.toFixed(1);
  const porcentagemLiquidada = totalValor > 0 ? (totalLiquidado / totalValor) * 100 : 0;
  const porcentagemLiquidadaFormatada = porcentagemLiquidada.toFixed(1);
  const porcentagemPaga = totalValor > 0 ? (totalPago / totalValor) * 100 : 0;
  const porcentagemPagaFormatada = porcentagemPaga.toFixed(1);


  // Pago percentage for the circle
  const pagoPct = Math.min(Number(porcentagemPagaFormatada), 100);
  const circumference = 2 * Math.PI * 42; // r=42
  const strokeDashoffset = circumference - (pagoPct / 100) * circumference;

  // Animated counters (2s ease-out)
  const animatedValor = useCountUp(loading ? 0 : totalValor, 2000);
  const animatedReservado = useCountUp(loading ? 0 : totalReservado, 2000);
  const animatedEmpenhado = useCountUp(loading ? 0 : totalEmpenhado, 2000);
  const animatedLiquidado = useCountUp(loading ? 0 : totalLiquidado, 2000);
  const animatedPago = useCountUp(loading ? 0 : totalPago, 2000);
  const animatedCount = useCountUp(loading ? 0 : filteredAmendments.length, 2000);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      router.push(`/projetos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      router.push(`/projetos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Group amendments by author
  const getAuthorRanking = () => {
    const authorMap: Record<string, { count: number; foto?: string }> = {};
    filteredAmendments.forEach((e: any) => {
      const autor = e.autor || e.responsavelNome || "Não informado";
      if (!authorMap[autor]) {
        authorMap[autor] = { 
          count: 0, 
          foto: e.autorFoto || e.responsavelFoto || findVereadorPhoto(autor)
        };
      }
      authorMap[autor].count += 1;
    });
    return Object.entries(authorMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        foto: data.foto,
        initials: name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Map sector categories
  const categoryMap = CATEGORY_MAP;

  // Group amendments by sector
  const getSectorData = () => {
    const sectorMap: Record<string, { count: number, valor: number, catNum: string }> = {};
    filteredAmendments.forEach((e: any) => {
      let catNum = e.categoria;
      // Handle cases where categoria might come as "10 - Saúde" or just "10"
      if (typeof catNum === "string" && catNum.includes(" - ")) {
        catNum = catNum.split(" - ")[0].trim();
      }

      const cat = catNum ? (categoryMap[String(catNum)] || `Categoria ${catNum}`) : "Sem Categoria";
      if (!sectorMap[cat]) sectorMap[cat] = { count: 0, valor: 0, catNum: String(catNum || "") };
      sectorMap[cat].count += 1;
      sectorMap[cat].valor += parseValor(e.valor);
    });
    return Object.entries(sectorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.valor - a.valor);
  };

  useEffect(() => {
    async function fetchData(isRefresh = false) {
      if (isRefresh) setIsRefreshing(true);
      try {
        const res = await fetch("/api/amendments?limit=1000");
        const data = await res.json();
        const amendments = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(amendments)) {
          setAmendments(amendments);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        if (isRefresh) setIsRefreshing(false);
      }
    }

    fetchData();
    const interval = setInterval(() => fetchData(true), 120000);
    return () => clearInterval(interval);
  }, []);

  const authorRanking = getAuthorRanking();
  const sectorData = getSectorData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8" aria-label="Conteúdo principal">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative group mb-6">
            <label htmlFor="busca-emendas" className="sr-only">
              Buscar emendas por autor, título ou valor
            </label>
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" aria-hidden="true">
              search
            </span>
            <input
              id="busca-emendas"
              className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-2xl shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              placeholder="Pesquisar por objetivo, autor ou número..."
              type="search"
              aria-label="Buscar emendas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
            {searchTerm.trim() && (
              <button
                onClick={handleSearchSubmit}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                aria-label="Buscar"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Selector de Âmbito (Municipal, Estadual, Federal) */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedAmbito(null)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                selectedAmbito === null
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setSelectedAmbito("Municipal")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                selectedAmbito === "Municipal"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
              )}
            >
              Municipais
            </button>
            <button
              onClick={() => setSelectedAmbito("Estadual")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                selectedAmbito === "Estadual"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
              )}
            >
              Estaduais
            </button>
            <button
              onClick={() => setSelectedAmbito("Federal")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                selectedAmbito === "Federal"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-500 hover:text-blue-500"
              )}
            >
              Federais
            </button>
          </div>
        </div>

        {/* Hero Card - Budget */}
        <section className="mb-10" aria-label="Resumo orçamentário das emendas">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-8 md:p-12 text-white shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" aria-hidden="true"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">account_balance_wallet</span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Emendas aprovadas</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-8" aria-live="polite" aria-atomic="true">
                  {loading ? "Carregando..." : animatedValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link href={selectedAmbito ? `/projetos?ambito=${selectedAmbito}` : "/projetos"} className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-sm">description</span>
                    <span className="text-sm font-semibold">{loading ? "..." : Math.round(animatedCount)} emendas</span>
                  </Link>
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2 border border-white/10">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span className="text-sm font-semibold">{loading ? "..." : `${porcentagemFormatada}% empenhado`}</span>
                  </div>
                </div>
                {/* Indicador de atualização */}
                {!loading && (
                  <div className="mt-4 flex items-center gap-2 opacity-70">
                    {isRefreshing ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                        <span className="text-xs font-semibold">Atualizando...</span>
                      </>
                    ) : lastUpdated ? (
                      <>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="text-xs font-semibold">
                          Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div
                  className="relative w-40 h-40 flex items-center justify-center"
                  role="img"
                  aria-label={loading ? "Carregando percentual pago" : `${porcentagemPagaFormatada}% do valor total já foi pago`}
                >
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" fill="transparent" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                    <circle
                      className="text-white transition-all duration-1000"
                      cx="50" cy="50" fill="transparent" r="42"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={loading ? circumference : strokeDashoffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
                    <span className="text-2xl font-black">{loading ? "--" : `${porcentagemPagaFormatada}%`}</span>
                    <span className="text-[10px] font-bold uppercase opacity-80">Pago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Cards - Now Full Width */}
        <section aria-label="Indicadores financeiros" className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href={selectedAmbito ? `/projetos?filtro=reservado&ambito=${selectedAmbito}` : "/projetos?filtro=reservado"} className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-amber-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0">Previsão</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Reservado</p>
                <h3 className="text-xl font-extrabold text-slate-800 mb-4 truncate">{loading ? "..." : animatedReservado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h3>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemReservadaFormatada), 100)}%` }} />
                </div>
              </div>
            </Link>

            <Link href={selectedAmbito ? `/projetos?filtro=empenhado&ambito=${selectedAmbito}` : "/projetos?filtro=empenhado"} className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0">Alocação</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Empenhado</p>
                <h3 className="text-xl font-extrabold text-slate-800 mb-4 truncate">{loading ? "..." : animatedEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h3>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemFormatada), 100)}%` }} />
                </div>
              </div>
            </Link>

            <Link href={selectedAmbito ? `/projetos?filtro=liquidado&ambito=${selectedAmbito}` : "/projetos?filtro=liquidado"} className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-indigo-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0">Execução</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Liquidado</p>
                <h3 className="text-xl font-extrabold text-slate-800 mb-4 truncate">{loading ? "..." : animatedLiquidado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h3>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemLiquidadaFormatada), 100)}%` }} />
                </div>
              </div>
            </Link>

            <Link href={selectedAmbito ? `/projetos?filtro=pago&ambito=${selectedAmbito}` : "/projetos?filtro=pago"} className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-emerald-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0">Fase Final</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pago</p>
                <h3 className="text-xl font-extrabold text-slate-800 mb-4 truncate">{loading ? "..." : animatedPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</h3>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemPagaFormatada), 100)}%` }} />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 1/3 (Moved from right to align with user prompt) */}
          <div className="space-y-6 flex flex-col">
            {/* Author Ranking */}
            {loading ? (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando Ranking...</span>
              </div>
            ) : (
              <CouncilorRanking councilors={authorRanking} />
            )}

            {/* Container for Sector + Pie Chart to balance height */}
            <div className="flex flex-col space-y-6">
              {/* Sector Ranking Card with Expansion */}
              <SectorRanking data={sectorData} loading={loading} />

              {/* New Pie Chart Card */}
              <AmendmentPieChart amendments={filteredAmendments} />
            </div>
          </div>

          {/* Right Column - 2/3 (Focus on the list now) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Grouped Amendments by Objective */}
            <section aria-label="Emendas agrupadas por objetivo" className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Emendas por Objetivo</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Agrupamento consolidado de investimentos</p>
                </div>
                <Link href={selectedAmbito ? `/projetos?view=grouped&ambito=${selectedAmbito}` : "/projetos?view=grouped"} className="text-sm font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  Ver todas <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  Carregando grupos...
                </div>
              ) : (
                <GroupedAmendments amendments={filteredAmendments} />
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brasao.png" alt="Brasão de Osasco" className="w-10 h-10 object-contain" />
            <span className="font-bold text-slate-400">Portal das Emendas - PMO © 2026 - Elaborado por Secretaria de Finanças</span>
          </div>
          <div className="flex gap-8">
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="https://transparencia.osasco.sp.gov.br/#/" target="_blank" rel="noopener noreferrer">Transparência</a>
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="https://transparencia.osasco.sp.gov.br/#/dados_abertos" target="_blank" rel="noopener noreferrer">Dados Abertos</a>
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
