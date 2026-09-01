'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, statusBadgeClass, formatStatus } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Search,
  Filter,
  CreditCard,
  QrCode,
  Globe,
  Sparkles,
  ArrowUpDown,
  ChevronRight,
  Database,
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: string | number;
  paymentMethod: string;
  status: string;
  failureReasonCode: string | null;
  isDemoAnchor: boolean;
  demoScenario?: string;
  diagnosis?: { cause: string } | null;
  recoveryOutcome?: { finalStatus: string } | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [demoOnly, setDemoOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    setLoading(true);
    api<Transaction[]>(`/transactions?${params}`)
      .then((res) => {
        if (demoOnly) {
          setTransactions(res.filter((t) => t.isDemoAnchor));
        } else {
          setTransactions(res);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, status, demoOnly]);

  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('upi')) return <QrCode className="w-3.5 h-3.5 text-emerald-400" />;
    if (m.includes('card')) return <CreditCard className="w-3.5 h-3.5 text-blue-400" />;
    return <Globe className="w-3.5 h-3.5 text-purple-400" />;
  };

  const statusFilterTabs = [
    { label: 'All Statuses', value: '' },
    { label: 'Failed', value: 'failed' },
    { label: 'Recovered', value: 'recovered' },
    { label: 'Escalated', value: 'escalated' },
    { label: 'Closed', value: 'closed' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-blue-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Transaction Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time feed of failed payment events, rule-based root cause diagnosis, and recovery outcomes.
          </p>
        </div>

        <button
          onClick={() => setDemoOnly(!demoOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            demoOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/10'
              : 'bg-[#131b2e] text-slate-400 border-[#1e2d4a] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{demoOnly ? 'Showing 4 Demo Scenarios' : 'Filter Demo Anchors'}</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0c1220] p-3 rounded-2xl border border-[#1e2d4a]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {statusFilterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                status === tab.value
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ID, customer, method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131b2e] border border-[#1e2d4a] focus:border-blue-500/60 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="card p-0 border border-[#1e2d4a] overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading transaction records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <p className="text-slate-300 font-semibold">No transactions found</p>
            <p className="text-xs text-slate-400">Try clearing filters or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d4a] bg-[#0c1220]/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Root Cause Diagnosis</th>
                  <th className="py-3 px-4">Recovery Outcome</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]/60">
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Transaction ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/transactions/${txn.id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-semibold"
                        >
                          {txn.id}
                        </Link>
                        {txn.isDemoAnchor && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                      {formatINR(Number(txn.amount))}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#131b2e] border border-[#1e2d4a] text-slate-300 uppercase font-mono text-[11px]">
                        {getMethodIcon(txn.paymentMethod)}
                        <span>{txn.paymentMethod}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={
                          txn.recoveryOutcome?.finalStatus === 'recovered'
                            ? 'recovered'
                            : txn.recoveryOutcome?.finalStatus === 'escalated'
                            ? 'escalated'
                            : txn.status
                        }
                      />
                    </td>

                    {/* Root Cause Diagnosis */}
                    <td className="py-3.5 px-4">
                      {txn.diagnosis?.cause ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                          {txn.diagnosis.cause.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Outcome */}
                    <td className="py-3.5 px-4">
                      {txn.recoveryOutcome ? (
                        <StatusBadge status={txn.recoveryOutcome.finalStatus} />
                      ) : (
                        <span className="text-slate-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Inspect Link */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/transactions/${txn.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Pipeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
