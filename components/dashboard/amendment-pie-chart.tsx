"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency, parseCurrency, getCategoryLabel } from "@/lib/amendments-utils";

interface AmendmentPieChartProps {
  amendments: any[];
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EC4899", "#8B5CF6", "#14B8A6", "#94A3B8"];

export default function AmendmentPieChart({ amendments }: AmendmentPieChartProps) {
  const data = React.useMemo(() => {
    const sectorMap: Record<string, number> = {};
    let totalValue = 0;

    amendments.forEach((a) => {
      const sector = getCategoryLabel(a.categoria) || "Outros";
      const valor = parseCurrency(a.valor);
      sectorMap[sector] = (sectorMap[sector] || 0) + valor;
      totalValue += valor;
    });

    return Object.entries(sectorMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 sectors
  }, [amendments]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full min-h-[450px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <span className="material-symbols-outlined text-sm">payments</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Distribuição Financeira por Setor</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Volume de recursos por área</p>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }: any) => percent > 0.05 ? `${name}` : ""}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl">
                      <p className="text-xs font-black text-slate-800 uppercase mb-1">{item.name}</p>
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(item.value)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{item.percentage.toFixed(1)}% do total</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="bottom"
              layout="horizontal"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry: any) => {
                const item = data.find(d => d.name === value);
                return (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {value} ({item?.percentage.toFixed(0)}%)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center px-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dados consolidados</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <span className="text-[9px] font-black uppercase tracking-tighter">Budget 2026</span>
          </div>
      </div>
    </div>
  );
}
