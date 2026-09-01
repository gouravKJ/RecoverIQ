import { statusBadgeClass, formatStatus } from '@/lib/utils';
import {
  CheckCircle2,
  ShieldAlert,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Ban,
} from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
  const getIcon = (st: string) => {
    const s = st.toLowerCase();
    if (s.includes('recovered') || s.includes('success') || s.includes('captured'))
      return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    if (s.includes('block')) return <Ban className="w-3 h-3 text-red-400" />;
    if (s.includes('do_nothing')) return <Clock className="w-3 h-3 text-slate-400" />;
    if (s.includes('escalat')) return <ShieldAlert className="w-3 h-3 text-purple-400" />;
    if (s.includes('failed')) return <XCircle className="w-3 h-3 text-red-400" />;
    if (s.includes('retry')) return <RotateCcw className="w-3 h-3 text-blue-400" />;
    return <AlertTriangle className="w-3 h-3 text-amber-400" />;
  };

  return (
    <span className={`badge ${statusBadgeClass(status)}`}>
      {getIcon(status)}
      <span>{formatStatus(status)}</span>
    </span>
  );
}

export function ExecutionModeBadge({ mode }: { mode?: string | null }) {
  if (!mode) return null;
  const isReal = mode === 'REAL_TEST_MODE';
  return (
    <span
      className={`badge ${
        isReal
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      }`}
    >
      {isReal ? <ShieldCheck className="w-3 h-3 text-blue-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
      <span>{isReal ? 'REAL TEST-MODE' : 'DEMO SIMULATED'}</span>
    </span>
  );
}
