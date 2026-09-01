'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { formatINRCompact } from '@/lib/utils';
import { TrendingDown, PieChart } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981'];

interface LeakageItem {
  name: string;
  value: number;
}

export function LeakageChart({ data }: { data: LeakageItem[] }) {
  if (!data || !data.length) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-500">
        <PieChart className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No leakage data computed yet</p>
      </div>
    );
  }

  const totalLeakage = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-4">
      {/* Leakage Metrics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[#0c1220] border border-[#1e2d4a]">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total At-Risk Value</p>
          <p className="text-lg font-bold text-slate-100 mt-0.5">{formatINRCompact(totalLeakage)}</p>
        </div>
        {data.map((item, idx) => (
          <div key={item.name} className="p-3 rounded-xl bg-[#0c1220] border border-[#1e2d4a] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{item.name}</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5">{formatINRCompact(item.value)}</p>
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
          </div>
        ))}
      </div>

      {/* Bar Chart Visualization */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e2d4a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e2d4a' }}
              tickLine={false}
              tickFormatter={(val) => formatINRCompact(val)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataItem = payload[0].payload as LeakageItem;
                  return (
                    <div className="p-3 rounded-xl bg-[#0c1220] border border-[#1e2d4a] shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{dataItem.name}</p>
                      <p className="text-blue-400 font-mono font-bold">{formatINRCompact(dataItem.value)}</p>
                      <p className="text-[10px] text-slate-400">
                        {((dataItem.value / (totalLeakage || 1)) * 100).toFixed(1)}% of total risk volume
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
