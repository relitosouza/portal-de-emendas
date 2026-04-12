"use client";

import React from "react";
import { ManagementAmendment } from "@/lib/management-api";

interface ComplianceModuleProps {
  data: ManagementAmendment;
}

export default function ComplianceModule({ data }: ComplianceModuleProps) {
  const { vistorias, pareceres, checklist, rendimentos } = data;
  
  const totalRendimentos = rendimentos?.reduce((acc, r) => acc + r.valor, 0) || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "FAVORAVEL": return "check_circle";
      case "RESSALVA": return "warning";
      case "DESFAVORAVEL": return "error";
      default: return "info";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FAVORAVEL": return "text-emerald-500";
      case "RESSALVA": return "text-amber-500";
      case "DESFAVORAVEL": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Title and Compliance Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">verified_user</span>
            Transparência de Gestão & Integridade
          </h3>
          <p className="text-slate-500 text-sm mt-1">Conformidade com as diretrizes do TCE-SP (Item XIV e XVI)</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          <span className="text-xs font-bold uppercase tracking-widest text-white">Auditoria Ativa</span>
        </div>
      </div>

      {/* Grid for Vistorias and Pareceres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Vistorias (Physical Progress) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined">camera_enhance</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Vistorias de Campo</h4>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Comprovação Física</p>
            </div>
          </div>

          <div className="space-y-4">
            {vistorias && vistorias.length > 0 ? (
              vistorias.map((v, i) => (
                <div key={i} className="group relative pl-6 border-l-2 border-slate-100 pb-2 last:pb-0">
                  <div className="absolute -left-[5px] top-0 size-2 rounded-full bg-orange-400 ring-4 ring-white"></div>
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-bold text-slate-700">{new Date(v.data).toLocaleDateString('pt-BR')}</p>
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      {v.percentualFisico}% concluído
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 italic">{v.observacao}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-400 font-medium">Técnico: {v.tecnico}</p>
                    {v.laudoUrl && (
                      <a href={v.laudoUrl} target="_blank" className="text-[10px] font-bold text-orange-600 flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-xs">picture_as_pdf</span> Laudo Formal
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">pending_actions</span>
                <p className="text-xs text-slate-400 font-medium">Nenhuma vistoria registrada até o momento</p>
              </div>
            )}
          </div>
        </div>

        {/* Pareceres (Technical/Legal opinions) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Pareceres Oficiais</h4>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Análise e Aprovação</p>
            </div>
          </div>

          <div className="space-y-4">
            {pareceres && pareceres.length > 0 ? (
              pareceres.map((p, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-4">
                  <div className={`mt-1 material-symbols-outlined ${getStatusColor(p.conclusao)}`}>
                    {getStatusIcon(p.conclusao)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-slate-800">{p.tipo}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{p.descricao}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-semibold text-slate-400">{p.responsavel}</p>
                      {p.documentoUrl && (
                        <a href={p.documentoUrl} target="_blank" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">download</span> PDF Original
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">find_in_page</span>
                <p className="text-xs text-slate-400 font-medium">Pareceres técnicos em fase de elaboração</p>
              </div>
            )}
          </div>
        </div>

        {/* Rendimentos (Financial Returns - Item X) */}
        {totalRendimentos > 0 && (
          <div className="lg:col-span-2 bg-emerald-50 rounded-2xl border border-emerald-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div>
                <h4 className="font-bold text-emerald-900">Rendimentos Financeiros</h4>
                <p className="text-xs text-emerald-600">Aplicação em conta bancária específica (Item X TCE-SP)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-700">R$ {totalRendimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Saldo de Rendimentos Acumulado</p>
            </div>
          </div>
        )}
      </div>

      {/* Checklist de Auditoria Section */}
      {checklist && (
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-emerald-400">fact_check</span>
              </div>
              <div>
                <h4 className="font-bold text-lg">Checklist de Auditoria (TCE-SP)</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Validado pela Controladoria Municipal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-10">
              {[
                { label: "Plano de Trabalho Adequado", value: checklist.planoTrabalhoAdequado },
                { label: "Compatibilidade Orçamentária", value: checklist.orcamentoCompativel },
                { label: "Regularidade Licitatória", value: checklist.licitacaoRegular },
                { label: "Inexistência de Conflito de Interesses", value: checklist.inexistenciaConflito },
                { label: "Aderência Físico-Financeira", value: checklist.aderenciaFisicoFinanceira },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className={`size-6 rounded-full flex items-center justify-center transition-colors ${item.value ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-slate-500'}`}>
                    <span className="material-symbols-outlined text-[18px]">{item.value ? 'check' : 'close'}</span>
                  </div>
                  <span className={`text-sm font-medium ${item.value ? 'text-slate-100' : 'text-slate-500'}`}>{item.label}</span>
                </div>
              ))}
            </div>

            {checklist.observacoes && (
              <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5 italic">
                <p className="text-xs text-slate-400">
                   <span className="font-bold uppercase text-[9px] mr-2">Obs:</span>
                   {checklist.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
