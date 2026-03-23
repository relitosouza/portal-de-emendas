"use client";

import React, { useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import Link from "next/link";
import { ChevronDown, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSectorColor } from "@/lib/sector-colors";

interface SectorData {
  name: string;
  count: number;
  valor: number;
  catNum: string;
}

interface SectorRankingProps {
  data: SectorData[];
  loading?: boolean;
}

export default function SectorRanking({ data, loading }: SectorRankingProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando Setores...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="p-6 text-center text-slate-400">Nenhum setor encontrado.</div>;
  }

  const top5 = data.slice(0, 5);
  const remaining = data.slice(5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-0.5">Investimento por Setor</h3>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Distribuição por área</p>
        </div>
        <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
           <PieChart className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500">
        <div className="divide-y divide-slate-50">
          {top5.map((sector) => (
            <SectorItem key={sector.name} sector={sector} maxValor={data[0].valor} />
          ))}
        </div>

        {remaining.length > 0 && (
          <Accordion.Root
            type="single"
            collapsible
            onValueChange={(value) => setIsOpen(value === "item-1")}
          >
            <Accordion.Item value="item-1" className="border-none">
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up transition-all duration-300">
                <div className="divide-y divide-slate-50 border-t border-slate-50 bg-slate-50/20">
                  {remaining.map((sector) => (
                    <SectorItem key={sector.name} sector={sector} maxValor={data[0].valor} />
                  ))}
                </div>
              </Accordion.Content>
              
              <Accordion.Trigger asChild>
                <button 
                  className={cn(
                    "w-full p-4 flex items-center justify-center gap-2 group transition-all duration-300 cursor-pointer",
                    isOpen ? "bg-slate-100/50" : "bg-white hover:bg-slate-50"
                  )}
                >
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">
                    {isOpen ? "Recolher Investimentos" : "Ver Investimentos Completo"}
                  </span>
                  <div className={cn(
                    "w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 transition-transform duration-500",
                    isOpen && "rotate-180 bg-blue-600 text-white"
                  )}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>
              </Accordion.Trigger>
            </Accordion.Item>
          </Accordion.Root>
        )}
      </div>
    </div>
  );
}

function SectorItem({ sector, maxValor }: { sector: SectorData; maxValor: number }) {
  const sc = getSectorColor(sector.catNum);
  const widthPercent = Math.max((sector.valor / maxValor) * 100, 5);
  const valorFormatado = sector.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Link
      href={`/projetos?search=${encodeURIComponent(sector.name)}`}
      className="p-4 block hover:bg-blue-50/40 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className={cn("text-[11px] font-bold truncate pr-2 uppercase tracking-tight group-hover:text-blue-700 transition-colors", sc.badgeText)} title={sector.name}>
            {sector.name}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Setor de Atuação
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-black text-slate-700 leading-none">{sector.count} emendas</p>
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">{valorFormatado}</p>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", sc.bar)}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </Link>
  );
}
