"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/shared/navbar";
import { useCountUp } from "@/hooks/useCountUp";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [amendments, setAmendments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const parseValor = (v: any): number => {
    if (!v) return 0;
    if (typeof v === "number") return v;
    const cleaned = String(v)
      .replace(/R\$\s*/gi, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const totalReservado = amendments.reduce((acc, e) => acc + parseValor(e.reservado), 0);
  const totalEmpenhado = amendments.reduce((acc, e) => acc + parseValor(e.empenhado), 0);
  const totalLiquidado = amendments.reduce((acc, e) => acc + parseValor(e.liquidado), 0);
  const totalPago = amendments.reduce((acc, e) => acc + parseValor(e.pago), 0);
  const totalValor = amendments.reduce((acc: number, e: any) => acc + parseValor(e.valor), 0);

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
  const animatedCount = useCountUp(loading ? 0 : amendments.length, 2000);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      router.push(`/projetos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Group amendments by author
  const getAuthorRanking = () => {
    const authorMap: Record<string, number> = {};
    amendments.forEach((e: any) => {
      const autor = e.autor || e.responsavelNome || "Não informado";
      authorMap[autor] = (authorMap[autor] || 0) + 1;
    });
    return Object.entries(authorMap)
      .map(([name, count]) => ({
        name,
        count,
        initials: name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Map sector categories
  const categoryMap: Record<string, string> = {
    "1": "LEGISLATIVA",
    "2": "JUDICIÁRIA",
    "3": "ESSENCIAL À JUSTIÇA",
    "4": "ADMINISTRAÇÃO",
    "5": "DEFESA NACIONAL",
    "6": "SEGURANÇA PÚBLICA",
    "7": "RELAÇÕES EXTERIORES",
    "8": "ASSISTÊNCIA SOCIAL",
    "9": "PREVIDÊNCIA SOCIAL",
    "10": "SAÚDE",
    "11": "TRABALHO",
    "12": "EDUCAÇÃO",
    "13": "CULTURA",
    "14": "DIREITOS DA CIDADANIA",
    "15": "URBANISMO",
    "16": "HABITAÇÃO",
    "17": "SANEAMENTO",
    "18": "GESTÃO AMBIENTAL",
    "19": "CIÊNCIA E TECNOLOGIA",
    "20": "AGRICULTURA",
    "21": "ORGANIZAÇÃO AGRÁRIA",
    "22": "INDÚSTRIA",
    "23": "COMÉRCIO E SERVIÇOS",
    "24": "COMUNICAÇÕES",
    "25": "ENERGIA",
    "26": "TRANSPORTE",
    "27": "DESPORTO E LAZER",
    "28": "ENCARGOS ESPECIAIS",
    "99": "RESERVA DE CONTIGÊNCIA",
  };

  // Group amendments by sector
  const getSectorData = () => {
    const sectorMap: Record<string, { count: number, valor: number }> = {};
    amendments.forEach((e: any) => {
      let catNum = e.categoria;
      // Handle cases where categoria might come as "10 - Saúde" or just "10"
      if (typeof catNum === "string" && catNum.includes(" - ")) {
        catNum = catNum.split(" - ")[0].trim();
      }

      const cat = catNum ? (categoryMap[catNum] || `Categoria ${catNum}`) : "Sem Categoria";
      if (!sectorMap[cat]) sectorMap[cat] = { count: 0, valor: 0 };
      sectorMap[cat].count += 1;
      sectorMap[cat].valor += parseValor(e.valor);
    });
    return Object.entries(sectorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  };

  useEffect(() => {
    async function fetchData(isRefresh = false) {
      if (isRefresh) setIsRefreshing(true);
      try {
        const res = await fetch("/api/amendments");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAmendments(data);
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              search
            </span>
            <input
              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              placeholder="Pesquisar por autor, título ou valor..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        {/* Hero Card - Budget */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-8 md:p-12 text-white shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Emendas aprovadas</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-8">
                  {loading ? "Carregando..." : animatedValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link href="/projetos" className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-colors">
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
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{loading ? "--" : `${porcentagemPagaFormatada}%`}</span>
                    <span className="text-[10px] font-bold uppercase opacity-80">Pago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reservado */}
              <Link href="/projetos?filtro=reservado" className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-amber-300 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Previsão</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Reservado</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedReservado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemReservadaFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemReservadaFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Empenhado */}
              <Link href="/projetos?filtro=empenhado" className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-blue-300 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alocação Inicial</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Empenhado</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Liquidado */}
              <Link href="/projetos?filtro=liquidado" className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-indigo-300 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execução</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Liquidado</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedLiquidado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemLiquidadaFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemLiquidadaFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Pago */}
              <Link href="/projetos?filtro=pago" className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-emerald-300 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fase Final</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pago</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemPagaFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemPagaFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Recent Activities */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Atividades Recentes</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Emendas Cadastradas Recentemente</p>
                </div>
                <Link href="/projetos" className="text-sm font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  Ver histórico <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Carregando dados...</div>
                ) : amendments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">Nenhuma emenda cadastrada ainda.</div>
                ) : (
                  amendments.slice(0, 6).map((emenda: any, idx: number) => {
                    const title = emenda.objeto || emenda.finalidade || `Emenda ${emenda.numeroEmenda || ""}`;
                    const autor = emenda.autor || emenda.responsavelNome || "Sem autor";
                    const valor = parseValor(emenda.valor);
                    const valorFormatado = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                    const icons = ["folder_open", "description", "folder_managed"];
                    const colors = ["blue", "teal", "blue"];
                    const icon = icons[idx % icons.length];
                    const color = colors[idx % colors.length];

                    return (
                      <Link
                        key={emenda.id || idx}
                        href={`/projetos/${emenda.id}`}
                        className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6 transition-all duration-300 group hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.1)]`}
                      >
                        <div className={`w-14 h-14 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center shrink-0 group-hover:bg-${color}-600 group-hover:text-white transition-colors`}>
                          <span className="material-symbols-outlined text-2xl">{icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-800 truncate">{title}</h4>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-md tracking-wider shrink-0">
                              Novo
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">person</span> {autor}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="font-bold text-slate-700">{valorFormatado}</span>
                          </div>
                        </div>
                        <div className="hidden sm:block text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolo</p>
                          <p className="text-xs font-mono font-semibold text-slate-600">
                            #{emenda.numeroEmenda || `2026.${String(idx + 1).padStart(3, "0")}`}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Author Ranking */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Emendas por Autor</h3>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-6">Ranking de participações</p>
            </div>

            <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="p-6 text-center text-slate-400">Carregando...</div>
                ) : authorRanking.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">Nenhum autor encontrado.</div>
                ) : (
                  authorRanking.map((author) => (
                    <Link
                      href={`/projetos?search=${encodeURIComponent(author.name)}`}
                      key={author.name}
                      className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors cursor-pointer block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {author.initials}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{author.name}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-blue-500/20">
                        {String(author.count).padStart(2, "0")}
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <Link href="/projetos" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">
                  Ver ranking completo
                </Link>
              </div>
            </div>

            {/* Sector Card */}
            <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <span className="material-symbols-outlined text-sm">pie_chart</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Investimento por Setor</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {loading ? "Carregando dados..." : `${amendments.filter(a => a.categoria && a.categoria !== "Sem Categoria").length} categorizadas`}
                  </p>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="p-6 text-center text-slate-400">Carregando...</div>
                ) : sectorData.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">Nenhum setor encontrado.</div>
                ) : (
                  sectorData.map((sector, idx) => {
                    const colors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
                    const colorClass = colors[idx % colors.length];
                    const maxValor = sectorData[0].valor;
                    const widthPercent = Math.max((sector.valor / maxValor) * 100, 5);
                    const valorFormatado = sector.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

                    return (
                      <div key={sector.name} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-slate-700 truncate pr-2" title={sector.name}>{sector.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 text-right shrink-0">{sector.count} emendas<br />{valorFormatado}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colorClass} rounded-full`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <Link href="/projetos" className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline">
                  Ver análise completa
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brasao-osasco.png" alt="Brasão de Osasco" className="w-8 h-8 object-contain" />
            <span className="font-bold text-slate-400">Portal das Emendas - Prefeitura Municipal de Osasco © 2026</span>
          </div>
          <div className="flex gap-8">
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="https://transparencia.osasco.sp.gov.br/#/" target="_blank" rel="noopener noreferrer">Transparência</a>
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Privacidade</a>
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
