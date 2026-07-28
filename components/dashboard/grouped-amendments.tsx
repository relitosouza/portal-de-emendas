"use client";

import React from "react";
import Link from "next/link";
import { findVereadorPhoto, formatCurrency, parseCurrency, getCategoryLabel } from "@/lib/amendments-utils";
import type { Amendment } from "@/lib/store";
import { getSectorColor } from "@/lib/sector-colors";
import { getEffectiveStatus } from "@/lib/status-mapper";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, TrendingUp } from "lucide-react";

const PROGRESS_MAP: Record<string, number> = {
  "Não Iniciada": 0,
  "Em Análise": 12,
  "Elaboração": 25,
  "Viabilização": 37,
  "Contratação": 50,
  "Execução": 75,
  "Executada": 100,
  "Prestação de Contas": 100,
  "Cancelada": 0
};

interface Participant {
  id: string;
  nome: string;
  valor: string;
  valorNum: number;
  foto?: string;
  protocolo: string;
  naturezaDespesa: string;
}

interface GroupedData {
  objeto: string;
  sector: string;
  valorTotal: number;
  progress: number;
  participantes: Participant[];
}

interface GroupedAmendmentsProps {
  amendments: Amendment[];
  initialLimit?: number;
}

export default function GroupedAmendments({ amendments, initialLimit = 3 }: GroupedAmendmentsProps) {
  const [visibleCount, setVisibleCount] = React.useState(initialLimit);

  const grouped = React.useMemo(() => {
    const map: Record<string, GroupedData> = {};

    amendments.forEach((a) => {
      const key = (a.objeto || a.title || "Sem Objetivo").trim();
      const sector = getCategoryLabel(a.categoria) || "Infraestrutura";
      const valor = parseCurrency(a.valor);
      const autor = a.autor || a.responsavelNome || "Não informado";

      if (!map[key]) {
        map[key] = {
          objeto: key,
          sector,
          valorTotal: 0,
          progress: 0,
          participantes: [],
        };
      }

      const status = getEffectiveStatus(a.status, {
        empenhado: a.empenhado,
        liquidado: a.liquidado,
        pago: a.pago,
      });
      map[key].progress += (PROGRESS_MAP[status] || 0);
      map[key].valorTotal += valor;
      map[key].participantes.push({
        id: a.id,
        nome: autor,
        valor: formatCurrency(valor),
        valorNum: valor,
        foto: findVereadorPhoto(autor),
        protocolo: a.numeroEmenda || a.id || "---",
        naturezaDespesa: a.naturezaDespesa || "Não informado",
      });
    });

    // Final processing: sort participants by value and calculate average progress
    Object.values(map).forEach(group => {
      group.participantes.sort((a, b) => b.valorNum - a.valorNum);
      group.progress = Math.round(group.progress / group.participantes.length);
    });

    return Object.values(map).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [amendments]);

  return (
    <div className="space-y-4 animate-fade-in transition-all duration-500">
      <div className="grid grid-cols-1 gap-8">
        {grouped.slice(0, visibleCount).map((group, idx) => (
          <GroupedAmendmentCard key={idx} group={group} />
        ))}
      </div>
      
      {grouped.length > initialLimit && (
        <button
          onClick={() => {
            if (visibleCount === 3) setVisibleCount(6);
            else if (visibleCount === 6 && grouped.length > 6) setVisibleCount(grouped.length);
            else setVisibleCount(3);
          }}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-300 mx-auto block font-bold shadow-lg shadow-blue-500/20 active:scale-95"
        >
          {visibleCount === 3 ? "Ver mais emendas" : 
           (visibleCount === 6 && grouped.length > 6) ? "Mostrar restante da lista" : 
           "Recolher lista"}
        </button>
      )}
    </div>
  );
}

function GroupedAmendmentCard({ group }: { group: GroupedData }) {
  const sc = getSectorColor(group.sector);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 overflow-hidden flex flex-col group">
      {/* Topo */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="min-w-0">
            <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-blue-600">Objetivo</p>
            <Link
              href={`/projetos?view=grouped&search=${encodeURIComponent(group.objeto)}`}
              className="text-lg font-extrabold leading-tight text-slate-800 transition-colors group-hover:text-blue-600 hover:underline"
            >
              {group.objeto}
            </Link>
          </div>
          <div className="text-right shrink-0">
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Valor Total</p>
             <p className="text-lg font-black text-blue-600">{formatCurrency(group.valorTotal)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none",
            sc.badgeBg, sc.badgeText
          )}>
            {group.sector}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <TrendingUp className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execução: {group.progress}%</span>
          </div>
        </div>

        {/* Barra de Progresso Compacta */}
        <div className="mt-4 w-full h-1 bg-slate-50 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-1000", sc.bar)}
            style={{ width: `${group.progress}%` }}
          />
        </div>
      </div>

      {/* Meio: Lista Técnica */}
      <div className="px-5 py-3 flex-1">
        <div className="space-y-1">
          <div className="grid grid-cols-[5%_45%_30%_20%] text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2">
            <span>#</span>
            <span>Autor e número da emenda</span>
            <span>Natureza da despesa</span>
            <span className="text-right">Valor</span>
          </div>
          
          {/* Top 5 Participants */}
          {group.participantes.slice(0, 5).map((p, i) => (
            <ParticipantRow key={i} p={p} index={i} />
          ))}

          {/* Remaining in Accordion */}
          {group.participantes.length > 5 && (
            <Accordion.Root type="single" collapsible className="w-full">
              <Accordion.Item value="remaining" className="border-none">
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <div className="space-y-1 pt-1 mt-1">
                    {group.participantes.slice(5).map((p, i) => (
                      <ParticipantRow key={i + 5} p={p} index={i + 5} />
                    ))}
                  </div>
                </Accordion.Content>
                <Accordion.Trigger asChild>
                  <button className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:bg-slate-50 rounded-lg transition-all group/trigger mt-1">
                    <span className="group-data-[state=open]/trigger:hidden">Ver mais (+{group.participantes.length - 5})</span>
                    <span className="hidden group-data-[state=open]/trigger:block">Recolher</span>
                    <ChevronDown className="w-2.5 h-2.5 transition-transform duration-300 group-data-[state=open]/trigger:rotate-180" />
                  </button>
                </Accordion.Trigger>
              </Accordion.Item>
            </Accordion.Root>
          )}
        </div>
      </div>

      {/* Rodapé: Avatar Stack */}
      <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-50">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide">
            Autores neste objetivo
          <span className="inline-flex items-center justify-center size-4 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black">
            {group.participantes.length}
          </span>
          </p>
          <Link
            href={`/projetos/relatorio-objetivos?search=${encodeURIComponent(group.objeto)}`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">print</span>
            Imprimir objetivo
          </Link>
        </div>
        
        <div className="flex items-center">
          <div className="flex -space-x-4 overflow-hidden">
            <Tooltip.Provider>
              {group.participantes.slice(0, 5).map((v) => (
                <Tooltip.Root key={v.id}>
                  <Tooltip.Trigger asChild>
                    <div className="relative group/avatar cursor-pointer">
                      <div className="size-12 rounded-full ring-4 ring-white shadow-sm overflow-hidden bg-slate-200 transition-transform hover:scale-110 hover:z-20 relative">
                        {v.foto ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={v.foto}
                            alt={v.nome}
                            className="w-full h-full object-cover"
                            style={v.nome.toLowerCase().includes("fiorilo") ? { objectPosition: "center 15%" } : undefined}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                            {v.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100]"
                      sideOffset={5}
                    >
                      {v.nome}
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </Tooltip.Provider>

            {group.participantes.length > 5 && (
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-sm font-black ring-4 ring-white shadow-sm z-10">
                +{group.participantes.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantRow({ p, index }: { p: Participant; index: number }) {
  return (
    <div className="grid grid-cols-[5%_45%_30%_20%] items-center py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group/row">
      <span className="font-mono text-[10px] tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</span>
      <div className="flex items-center gap-2 truncate pr-2">
        <Link 
          href={`/projetos?search=${encodeURIComponent(p.nome)}`}
          className="text-[13px] font-bold text-slate-700 truncate group-hover/row:text-blue-600 transition-colors hover:underline"
        >
          {p.nome}<span className="ml-1 text-[10px] font-normal text-slate-500">· {p.protocolo}</span>
        </Link>
      </div>
      <span className="truncate pr-2 text-[10px] font-medium text-slate-500" title={p.naturezaDespesa}>{p.naturezaDespesa}</span>
      <Link
        href={`/projetos/${p.id}`}
        className="text-right text-[11px] font-mono font-bold text-slate-700 hover:text-blue-500 transition-colors hover:underline"
      >{p.valor}</Link>
    </div>
  );
}
