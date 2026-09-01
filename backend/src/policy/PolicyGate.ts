import type { Transaction } from '@prisma/client';
import type { RecoveryAction, PolicyCheckResult, MerchantPolicyConfig } from '@recoveriq/shared';
import { RecoveryConstitution } from './RecoveryConstitution';

export class PolicyGate {
  constructor(private constitution = new RecoveryConstitution()) {}

  async evaluate(
    action: RecoveryAction,
    params: Record<string, unknown>,
    txn: Transaction,
    customerOptedOut: boolean
  ): Promise<PolicyCheckResult> {
    const policy = await this.constitution.getPolicy();
    const checkedRules: string[] = [];

    if (action === 'do_nothing') {
      return {
        result: 'PASS',
        checkedRules: ['do_nothing_always_permitted'],
        requestedAction: action,
        requestedParams: params,
      };
    }

    if (action === 'retry') {
      checkedRules.push('max_retries');
      if (txn.retryCount >= policy.maxRetries) {
        return {
          result: 'BLOCK',
          blockReason: `Retry count (${txn.retryCount}) has reached merchant maximum (${policy.maxRetries}).`,
          checkedRules,
          requestedAction: action,
          requestedParams: params,
        };
      }
    }

    if (action === 'send_reminder') {
      checkedRules.push('max_reminders', 'min_reminder_interval', 'opt_out');
      if (txn.reminderCount >= policy.maxReminders) {
        return {
          result: 'BLOCK',
          blockReason: `Reminder count (${txn.reminderCount}) has reached merchant maximum (${policy.maxReminders}).`,
          checkedRules,
          requestedAction: action,
          requestedParams: params,
        };
      }
      if (txn.lastReminderAt) {
        const minsSince =
          (Date.now() - txn.lastReminderAt.getTime()) / 60000;
        if (minsSince < policy.minReminderIntervalMinutes) {
          return {
            result: 'BLOCK',
            blockReason: `Minimum reminder interval (${policy.minReminderIntervalMinutes} min) not met.`,
            checkedRules,
            requestedAction: action,
            requestedParams: params,
          };
        }
      }
      if (policy.neverContactOptedOut && customerOptedOut) {
        return {
          result: 'BLOCK',
          blockReason: 'Customer has opted out of contact; reminder not permitted.',
          checkedRules,
          requestedAction: action,
          requestedParams: params,
        };
      }
    }

    if (action === 'offer_discount') {
      checkedRules.push('max_discount');
      const discountPct = Number(params.discountPct ?? 0);
      if (discountPct > policy.maxDiscountPercentage) {
        return {
          result: 'BLOCK',
          blockReason: `Discount (${discountPct}%) exceeds merchant recovery constitution maximum (${policy.maxDiscountPercentage}%).`,
          checkedRules,
          requestedAction: action,
          requestedParams: params,
        };
      }
    }

    checkedRules.push('human_approval_threshold');
    const amount = Number(txn.amount);
    if (
      amount > policy.humanApprovalAbove &&
      action !== 'escalate_human'
    ) {
      return {
        result: 'BLOCK',
        blockReason: `Transaction amount exceeds human approval threshold (₹${policy.humanApprovalAbove / 100}).`,
        checkedRules,
        requestedAction: action,
        requestedParams: params,
      };
    }

    return {
      result: 'PASS',
      checkedRules,
      requestedAction: action,
      requestedParams: params,
    };
  }

  async getPolicy(): Promise<MerchantPolicyConfig> {
    return this.constitution.getPolicy();
  }

  async updatePolicy(updates: Partial<MerchantPolicyConfig>) {
    return this.constitution.updatePolicy(updates);
  }
}
