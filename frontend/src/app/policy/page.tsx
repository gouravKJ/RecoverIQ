'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sliders,
  Sparkles,
  Ban,
} from 'lucide-react';

interface Policy {
  maxRetries: number;
  maxReminders: number;
  minReminderIntervalMinutes: number;
  maxDiscountPercentage: number;
  humanApprovalAbove: number;
  neverContactOptedOut: boolean;
}

export default function PolicyPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Policy Simulator State
  const [testAction, setTestAction] = useState('offer_discount');
  const [testDiscountPct, setTestDiscountPct] = useState(10);
  const [testAmount, setTestAmount] = useState(1500000); // ₹15,000 in paise
  const [testRetries, setTestRetries] = useState(3);
  const [simResult, setSimResult] = useState<{ result: string; reason?: string } | null>(null);

  useEffect(() => {
    api<Policy>('/policy').then(setPolicy).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!policy) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await api<Policy>('/policy', {
        method: 'PUT',
        body: JSON.stringify({
          ...policy,
          humanApprovalAbove: policy.humanApprovalAbove,
        }),
      });
      setPolicy(updated);
      setMessage('Recovery Constitution updated. Rules active immediately for all subsequent decisions.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulation = () => {
    if (!policy) return;
    if (testAction === 'offer_discount' && testDiscountPct > policy.maxDiscountPercentage) {
      setSimResult({
        result: 'BLOCK',
        reason: `Discount of ${testDiscountPct}% exceeds maximum allowed Constitution threshold (${policy.maxDiscountPercentage}%).`,
      });
    } else if (testRetries > policy.maxRetries) {
      setSimResult({
        result: 'BLOCK',
        reason: `Retry count (${testRetries}) exceeds maximum retries threshold (${policy.maxRetries}).`,
      });
    } else if (testAmount > policy.humanApprovalAbove) {
      setSimResult({
        result: 'BLOCK',
        reason: `Transaction amount (${formatINR(testAmount)}) exceeds human approval threshold (${formatINR(policy.humanApprovalAbove)}). Requires manual escalation.`,
      });
    } else {
      setSimResult({
        result: 'PASS',
        reason: 'Proposed action satisfies all Recovery Constitution constraints.',
      });
    }
  };

  if (!policy) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading Recovery Constitution Policy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-extrabold text-white tracking-tight">Policy Center & Recovery Constitution</h2>
        </div>
        <p className="text-xs text-slate-400">
          Governing rules and safety boundaries enforced by the Policy Gate before executing any AI recovery action.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Constitution Rules Form */}
        <div className="card p-6 border border-[#1e2d4a] space-y-5">
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Constitution Parameters</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ACTIVE RULES
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Max Retries */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maximum Retry Attempts</label>
              <input
                type="number"
                value={policy.maxRetries}
                onChange={(e) => setPolicy({ ...policy, maxRetries: Number(e.target.value) })}
                className="w-full bg-[#0c1220] border border-[#1e2d4a] focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Prevents infinite retry loops on failing mandates.</p>
            </div>

            {/* Max Reminders */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maximum Reminders</label>
              <input
                type="number"
                value={policy.maxReminders}
                onChange={(e) => setPolicy({ ...policy, maxReminders: Number(e.target.value) })}
                className="w-full bg-[#0c1220] border border-[#1e2d4a] focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
            </div>

            {/* Minimum Reminder Interval */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Min Reminder Interval (Minutes)</label>
              <input
                type="number"
                value={policy.minReminderIntervalMinutes}
                onChange={(e) => setPolicy({ ...policy, minReminderIntervalMinutes: Number(e.target.value) })}
                className="w-full bg-[#0c1220] border border-[#1e2d4a] focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
            </div>

            {/* Max Discount % */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Max Incentive Discount (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={policy.maxDiscountPercentage}
                  onChange={(e) => setPolicy({ ...policy, maxDiscountPercentage: Number(e.target.value) })}
                  className="flex-1 bg-[#0c1220] border border-[#1e2d4a] focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
                <span className="font-mono font-bold text-amber-400 text-sm">{policy.maxDiscountPercentage}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Discounts above this threshold are automatically blocked.</p>
            </div>

            {/* Human Approval Threshold */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Human Approval Threshold (in Paise)</label>
              <input
                type="number"
                value={policy.humanApprovalAbove}
                onChange={(e) => setPolicy({ ...policy, humanApprovalAbove: Number(e.target.value) })}
                className="w-full bg-[#0c1220] border border-[#1e2d4a] focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Equivalent to <strong>{formatINR(policy.humanApprovalAbove)}</strong>. Actions above this require approval.
              </p>
            </div>

            {/* Opt Out Checkbox */}
            <label className="flex items-center gap-2 text-slate-200 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={policy.neverContactOptedOut}
                onChange={(e) => setPolicy({ ...policy, neverContactOptedOut: e.target.checked })}
                className="w-4 h-4 rounded border-[#1e2d4a] text-blue-600 focus:ring-0 bg-[#0c1220]"
              />
              <span className="font-medium">Never contact opted-out customers</span>
            </label>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Constitution...' : 'Save Recovery Constitution'}</span>
            </button>

            {message && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Policy Simulator Widget */}
        <div className="card p-6 border border-[#1e2d4a] space-y-5 bg-gradient-to-b from-[#0c1220] to-[#090d16]">
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Interactive Policy Gate Simulator</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">TEST BEFORE SAVE</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Test how proposed AI actions interact with your current Constitution thresholds before saving.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Proposed Action</label>
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value)}
                className="w-full bg-[#131b2e] border border-[#1e2d4a] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
              >
                <option value="offer_discount">Offer Incentive Discount</option>
                <option value="retry">Automatic Payment Retry</option>
                <option value="send_reminder">Send Customer Reminder</option>
              </select>
            </div>

            {testAction === 'offer_discount' && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Test Discount Percentage (%)</label>
                <input
                  type="number"
                  value={testDiscountPct}
                  onChange={(e) => setTestDiscountPct(Number(e.target.value))}
                  className="w-full bg-[#131b2e] border border-[#1e2d4a] rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Test Transaction Amount (Paise)</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full bg-[#131b2e] border border-[#1e2d4a] rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Amount: {formatINR(testAmount)}</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Current Retry Count</label>
              <input
                type="number"
                value={testRetries}
                onChange={(e) => setTestRetries(Number(e.target.value))}
                className="w-full bg-[#131b2e] border border-[#1e2d4a] rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-[#131b2e] hover:bg-[#1b263f] border border-[#1e2d4a] text-slate-200 hover:text-white transition-all"
            >
              <Play className="w-4 h-4 text-amber-400 fill-current" />
              <span>Simulate Policy Gate</span>
            </button>

            {simResult && (
              <div
                className={`p-4 rounded-xl border space-y-1 ${
                  simResult.result === 'BLOCK'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-2">
                    {simResult.result === 'BLOCK' ? (
                      <Ban className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>GATE OUTCOME: {simResult.result}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 pt-1">{simResult.reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
