'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatINR, formatStatus, statusBadgeClass } from '@/lib/utils';
import { StatusBadge, ExecutionModeBadge } from '@/components/common/StatusBadge';
import {
  Sparkles,
  User,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowLeft,
  RefreshCw,
  FileText,
  Ban,
  Layers,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { AITransactionPanel } from '@/components/transaction/AITransactionPanel';
import { LivePipelineStepper } from '@/components/transaction/LivePipelineStepper';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessMsg, setReprocessMsg] = useState<string | null>(null);

  const fetchTransactionData = () => {
    api<Record<string, unknown>>(`/transactions/${id}`)
      .then(setData)
      .catch(console.error);

    api<any>(`/ai/transactions/${id}`)
      .then(setAiAnalysis)
      .catch(console.error);
  };

  useEffect(() => {
    fetchTransactionData();
  }, [id]);

  const handleReprocess = async () => {
    setReprocessing(true);
    setReprocessMsg(null);
    try {
      await api(`/transactions/${id}/reprocess`, { method: 'POST' });
      setReprocessMsg('AI Decision Pipeline re-executed successfully!');
      fetchTransactionData();
    } catch (e) {
      setReprocessMsg(e instanceof Error ? e.message : 'Reprocess failed');
    } finally {
      setReprocessing(false);
    }
  };

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading AI Recovery Intelligence for {id}...</p>
      </div>
    );
  }

  const txn = data as Record<string, unknown>;
  const customer = txn.customer as Record<string, unknown> | undefined;
  const diagnosis = txn.diagnosis as Record<string, unknown> | undefined;
  const decision = txn.recoveryDecision as Record<string, unknown> | undefined;
  const candidates = (decision?.candidateActions as Record<string, unknown>[]) ?? [];
  const policy = decision?.policyDecision as Record<string, unknown> | undefined;
  const executions = (decision?.executions as Record<string, unknown>[]) ?? [];
  const outcome = txn.recoveryOutcome as Record<string, unknown> | undefined;
  const auditEvents = (txn.auditEvents as Record<string, unknown>[]) ?? [];

  // Determine pipeline stepper progress
  const hasDiagnosis = !!diagnosis;
  const hasDecision = !!decision;
  const hasPolicy = !!policy;
  const hasOutcome = !!outcome;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/transactions"
            className="p-2 rounded-xl bg-[#131b2e] hover:bg-[#1b263f] border border-[#1e2d4a] text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold font-mono text-white tracking-tight">{String(txn.id)}</h2>
              {Boolean(txn.isDemoAnchor) && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEMO SCENARIO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Transaction Intelligence & Pipeline Trace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {reprocessMsg && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
              {reprocessMsg}
            </span>
          )}
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
            <span>{reprocessing ? 'Reprocessing...' : 'Re-Run Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Live Recovery Engine Execution Visualizer */}
      <LivePipelineStepper transactionId={id} onComplete={fetchTransactionData} />

      {/* Visual Pipeline Stepper */}
      <div className="p-6 rounded-2xl bg-[#0c1220] border border-[#1e2d4a] shadow-xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Recovery Pipeline Overview — 5 Phases</span>
        </h3>

        <div className="grid grid-cols-5 gap-2 text-center">
          {/* Step 1: Ingestion */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 text-blue-400 flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              1
            </div>
            <p className="text-xs font-bold text-slate-200">Failure Ingested</p>
            <span className="text-[10px] text-slate-400 font-mono uppercase">{String(txn.paymentMethod)}</span>
          </div>

          {/* Step 2: Root Cause */}
          <div className="flex flex-col items-center space-y-2">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                hasDiagnosis
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              2
            </div>
            <p className="text-xs font-bold text-slate-200">Root Cause AI</p>
            <span className="text-[10px] text-slate-400 font-mono">
              {diagnosis ? String(diagnosis.cause).replace(/_/g, ' ') : 'Pending'}
            </span>
          </div>

          {/* Step 3: EV Scoring */}
          <div className="flex flex-col items-center space-y-2">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                hasDecision
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              3
            </div>
            <p className="text-xs font-bold text-slate-200">EV Action Engine</p>
            <span className="text-[10px] text-slate-400 font-mono uppercase">
              {decision ? String(decision.selectedAction) : 'Pending'}
            </span>
          </div>

          {/* Step 4: Policy Gate */}
          <div className="flex flex-col items-center space-y-2">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                policy
                  ? policy.result === 'BLOCK'
                    ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-500/20'
                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              4
            </div>
            <p className="text-xs font-bold text-slate-200">Policy Gate</p>
            <span className="text-[10px] font-mono">
              {policy ? (
                <span className={policy.result === 'BLOCK' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {String(policy.result)}
                </span>
              ) : (
                'Pending'
              )}
            </span>
          </div>

          {/* Step 5: Final Outcome */}
          <div className="flex flex-col items-center space-y-2">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                hasOutcome
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              5
            </div>
            <p className="text-xs font-bold text-slate-200">Final Outcome</p>
            <span className="text-[10px] text-slate-400 font-mono">
              {outcome ? formatStatus(String(outcome.finalStatus)) : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Multi-Agent Intelligence Trace Panel */}
      <AITransactionPanel analysis={aiAnalysis} />

      {/* Transaction & Customer 360 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Summary Card */}
        <div className="card p-5 border border-[#1e2d4a]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Transaction Details</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
              <span className="text-slate-400">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-100">{String(txn.id)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
              <span className="text-slate-400">Failed Amount</span>
              <span className="font-mono font-bold text-white text-sm">{formatINR(Number(txn.amount))}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
              <span className="text-slate-400">Payment Method</span>
              <span className="font-mono font-semibold text-blue-400 uppercase">{String(txn.paymentMethod)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
              <span className="text-slate-400">Status</span>
              <StatusBadge
                status={
                  outcome?.finalStatus === 'recovered'
                    ? 'recovered'
                    : outcome?.finalStatus === 'escalated'
                    ? 'escalated'
                    : String(txn.status)
                }
              />
            </div>
            <div className="pt-1">
              <span className="text-slate-400 block mb-1">Failure Reason Code / Description:</span>
              <p className="p-2 rounded.xl bg-[#0c1220] border border-[#1e2d4a] font-mono text-[11px] text-amber-300">
                {String(txn.failureDescription ?? txn.failureReasonCode ?? 'N/A')}
              </p>
            </div>
          </div>
        </div>

        {/* Customer 360 Card */}
        {customer ? (
          <div className="card p-5 border border-[#1e2d4a]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Customer 360 Profile</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
                <span className="text-slate-400">Customer ID</span>
                <span className="font-mono font-semibold text-slate-100">{String(customer.id)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
                <span className="text-slate-400">Lifetime Value (LTV)</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatINR(Number(customer.lifetimeValue))}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
                <span className="text-slate-400">Historical Success Rate</span>
                <span className="font-mono font-bold text-blue-400">
                  {(Number(customer.successRate) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e2d4a]/60">
                <span className="text-slate-400">Preferred Method</span>
                <span className="font-mono font-semibold uppercase">{String(customer.preferredPaymentMethod)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Opted Out of Contacts?</span>
                <span className={`font-semibold ${customer.optedOut ? 'text-red-400' : 'text-slate-300'}`}>
                  {customer.optedOut ? 'YES (Opted Out)' : 'No'}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Root Cause Classification */}
      {diagnosis && (
        <div className="card p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/20 via-slate-900 to-slate-900">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Root Cause Classifier Diagnosis</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {(Number(diagnosis.confidence) * 100).toFixed(0)}% Confidence
            </span>
          </div>
          <p className="text-base font-extrabold text-white mb-2">
            Classified Cause: <span className="text-indigo-400">{String(diagnosis.cause).replace(/_/g, ' ')}</span>
          </p>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#0c1220]/60 p-3 rounded-xl border border-[#1e2d4a]">
            {String(diagnosis.explanation)}
          </p>
        </div>
      )}

      {/* Expected Value Engine — All Candidate Actions */}
      {decision && (
        <div className="card p-5 border border-[#1e2d4a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Expected Value ($EV$) Optimization Engine</span>
              </h3>
              <p className="text-xs text-slate-400">
                Formula: EV = P(recover) × Recoverable Amount - Cost(intervention) - Cost(friction)
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Winning Action: {String(decision.selectedAction).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 mb-4">
            {candidates.map((c) => {
              const isSelected = Boolean(c.isSelected);
              return (
                <div
                  key={String(c.action)}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent border-blue-500/50 shadow-md shadow-blue-500/10'
                      : 'bg-[#0c1220] border-[#1e2d4a] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected ? '✓' : '—'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-200 uppercase flex items-center gap-2">
                        <span>{String(c.action).replace(/_/g, ' ')}</span>
                        {isSelected && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                            SELECTED BY EV ENGINE
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Recoverable: {formatINR(Number(c.recoverableAmount))} · P(success)=
                        <strong className="text-slate-200">{((Number(c.recoveryProbability)) * 100).toFixed(0)}%</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-right">
                    <div>
                      <p className="text-[10px] text-slate-400">Intervention Cost</p>
                      <p className="font-mono text-slate-300">₹{Number(c.interventionCost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Calculated EV</p>
                      <p className={`font-mono font-bold text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {formatINR(Math.round(Number(c.expectedValue) * 100))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#0c1220] border border-[#1e2d4a] text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-blue-400">Agent Rationale: </span>
            {String(decision.reasoningText)}
          </div>
        </div>
      )}

      {/* Recovery Constitution Policy Check */}
      {policy && (
        <div
          className={`card p-5 border ${
            policy.result === 'BLOCK' ? 'border-red-500/50 bg-red-950/15' : 'border-emerald-500/40 bg-emerald-950/15'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Recovery Constitution Gate Check</span>
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                policy.result === 'BLOCK'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {String(policy.result)}
            </span>
          </div>

          {policy.result === 'BLOCK' ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-300 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" />
                <span>ACTION SUPPRESSED BY MERCHANT CONSTITUTION</span>
              </p>
              <p className="text-xs text-slate-300">{String(policy.blockReason)}</p>
            </div>
          ) : (
            <p className="text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PASS — Proposed action is compliant with merchant policy thresholds.</span>
            </p>
          )}
        </div>
      )}

      {/* Execution Logs */}
      {executions.length > 0 && (
        <div className="card p-5 border border-[#1e2d4a]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-400" />
            <span>Execution Dispatch & Idempotency Trace</span>
          </h3>

          <div className="space-y-3">
            {executions.map((ex) => (
              <div key={String(ex.id)} className="p-3.5 rounded-xl bg-[#0c1220] border border-[#1e2d4a] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={String(ex.status)} />
                    <ExecutionModeBadge mode={String(ex.executionMode)} />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Attempt #{String(ex.attemptNumber)}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                  <span>Idempotency Key: {String(ex.idempotencyKey)}</span>
                  <span>Action: {String(ex.action).toUpperCase()}</span>
                </div>
                {Boolean(ex.errorMessage) && (
                  <p className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-[11px]">
                    Error: {String(ex.errorMessage)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Timeline */}
      <div className="card p-5 border border-[#1e2d4a]">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Audit Event Stream</span>
        </h3>

        <div className="space-y-3">
          {auditEvents.map((ev) => (
            <div key={String(ev.id)} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0c1220] border border-[#1e2d4a] text-xs">
              <span className="font-mono text-[10px] text-slate-400 pt-0.5 whitespace-nowrap">
                {new Date(String(ev.createdAt)).toLocaleTimeString()}
              </span>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-slate-200 flex items-center gap-2">
                  <span>{String(ev.eventType).replace(/_/g, ' ').toUpperCase()}</span>
                </p>
                {Boolean(ev.executionMode) && <ExecutionModeBadge mode={String(ev.executionMode)} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
