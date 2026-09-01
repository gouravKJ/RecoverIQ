import type { RecoveryAction, RootCause, CustomerProfile } from '@recoveriq/shared';
import { EV_WEIGHTS, amountTierModifier, clamp } from '@recoveriq/shared';

export class RecoveryProbabilityEngine {
  estimate(
    action: RecoveryAction,
    cause: RootCause,
    causeConfidence: number,
    customer: CustomerProfile,
    amountPaise: number,
    retryCount: number
  ): number {
    if (action === 'do_nothing') return 0;

    const w = EV_WEIGHTS;
    let p =
      w.baseProbability[action] +
      w.signalWeights.rootCauseConfidence * causeConfidence * w.causeAffinity[action][cause] +
      w.signalWeights.customerSuccessRate * customer.successRate +
      w.signalWeights.amountTier * amountTierModifier(amountPaise);

    p -= w.signalWeights.retryPenalty * retryCount * w.retryDecayPerAttempt;

    if (customer.failedTransactions >= 3) {
      p -= w.signalWeights.repeatedFailurePenalty;
    }

    return clamp(p, 0, 0.98);
  }

  getLabel(): string {
    return 'Rule-Based Recovery Probability (Heuristic)';
  }
}
