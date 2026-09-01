'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ExecutionModeBadge } from '@/components/common/StatusBadge';
import {
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  Code,
  ExternalLink,
  Activity,
  MessageSquare,
  Layers,
} from 'lucide-react';

interface AuditEvent {
  id: string;
  eventType: string;
  transactionId: string | null;
  executionMode: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface PipelineRunGroup {
  runId: string;
  transactionId: string | null;
  timestamp: string;
  events: AuditEvent[];
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'copilot'>('pipeline');
  const [loading, setLoading] = useState(true);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '150' });
    if (filter) params.set('eventType', filter);
    setLoading(true);
    api<AuditEvent[]>(`/audit?${params}`)
      .then((data) => {
        setEvents(data);
        const pipelineEvents = data.filter((e) => !e.eventType.startsWith('copilot_'));
        if (pipelineEvents.length > 0) {
          const firstTxnId = pipelineEvents[0].transactionId || pipelineEvents[0].id;
          setExpandedRunId(firstTxnId);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  // Separate Recovery Pipeline events from Copilot events
  const pipelineEvents = events.filter((e) => !e.eventType.startsWith('copilot_'));
  const copilotEvents = events.filter((e) => e.eventType.startsWith('copilot_'));

  const displayedEvents = activeTab === 'pipeline' ? pipelineEvents : copilotEvents;

  // Group events by transactionId
  const runGroups: PipelineRunGroup[] = [];
  const groupMap = new Map<string, AuditEvent[]>();

  for (const ev of displayedEvents) {
    const key = ev.transactionId || 'system_logs';
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(ev);
  }

  groupMap.forEach((evList, key) => {
    runGroups.push({
      runId: key,
      transactionId: key === 'system_logs' ? null : key,
      timestamp: evList[0]?.createdAt || new Date().toISOString(),
      events: evList,
    });
  });

  const eventTypes = [
    { label: 'All Event Types', value: '' },
    { label: 'Detection', value: 'detection' },
    { label: 'Diagnosis', value: 'diagnosis' },
    { label: 'EV Calculated', value: 'ev_calculated' },
    { label: 'Action Selected', value: 'action_selected' },
    { label: 'Policy Check', value: 'policy_check' },
    { label: 'Execution Result', value: 'execution_result' },
    { label: 'Loop Stopped', value: 'loop_stopped' },
    { label: 'Escalation', value: 'escalation' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Audit Trail & Immutable Pipeline Log</h2>
          </div>
          <p className="text-xs text-slate-400">
            Append-only verification log grouped by pipeline runs. Immutable proof of decision execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Selector */}
          <div className="flex bg-[#0c1220] p-1 rounded-xl border border-[#1e2d4a]">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pipeline'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Recovery Pipeline ({pipelineEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'copilot'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Copilot Logs ({copilotEvents.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0c1220] border border-[#1e2d4a] text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
            >
              {eventTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Pipeline Stream */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading append-only audit trail...</p>
        </div>
      ) : runGroups.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          No {activeTab === 'pipeline' ? 'recovery pipeline' : 'copilot'} audit events match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {runGroups.map((group) => {
            const isRunExpanded = expandedRunId === group.runId;
            return (
              <div
                key={group.runId}
                className="rounded-2xl bg-[#0c1220] border border-[#1e2d4a] overflow-hidden shadow-xl"
              >
                {/* Pipeline Run Header */}
                <button
                  onClick={() => setExpandedRunId(isRunExpanded ? null : group.runId)}
                  className="w-full p-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 hover:from-slate-800 flex items-center justify-between transition-colors border-b border-[#1e2d4a]"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
                          {activeTab === 'pipeline' ? 'PIPELINE RUN' : 'COPILOT LOG GROUP'}
                        </span>
                        {group.transactionId && (
                          <span className="text-xs font-mono font-bold text-indigo-300">
                            {group.transactionId}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                          {group.events.length} Events
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(group.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {group.transactionId && (
                      <Link
                        href={`/transactions/${group.transactionId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>Inspect Txn</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    {isRunExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Pipeline Events List */}
                {isRunExpanded && (
                  <div className="p-4 space-y-2 bg-[#080d1a]">
                    {group.events.map((ev, index) => {
                      const isEvExpanded = expandedEventId === ev.id;
                      return (
                        <div
                          key={ev.id}
                          className="p-3 rounded-xl bg-[#0c1220] border border-[#1e2d4a] hover:border-indigo-500/30 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-mono font-bold text-slate-200 uppercase tracking-wide">
                                {ev.eventType.replace(/_/g, ' ')}
                              </span>
                              {ev.executionMode && <ExecutionModeBadge mode={ev.executionMode} />}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date(ev.createdAt).toLocaleTimeString()}
                              </span>
                              <button
                                onClick={() => setExpandedEventId(isEvExpanded ? null : ev.id)}
                                className="p-1 rounded bg-[#131b2e] text-slate-400 hover:text-white transition-colors"
                              >
                                <Code className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Raw Payload JSON */}
                          {isEvExpanded && (
                            <div className="mt-2 pt-2 border-t border-[#1e2d4a]">
                              <pre className="p-2.5 rounded-lg bg-[#090d16] font-mono text-[10px] text-emerald-300 overflow-x-auto">
                                {JSON.stringify(ev.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
