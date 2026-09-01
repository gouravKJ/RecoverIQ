import { formatINR, formatINRCompact } from '@recoveriq/shared';

export { formatINR, formatINRCompact };

export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('recovered') || s.includes('captured')) return 'badge-recovered';
  if (s.includes('block')) return 'badge-blocked';
  if (s.includes('do_nothing') || s.includes('no_action')) return 'badge-do-nothing';
  if (s.includes('escalat')) return 'badge-escalated';
  if (s.includes('fail')) return 'badge-failed';
  return 'badge-pending';
}

export function formatStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'do_nothing' || s === 'no_action') return 'NO ACTION';
  if (s === 'blocked') return 'BLOCKED';
  if (s === 'escalated') return 'ESCALATED';
  if (s === 'recovered') return 'RECOVERED';
  return status.replace(/_/g, ' ').toUpperCase();
}

export function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
  );
}
