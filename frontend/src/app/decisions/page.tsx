'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatStatus, statusBadgeClass } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Zap, ShieldCheck, ArrowRight, Ban, CheckCircle2, Filter } from 'lucide-react';

interface Decision {
  id: string;
  selectedAction: string;
  selectedEv: number;
  reasoningText: string;
  transaction: { id: string; amount: string | number; status: string; paymentMethod?: string };
  policyDecision?: { result: string; blockReason?: string };
}

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    setLoading(true);
    api<Decision[]>('/decisions?limit=50')
      .then(setDecisions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredDecisions = filterAction
    ? decisions.filter((d) => d.selectedAction === filterAction)
    : decisions;

  const actionTabs = [
    { label: 'All Actions', value: '' },
    { label: 'Retry', value: 'retry' },
    { label: 'Send Reminder', value: 'send_reminder' },
    { label: 'Offer Discount', value: 'offer_discount' },
    { label: 'Escalate Human', value: 'escalate_human' },
    { label: 'Do Nothing', value: 'do_nothing' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-extrabold text-white tracking-tight">Recovery Decisions</h2>
        </div>
        <p className="text-xs text-slate-400">
          Autonomous Expected Value ($EV$) optimization decisions with rule-based merchant policy outcomes.
        </p>
      </div>

      {/* Action Filter Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 bg-[#0c1220] p-3 rounded-2xl border border-[#1e2d4a]">
        <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        {actionTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterAction(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filterAction === tab.value
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Decisions List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading AI recovery decisions...</p>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          No decisions match the selected action filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDecisions.map((d) => (
            <div
              key={d.id}
              className="card p-4 border border-[#1e2d4a] hover:border-blue-500/40 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2d4a]/60 pb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <Link
                      href={`/transactions/${d.transaction.id}`}
                      className="font-mono font-bold text-sm text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {d.transaction.id}
                    </Link>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Failed Amount: <strong className="text-slate-200">{formatINR(Number(d.transaction.amount))}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-medium uppercase">Selected Action</p>
                    <StatusBadge status={d.selectedAction} />
                  </div>

                  {d.policyDecision && (
                    <div className="text-right pl-3 border-l border-[#1e2d4a]">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Policy Check</p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          d.policyDecision.result === 'BLOCK' ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {d.policyDecision.result === 'BLOCK' ? (
                          <Ban className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{d.policyDecision.result}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rationale & EV Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <p className="text-slate-300 flex-1 leading-relaxed">{d.reasoningText}</p>
                <div className="px-3 py-1.5 rounded-xl bg-[#0c1220] border border-[#1e2d4a] text-right font-mono shrink-0">
                  <span className="text-[10px] text-slate-400 block">Calculated EV</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {formatINR(Math.round(Number(d.selectedEv) * 100))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
