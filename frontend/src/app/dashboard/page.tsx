import { api } from '@/lib/api';
import { formatINR, formatINRCompact, statusBadgeClass, formatStatus } from '@/lib/utils';
import { LeakageChart } from '@/components/dashboard/LeakageChart';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Users,
  Zap,
  ShieldBan,
  Clock,
  XCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Gift,
  ShieldOff,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

interface Summary {
  totalTransactionsProcessed: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryRate: number;
  customersAffected: number;
  interventionsTaken: number;
  actionsBlocked: number;
  actionsAvoided: number;
  failedRecoveryAttempts: number;
}

interface TransactionItem {
  id: string;
  amount: number | string;
  paymentMethod: string;
  status: string;
  isDemoAnchor: boolean;
  demoScenario?: string;
  diagnosis?: { cause: string } | null;
  recoveryOutcome?: { finalStatus: string } | null;
}

import { AIPatternsCard } from '@/components/dashboard/AIPatternsCard';

export default async function DashboardPage() {
  let summary: Summary | null = null;
  let leakage = { breakdown: [] as { name: string; value: number }[] };
  let recentTransactions: TransactionItem[] = [];
  let aiStatus = { enabled: true, provider: 'Groq', model: 'openai/gpt-oss-20b', mode: 'LLM' };
  let aiPatterns: any[] = [];
  let error: string | null = null;

  try {
    const [summaryRes, leakageRes, txnsRes, aiStatusRes, aiPatternsRes] = await Promise.all([
      api<Summary>('/dashboard/summary'),
      api<{ breakdown: { name: string; value: number }[] }>('/dashboard/leakage'),
      api<TransactionItem[]>('/transactions?limit=6'),
      api<{ enabled: boolean; provider: string; model: string; mode: string }>('/ai/status').catch(() => ({
        enabled: true,
        provider: 'Groq',
        model: 'openai/gpt-oss-20b',
        mode: 'DETERMINISTIC_FALLBACK',
      })),
      api<{ patterns: any[] }>('/ai/batch/patterns').catch(() => ({ patterns: [] })),
    ]);
    summary = summaryRes;
    leakage = leakageRes;
    recentTransactions = txnsRes;
    aiStatus = aiStatusRes;
    aiPatterns = aiPatternsRes.patterns || [];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load dashboard intelligence';
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-lg font-bold">Backend Connection Required</h2>
          </div>
          <p className="text-sm">{error}</p>
          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono space-y-1">
            <p>1. Ensure backend is running on http://localhost:4000</p>
            <p>2. Load synthetic batch via POST /api/v1/batch/load or click "Load Batch" in top bar.</p>
          </div>
        </div>
      </div>
    );
  }

  const demoScenarios = [
    {
      id: 'txn_demo_s1_retry_success',
      title: 'Successful Recovery',
      tag: 'Scenario 1 · RECOVERED',
      badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      icon: RotateCcw,
      description: 'Temporary bank timeout auto-retried ➔ PASS ➔ Recovered ₹7,499',
    },
    {
      id: 'txn_demo_s2_do_nothing',
      title: 'Do Nothing Decision',
      tag: 'Scenario 2 · NO ACTION',
      badgeClass: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
      icon: Clock,
      description: 'Low success probability (P=0.08) ➔ EV calculation decides NO ACTION',
    },
    {
      id: 'txn_demo_s3_policy_block',
      title: 'Policy Constitution Block',
      tag: 'Scenario 3 · BLOCKED',
      badgeClass: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
      icon: ShieldOff,
      description: 'AI requested 10% discount ➔ Exceeds 5% max cap ➔ Policy Gate BLOCKS action',
    },
    {
      id: 'txn_demo_s4_graceful_failure',
      title: 'Graceful Escalation',
      tag: 'Scenario 4 · ESCALATED',
      badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      icon: ShieldBan,
      description: 'Mandate expired retry fails ➔ Safely stopped & escalated to human workflow',
    },
  ];

  const primaryMetrics = [
    {
      label: 'Revenue at Risk',
      value: formatINRCompact(summary!.revenueAtRisk),
      icon: AlertTriangle,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      subtitle: 'Identified from failed transactions',
    },
    {
      label: 'Revenue Recovered',
      value: formatINRCompact(summary!.revenueRecovered),
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      subtitle: 'Successfully captured by agent',
    },
    {
      label: 'Recovery Success Rate',
      value: `${summary!.recoveryRate}%`,
      icon: TrendingUp,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30',
      subtitle: 'EV Engine efficiency score',
    },
  ];

  const secondaryMetrics = [
    { label: 'Total Transactions', value: summary!.totalTransactionsProcessed.toLocaleString(), icon: DollarSign },
    { label: 'Affected Customers', value: summary!.customersAffected.toLocaleString(), icon: Users },
    { label: 'Interventions Taken', value: summary!.interventionsTaken.toLocaleString(), icon: Zap },
    { label: 'Actions Blocked', value: summary!.actionsBlocked.toLocaleString(), icon: ShieldBan },
    { label: 'Actions Avoided', value: summary!.actionsAvoided.toLocaleString(), icon: Clock },
    { label: 'Failed Attempts', value: summary!.failedRecoveryAttempts.toLocaleString(), icon: XCircle },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-[#1e2d4a] relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
                Razorpay Hackathon Track 03
              </span>
              <span className="text-xs text-slate-400">· Real-Time Intelligence</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Autonomous Revenue Recovery Console</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Decision-first AI agent evaluating Expected Value ($EV$), enforcing merchant Recovery Constitution, and eliminating payment failure churn.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#131b2e] hover:bg-[#1b263f] border border-[#1e2d4a] text-slate-200 transition-all shadow-md"
            >
              <span>Explore All Transactions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* AI Multi-Agent Intelligence Card */}
      <AIPatternsCard status={aiStatus} patterns={aiPatterns} />

      {/* Demo Scenarios Spotlight Launcher */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Deterministic Demo Scenarios</h3>
            <span className="text-xs text-slate-400 font-mono">(Click scenario card to inspect live pipeline)</span>
          </div>
          <Link href="/decisions" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View Decision Rationale <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoScenarios.map((demo) => {
            const Icon = demo.icon;
            return (
              <Link
                key={demo.id}
                href={`/transactions/${demo.id}`}
                className="card card-interactive flex flex-col justify-between group p-4 border border-[#1e2d4a] hover:border-blue-500/40 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${demo.badgeClass}`}>
                      {demo.tag}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                    {demo.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{demo.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#1e2d4a]/60 flex items-center justify-between text-[11px] text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                  <span>Inspect Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Primary KPI Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {primaryMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`p-5 rounded-2xl bg-gradient-to-br ${m.color} border shadow-lg relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{m.label}</p>
                <Icon className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight font-mono text-white">{m.value}</p>
              <p className="text-[11px] opacity-70 mt-1">{m.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {secondaryMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card p-3 border border-[#1e2d4a] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-lg font-bold font-mono text-slate-100">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts & Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Leakage Chart (2 cols) */}
        <div className="lg:col-span-2 card p-5 border border-[#1e2d4a]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Revenue Leakage Breakdown</h3>
              <p className="text-xs text-slate-400">Classified root causes driving revenue loss across transactions</p>
            </div>
          </div>
          <LeakageChart data={leakage.breakdown} />
        </div>

        {/* Recent At-Risk Transactions (1 col) */}
        <div className="card p-5 border border-[#1e2d4a] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100">Recent Transactions</h3>
              <Link href="/transactions" className="text-xs text-blue-400 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <Link
                  key={txn.id}
                  href={`/transactions/${txn.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c1220] border border-[#1e2d4a] hover:border-blue-500/40 transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>{txn.id}</span>
                      {txn.isDemoAnchor && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                          DEMO
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase">
                      {txn.paymentMethod} · {txn.diagnosis?.cause?.replace(/_/g, ' ') ?? 'Evaluating...'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-slate-200">{formatINR(Number(txn.amount))}</p>
                    <span className={`badge text-[9px] ${statusBadgeClass(txn.status)}`}>
                      {formatStatus(txn.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
