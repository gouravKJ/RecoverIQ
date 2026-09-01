import type { RecoveryAction, RootCause } from '../types/transaction';

/** All weights are visible and configurable — not hidden magic numbers. */
export const EV_WEIGHTS = {
  baseProbability: {
    retry: 0.35,
    send_reminder: 0.25,
    offer_discount: 0.3,
    escalate_human: 0.42,
    do_nothing: 0,
  } as Record<RecoveryAction, number>,

  interventionCostPaise: {
    retry: 0,
    send_reminder: 1500,
    offer_discount: 1000,
    escalate_human: 50000,
    do_nothing: 0,
  } as Record<RecoveryAction, number>,

  frictionCostPaise: {
    retry: 10000,
    send_reminder: 5000,
    offer_discount: 7500,
    escalate_human: 20000,
    do_nothing: 0,
  } as Record<RecoveryAction, number>,

  signalWeights: {
    rootCauseConfidence: 0.25,
    customerSuccessRate: 0.2,
    amountTier: 0.05,
    retryPenalty: 0.15,
    repeatedFailurePenalty: 0.1,
  },

  causeAffinity: {
    retry: {
      network_timeout: 0.25,
      temporary_bank_issue: 0.2,
      insufficient_funds: 0.05,
      mandate_expired: 0.02,
      suspected_abandonment: 0.08,
      repeated_failure: -0.15,
      unknown: 0.05,
    },
    send_reminder: {
      network_timeout: 0.1,
      temporary_bank_issue: 0.08,
      insufficient_funds: 0.15,
      mandate_expired: 0.2,
      suspected_abandonment: 0.18,
      repeated_failure: 0.05,
      unknown: 0.08,
    },
    offer_discount: {
      network_timeout: 0.05,
      temporary_bank_issue: 0.05,
      insufficient_funds: 0.2,
      mandate_expired: 0.05,
      suspected_abandonment: 0.1,
      repeated_failure: 0.1,
      unknown: 0.08,
    },
    escalate_human: {
      network_timeout: 0.1,
      temporary_bank_issue: 0.1,
      insufficient_funds: 0.12,
      mandate_expired: 0.15,
      suspected_abandonment: 0.05,
      repeated_failure: 0.2,
      unknown: 0.1,
    },
    do_nothing: {
      network_timeout: 0,
      temporary_bank_issue: 0,
      insufficient_funds: 0,
      mandate_expired: 0,
      suspected_abandonment: 0,
      repeated_failure: 0,
      unknown: 0,
    },
  } as Record<RecoveryAction, Record<RootCause, number>>,

  retryDecayPerAttempt: 0.12,

  discountPctByCause: {
    network_timeout: 3,
    temporary_bank_issue: 3,
    insufficient_funds: 10,
    mandate_expired: 5,
    suspected_abandonment: 5,
    repeated_failure: 8,
    unknown: 5,
  } as Record<RootCause, number>,
};

export function amountTierModifier(amountPaise: number): number {
  if (amountPaise < 50000) return -0.15;
  if (amountPaise < 100000) return -0.08;
  if (amountPaise < 200000) return 0;
  if (amountPaise < 1000000) return 0.05;
  return 0.1;
}

export function frictionMultiplier(amountPaise: number): number {
  if (amountPaise < 100000) return 2.5;
  if (amountPaise < 300000) return 1.5;
  return 1;
}
