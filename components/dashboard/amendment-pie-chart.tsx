"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const DATA = [
  { name: "Em Execução", value: 40, color: "#3B82F6" }, // Blue
  { name: "Aprovadas", value: 30, color: "#10B981" },    // Green
  { name: "Em Análise", value: 20, color: "#F59E0B" },    // Amber
  { name: "Canceladas", value: 10, color: "#94A3B8" },   // Slate/Gray
];

export default function AmendmentPieChart() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <span className="material-symbols-outlined text-sm">donut_large</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Distribuição Status</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Resumo da execução atual</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              formatter={(value: any) => [`${value}%`, 'Percentual']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              formatter={(value) => (
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50">
        <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atualizado agora</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
