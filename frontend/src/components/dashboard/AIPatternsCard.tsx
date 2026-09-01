'use client';

import { Sparkles, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface PatternItem {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  supportingMetrics: string[];
}

interface AIPatternsCardProps {
  status: { enabled: boolean; provider: string; model: string; mode: string };
  patterns: PatternItem[];
}

export function AIPatternsCard({ status, patterns }: AIPatternsCardProps) {
  const isOnline = status.mode === 'LLM';

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-tight">AI Multi-Agent Intelligence Layer</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                ● {isOnline ? 'AI INTELLIGENCE ONLINE' : 'DETERMINISTIC FALLBACK'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Provider: <span className="text-slate-200">{status.provider}</span> · Model: <span className="text-slate-200">{status.model}</span>
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-[#0c1220] px-3 py-1.5 rounded-xl border border-[#1e2d4a]">
          Governance: <span className="text-emerald-400 font-bold">PolicyGate Authoritative</span>
        </div>
      </div>

      {/* AI Pattern Insights */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-Time AI Pattern Insights (Database Metrics)</span>
        </h4>

        {patterns.length === 0 ? (
          <p className="text-xs text-slate-400">Analyzing transaction batch for failure clusters...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patterns.map((p, i) => {
              const isHigh = p.severity === 'high';
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#0c1220]/80 border border-[#1e2d4a] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{p.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                        isHigh
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {p.severity} severity
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.supportingMetrics.map((m, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
