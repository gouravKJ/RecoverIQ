import type {
  RecoveryAction,
  RootCause,
  CustomerProfile,
  CandidateActionEV,
  RecoveryDecisionResult,
} from '@recoveriq/shared';
import { EV_WEIGHTS, formatINR, paiseToRupees, frictionMultiplier } from '@recoveriq/shared';
import { RecoveryProbabilityEngine } from './RecoveryProbabilityEngine';

const ACTIONS: RecoveryAction[] = [
  'retry',
  'send_reminder',
  'offer_discount',
  'escalate_human',
  'do_nothing',
];

export class ExpectedValueEngine {
  private probabilityEngine = new RecoveryProbabilityEngine();

  decide(
    amountPaise: number,
    cause: RootCause,
    causeConfidence: number,
    customer: CustomerProfile,
    retryCount: number,
    forceDiscountPct?: number
  ): RecoveryDecisionResult {
    const recoverableAmount = amountPaise;
    const candidates: CandidateActionEV[] = ACTIONS.map((action) => {
      const recoveryProbability = this.probabilityEngine.estimate(
        action,
        cause,
        causeConfidence,
        customer,
        amountPaise,
        retryCount
      );

      let discountPct: number | undefined;
      let interventionCost = EV_WEIGHTS.interventionCostPaise[action];
      let frictionCost = Math.round(
        EV_WEIGHTS.frictionCostPaise[action] * frictionMultiplier(amountPaise)
      );

      if (action === 'offer_discount') {
        discountPct = forceDiscountPct ?? EV_WEIGHTS.discountPctByCause[cause];
        const discountAmount = Math.round((amountPaise * discountPct) / 100);
        interventionCost += discountAmount;
      }

      const expectedValue =
        recoveryProbability * paiseToRupees(recoverableAmount) -
        paiseToRupees(interventionCost) -
        paiseToRupees(frictionCost);

      return {
        action,
        recoveryProbability,
        recoverableAmount,
        interventionCost,
        frictionCost,
        expectedValue,
        discountPct,
      };
    });

    const selected = candidates.reduce((best, c) =>
      c.expectedValue > best.expectedValue ? c : best
    );

    const reasoningText = this.buildReasoning(selected, candidates, amountPaise);

    return {
      selectedAction: selected.action,
      selectedEv: selected.expectedValue,
      recoverableAmount,
      reasoningText,
      candidates,
      label: 'Rule-Based Recovery Probability (Heuristic)' as const,
    };
  }

  private buildReasoning(
    selected: CandidateActionEV,
    candidates: CandidateActionEV[],
    amountPaise: number
  ): string {
    if (selected.action === 'do_nothing') {
      const bestIntervention = candidates
        .filter((c) => c.action !== 'do_nothing')
        .reduce((best, c) => (c.expectedValue > best.expectedValue ? c : best));
      const benefit = Math.round(
        bestIntervention.recoveryProbability * paiseToRupees(amountPaise)
      );
      const costs = Math.round(
        paiseToRupees(bestIntervention.interventionCost + bestIntervention.frictionCost)
      );
      return `DO NOTHING selected because expected benefit ₹${benefit} is lower than intervention and customer-friction cost ₹${costs}. EV(do_nothing)=₹0.`;
    }

    const evFormatted = formatINR(Math.round(selected.expectedValue * 100));
    const alternatives = candidates
      .filter((c) => c.action !== selected.action)
      .map((c) => `${c.action} EV=${formatINR(Math.round(c.expectedValue * 100))}`)
      .join(', ');

    return `${selected.action.toUpperCase()} selected because EV = ${evFormatted}, higher than all alternative actions (${alternatives}).`;
  }
}
