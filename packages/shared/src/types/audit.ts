export type AuditEventType =
  | 'detection'
  | 'diagnosis'
  | 'customer_intel'
  | 'probability_calculated'
  | 'ev_calculated'
  | 'action_selected'
  | 'policy_check'
  | 'execution_attempted'
  | 'execution_result'
  | 'recovery_verified'
  | 'loop_stopped'
  | 'escalation';

export interface AuditEventPayload {
  [key: string]: unknown;
}
