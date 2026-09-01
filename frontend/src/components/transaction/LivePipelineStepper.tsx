'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Cpu,
  Calculator,
  User,
  Zap,
  RotateCcw,
  FileText,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface StageData {
  id: string;
  title: string;
  subtitle: string;
  status: 'COMPLETED' | 'BLOCKED' | 'FAILED' | 'SKIPPED';
  data: Record<string, any>;
}

interface RecoveryRunTrace {
  transactionId: string;
  aiStatus: {
    mode: string;
    provider: string;
    model: string;
  };
  normalizedStatus: 'RECOVERED' | 'NO_ACTION' | 'BLOCKED' | 'ESCALATED' | 'FAILED';
  stages: StageData[];
  finalOutcome: {
    status: string;
    action: string;
    amountPaise: number;
    amountFormatted: string;
    recoveredAmountPaise: number;
    recoveredAmountFormatted: string;
    evFormatted: string;
    policyResult: string;
    blockReason: string | null;
    executionMode: string;
  };
  auditEvents: any[];
}

export function LivePipelineStepper({
  transactionId,
  onComplete,
}: {
  transactionId: string;
  onComplete?: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(null);
  const [trace, setTrace] = useState<RecoveryRunTrace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runLivePipeline = async () => {
    setIsRunning(true);
    setError(null);
    setActiveStageIndex(0);

    try {
      // Execute backend recovery engine trace synchronously
      const response = await api<RecoveryRunTrace>('/recovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, forceReprocess: true }),
      });

      setTrace(response);

      // Animate progressive stage transitions (~250ms interval) for visualization
      for (let i = 0; i < response.stages.length; i++) {
        setActiveStageIndex(i);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      setActiveStageIndex(response.stages.length - 1);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Live recovery run failed:', err);
      setError(err instanceof Error ? err.message : 'Pipeline execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECOVERED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> RECOVERED
          </span>
        );
      case 'NO_ACTION':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-500/20 text-slate-300 border border-slate-500/40 flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5" /> NO ACTION
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 font-mono">
            <Ban className="w-3.5 h-3.5" /> BLOCKED BY POLICY
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 font-mono">
            <ShieldAlert className="w-3.5 h-3.5" /> ESCALATED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono uppercase">
                Autonomous Recovery Pipeline
              </span>
              <span className="text-xs text-slate-400 font-mono">SIMULATED DEMO MODE</span>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" /> Live Recovery Engine — 10 Execution Stages
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 10-stage execution trace. Real backend Expected Value maximization & merchant constitution governance.
            </p>
          </div>

          <button
            onClick={runLivePipeline}
            disabled={isRunning}
            className={`px-6 py-3 rounded-xl font-mono text-xs font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              isRunning
                ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/40 cursor-wait opacity-80'
                : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white border border-indigo-400/30 shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>RECOVERY ENGINE RUNNING...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>RUN RECOVERY ENGINE</span>
              </>
            )}
          </button>
        </div>

        {/* Governance Motto */}
        <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2d4a] text-xs font-mono text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
            SYSTEM GOVERNANCE ARCHITECTURE:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap text-slate-300 text-[11px]">
            <span className="text-indigo-300 font-semibold">AI recommends</span>
            <span className="text-slate-500">➔</span>
            <span className="text-emerald-300 font-semibold">Mathematics decides</span>
            <span className="text-slate-500">➔</span>
            <span className="text-amber-300 font-semibold">Policy governs</span>
            <span className="text-slate-500">➔</span>
            <span className="text-blue-300 font-semibold">Execution acts</span>
            <span className="text-slate-500">➔</span>
            <span className="text-purple-300 font-semibold">Audit proves</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="font-bold">Recovery Pipeline Interrupted</p>
            <p className="text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {/* Stepper Timeline & Stage Details */}
      {trace && activeStageIndex !== null && (
        <div className="space-y-6">
          {/* Horizontal Stage Stepper Bar */}
          <div className="p-4 rounded-2xl bg-[#0c1220] border border-[#1e2d4a] overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px]">
              {trace.stages.map((stg, i) => {
                const isActive = activeStageIndex === i;
                const isPassed = activeStageIndex > i;

                return (
                  <div key={stg.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveStageIndex(i)}
                      className={`flex flex-col items-center gap-1.5 transition-all ${
                        isActive
                          ? 'scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-extrabold border transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/30'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-[#131b2e] text-slate-400 border-[#1e2d4a]'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : i + 1}
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-300 max-w-[70px] text-center truncate">
                        {stg.id}
                      </span>
                    </button>

                    {i < trace.stages.length - 1 && (
                      <div
                        className={`w-6 h-0.5 rounded transition-all ${
                          isPassed ? 'bg-emerald-500/50' : 'bg-slate-800'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Stage Data Card */}
          {trace.stages[activeStageIndex] && (
            <div className="card p-6 border border-indigo-500/30 bg-[#0c1220] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e2d4a]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                    #{activeStageIndex + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      {trace.stages[activeStageIndex].title}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {trace.stages[activeStageIndex].subtitle}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold self-start sm:self-auto">
                  STAGE {activeStageIndex + 1} / 10
                </span>
              </div>

              {/* Render Stage-Specific Content */}
              {/* STAGE 1: DETECT */}
              {trace.stages[activeStageIndex].id === 'DETECT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Transaction ID</p>
                    <p className="text-sm font-bold font-mono text-white mt-1">
                      {trace.stages[activeStageIndex].data.transactionId}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Transaction Amount</p>
                    <p className="text-sm font-bold font-mono text-emerald-400 mt-1">
                      {trace.stages[activeStageIndex].data.amountFormatted}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Payment Method</p>
                    <p className="text-sm font-bold font-mono text-blue-300 mt-1">
                      {trace.stages[activeStageIndex].data.paymentMethod}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Failure Reason Code</p>
                    <p className="text-sm font-bold font-mono text-amber-400 mt-1">
                      {trace.stages[activeStageIndex].data.failureReasonCode}
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 2: AI ANALYSIS */}
              {trace.stages[activeStageIndex].id === 'AI_ANALYSIS' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-[#131b2e] border border-[#1e2d4a] flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Canonical Root Cause</p>
                      <p className="text-base font-extrabold font-mono text-indigo-300 mt-0.5">
                        {trace.stages[activeStageIndex].data.canonicalCause.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30">
                      {(trace.stages[activeStageIndex].data.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#131b2e]/60 border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">AI Contextual Reasoning</p>
                    <p className="text-slate-200 leading-relaxed">
                      {trace.stages[activeStageIndex].data.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 3: CUSTOMER INTELLIGENCE */}
              {trace.stages[activeStageIndex].id === 'CUSTOMER_INTELLIGENCE' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Customer ID</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      {trace.stages[activeStageIndex].data.customerId}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Lifetime Value (LTV)</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {trace.stages[activeStageIndex].data.lifetimeValueFormatted}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Success Rate</p>
                    <p className="text-sm font-bold text-blue-300 font-mono mt-0.5">
                      {trace.stages[activeStageIndex].data.successRatePercentage}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Preferred Method</p>
                    <p className="text-sm font-bold text-purple-300 font-mono mt-0.5">
                      {trace.stages[activeStageIndex].data.preferredPaymentMethod}
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 5: EXPECTED VALUE TABLE */}
              {trace.stages[activeStageIndex].id === 'EXPECTED_VALUE' && (
                <div className="space-y-4">
                  {/* Mathematical EV Formula */}
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono text-indigo-300 text-center">
                    <span className="font-bold">MAXIMIZATION FORMULA:</span> EV = P(recovery | action) × Recoverable Amount − Intervention Cost − Friction Cost
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#1e2d4a]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#131b2e] text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Candidate Action</th>
                          <th className="p-3">Prob (P)</th>
                          <th className="p-3">Recoverable</th>
                          <th className="p-3">Int. Cost</th>
                          <th className="p-3">Friction Cost</th>
                          <th className="p-3">Expected Value ($EV$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2d4a] bg-[#090d16]">
                        {trace.stages[activeStageIndex].data.candidates.map((c: any) => (
                          <tr
                            key={c.action}
                            className={c.isSelected ? 'bg-emerald-500/10 font-bold' : ''}
                          >
                            <td className="p-3 uppercase flex items-center gap-2">
                              <span>{c.action.replace(/_/g, ' ')}</span>
                              {c.isSelected && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px]">
                                  ★ BEST
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-300">{(c.probability * 100).toFixed(0)}%</td>
                            <td className="p-3 text-slate-200">{c.recoverableAmountFormatted}</td>
                            <td className="p-3 text-slate-400">{c.interventionCostFormatted}</td>
                            <td className="p-3 text-slate-400">{c.frictionCostFormatted}</td>
                            <td className={`p-3 font-extrabold ${c.isSelected ? 'text-emerald-400 text-sm' : 'text-slate-300'}`}>
                              {c.expectedValueFormatted}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STAGE 7: POLICY GATE */}
              {trace.stages[activeStageIndex].id === 'POLICY_GATE' && (
                <div className="p-4 rounded-xl bg-[#131b2e] border border-[#1e2d4a] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Policy Governance Check</p>
                      <p className="text-sm font-bold font-mono text-white mt-0.5">
                        Action Requested: {trace.stages[activeStageIndex].data.requestedAction?.toUpperCase()}
                      </p>
                    </div>
                    {trace.stages[activeStageIndex].data.policyResult === 'BLOCK' ? (
                      <span className="px-3 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold text-xs flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> POLICY BLOCK
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> POLICY PASS
                      </span>
                    )}
                  </div>
                  {trace.stages[activeStageIndex].data.blockReason && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono">
                      Reason: {trace.stages[activeStageIndex].data.blockReason}
                    </div>
                  )}
                  <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#1e2d4a] text-[11px] text-blue-300 font-mono text-center">
                    AI RECOMMENDATION ≠ FINAL SYSTEM DECISION · Merchant Constitution Overrides AI
                  </div>
                </div>
              )}

              {/* STAGE 10: FINAL RESULT CARD */}
              {trace.stages[activeStageIndex].id === 'FINAL_RESULT' && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2d4a]">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-mono font-bold">
                        PIPELINE EXECUTION COMPLETE
                      </p>
                      <h3 className="text-2xl font-extrabold text-white mt-1">
                        {trace.finalOutcome.amountFormatted}
                      </h3>
                    </div>
                    {getStatusBadge(trace.finalOutcome.status)}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                      <p className="text-slate-400 text-[10px]">SELECTED ACTION</p>
                      <p className="text-sm font-bold text-indigo-300 uppercase mt-0.5">
                        {trace.finalOutcome.action || 'NONE'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                      <p className="text-slate-400 text-[10px]">EXPECTED VALUE</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">
                        {trace.finalOutcome.evFormatted}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                      <p className="text-slate-400 text-[10px]">POLICY RESULT</p>
                      <p className={`text-sm font-bold mt-0.5 ${trace.finalOutcome.policyResult === 'BLOCK' ? 'text-purple-400' : 'text-emerald-400'}`}>
                        {trace.finalOutcome.policyResult}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#131b2e] border border-[#1e2d4a]">
                      <p className="text-slate-400 text-[10px]">ENVIRONMENT</p>
                      <p className="text-sm font-bold text-amber-300 mt-0.5">
                        {trace.finalOutcome.executionMode}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Link
                      href="/audit"
                      className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all font-mono text-xs font-bold flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>VIEW AUDIT TRAIL</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
