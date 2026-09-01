'use client';

import { Sparkles, User, Zap, ShieldCheck, FileText, AlertCircle, Cpu, CheckCircle2 } from 'lucide-react';

interface AIAnalysis {
  transactionId: string;
  aiMode: string;
  provider: string;
  model: string;
  failureAnalysis?: {
    primaryCause: string;
    confidence: number;
    signals: string[];
    explanation: string;
    recommendedRecoveryContext: string;
  };
  customerIntelligence?: {
    customerSegment: string;
    behaviorSummary: string;
    recoveryContext: string;
    riskSignals: string[];
    confidence: number;
  };
  recoveryRecommendation?: {
    recommendation: string;
    reasoning: string;
    supportingSignals: string[];
    confidence: number;
  };
  decisionExplanation?: {
    summary: string;
    whySelected: string;
    whyAlternativesWereRejected: string[];
    policyExplanation: string;
    riskExplanation: string;
  };
}

export function AITransactionPanel({ analysis }: { analysis: AIAnalysis | null }) {
  if (!analysis) return null;

  const isOnline = analysis.aiMode === 'LLM';

  return (
    <div className="space-y-6">
      {/* AI Header & Governance Distinction Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">AI Multi-Agent Intelligence Trace</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  ● {isOnline ? 'AI ONLINE (GROQ)' : 'DETERMINISTIC FALLBACK'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Provider: <span className="text-slate-200">{analysis.provider}</span> · Model:{' '}
                <span className="text-slate-200">{analysis.model}</span>
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold text-center">
            AI RECOMMENDATION ≠ SYSTEM DECISION
          </div>
        </div>

        {/* Hackathon Governance Motto Banner */}
        <div className="p-2.5 rounded-xl bg-[#0c1220] border border-[#1e2d4a] text-xs text-slate-300 flex items-center justify-between font-mono">
          <span className="text-indigo-400 font-bold">RECOVERIQ ARCHITECTURE:</span>
          <span className="text-slate-300">
            AI recommends <span className="text-slate-500">➔</span> Mathematics decides{' '}
            <span className="text-slate-500">➔</span> Policy governs <span className="text-slate-500">➔</span> Execution acts
          </span>
        </div>
      </div>

      {/* 5-Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent #1: Failure Analysis Agent */}
        {analysis.failureAnalysis && (
          <div className="card p-5 border border-indigo-500/30 bg-[#0c1220]/90">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Agent #1 — Failure Analysis</span>
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {(analysis.failureAnalysis.confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Interpreted Primary Cause</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">
                  {analysis.failureAnalysis.primaryCause.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>

              <p className="text-slate-300 leading-relaxed bg-[#131b2e]/50 p-2.5 rounded-xl border border-[#1e2d4a]">
                {analysis.failureAnalysis.explanation}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {analysis.failureAnalysis.signals.map((sig, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agent #2: Customer Intelligence Agent */}
        {analysis.customerIntelligence && (
          <div className="card p-5 border border-blue-500/30 bg-[#0c1220]/90">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>Agent #2 — Customer Intelligence</span>
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                {(analysis.customerIntelligence.confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Identified Segment</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">
                  {analysis.customerIntelligence.customerSegment}
                </p>
              </div>

              <p className="text-slate-300 leading-relaxed bg-[#131b2e]/50 p-2.5 rounded-xl border border-[#1e2d4a]">
                {analysis.customerIntelligence.behaviorSummary}
              </p>

              <p className="text-[11px] text-slate-400 italic">
                Context: {analysis.customerIntelligence.recoveryContext}
              </p>
            </div>
          </div>
        )}

        {/* Agent #3: Recovery Strategy Recommendation */}
        {analysis.recoveryRecommendation && (
          <div className="card p-5 border border-emerald-500/30 bg-[#0c1220]/90 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Agent #3 — AI Strategy Recommendation (Advisory Only)</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                  RECOMMENDATION: {analysis.recoveryRecommendation.recommendation}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {(analysis.recoveryRecommendation.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#131b2e]/60 p-3 rounded-xl border border-[#1e2d4a] mb-3">
              {analysis.recoveryRecommendation.reasoning}
            </p>

            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 font-mono mb-3">
              💡 <strong>AI vs EV Engine:</strong> AI recommendations are advisory. The Expected Value Engine independently evaluates all recovery candidates and selects the action with the highest net expected value.
            </div>

            <div className="flex flex-wrap gap-1.5">
              {analysis.recoveryRecommendation.supportingSignals.map((sig, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  ✓ {sig}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Agent #4: Decision Explanation Agent */}
        {analysis.decisionExplanation && (
          <div className="card p-5 border border-purple-500/30 bg-[#0c1220]/90 md:col-span-2">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Agent #4 — Post-Decision Explanation & Risk Governance</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                <p className="font-bold text-slate-200 mb-1">Executive Summary</p>
                <p className="text-slate-300 leading-relaxed">{analysis.decisionExplanation.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#131b2e]/50 border border-[#1e2d4a]">
                  <p className="font-bold text-emerald-400 mb-1">Why Action Was Mathematically Selected</p>
                  <p className="text-slate-300">{analysis.decisionExplanation.whySelected}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#131b2e]/50 border border-[#1e2d4a]">
                  <p className="font-bold text-amber-400 mb-1">Policy & Risk Governance Check</p>
                  <p className="text-slate-300">{analysis.decisionExplanation.policyExplanation}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
