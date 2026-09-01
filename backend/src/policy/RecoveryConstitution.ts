import { prisma } from '../lib/prisma';
import type { MerchantPolicyConfig } from '@recoveriq/shared';
import { DEFAULT_MERCHANT_POLICY } from '@recoveriq/shared';

export class RecoveryConstitution {
  async getPolicy(): Promise<MerchantPolicyConfig> {
    const policy = await prisma.merchantPolicy.findFirst();
    if (!policy) {
      return this.ensureDefault();
    }
    return {
      maxRetries: policy.maxRetries,
      maxReminders: policy.maxReminders,
      minReminderIntervalMinutes: policy.minReminderIntervalMin,
      maxDiscountPercentage: Number(policy.maxDiscountPercentage),
      humanApprovalAbove: Number(policy.humanApprovalAbove),
      neverContactOptedOut: policy.neverContactOptedOut,
    };
  }

  async updatePolicy(updates: Partial<MerchantPolicyConfig>): Promise<MerchantPolicyConfig> {
    const existing = await prisma.merchantPolicy.findFirst();
    const data = {
      maxRetries: updates.maxRetries,
      maxReminders: updates.maxReminders,
      minReminderIntervalMin: updates.minReminderIntervalMinutes,
      maxDiscountPercentage: updates.maxDiscountPercentage,
      humanApprovalAbove: updates.humanApprovalAbove
        ? BigInt(updates.humanApprovalAbove)
        : undefined,
      neverContactOptedOut: updates.neverContactOptedOut,
    };

    if (existing) {
      await prisma.merchantPolicy.update({
        where: { id: existing.id },
        data: Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
      });
    } else {
      await prisma.merchantPolicy.create({
        data: {
          maxRetries: updates.maxRetries ?? DEFAULT_MERCHANT_POLICY.maxRetries,
          maxReminders: updates.maxReminders ?? DEFAULT_MERCHANT_POLICY.maxReminders,
          minReminderIntervalMin:
            updates.minReminderIntervalMinutes ?? DEFAULT_MERCHANT_POLICY.minReminderIntervalMinutes,
          maxDiscountPercentage:
            updates.maxDiscountPercentage ?? DEFAULT_MERCHANT_POLICY.maxDiscountPercentage,
          humanApprovalAbove: BigInt(
            updates.humanApprovalAbove ?? DEFAULT_MERCHANT_POLICY.humanApprovalAbove
          ),
          neverContactOptedOut:
            updates.neverContactOptedOut ?? DEFAULT_MERCHANT_POLICY.neverContactOptedOut,
        },
      });
    }
    return this.getPolicy();
  }

  async ensureDefault(): Promise<MerchantPolicyConfig> {
    const existing = await prisma.merchantPolicy.findFirst();
    if (existing) {
      return this.getPolicy();
    }
    await prisma.merchantPolicy.create({
      data: {
        maxRetries: DEFAULT_MERCHANT_POLICY.maxRetries,
        maxReminders: DEFAULT_MERCHANT_POLICY.maxReminders,
        minReminderIntervalMin: DEFAULT_MERCHANT_POLICY.minReminderIntervalMinutes,
        maxDiscountPercentage: DEFAULT_MERCHANT_POLICY.maxDiscountPercentage,
        humanApprovalAbove: BigInt(DEFAULT_MERCHANT_POLICY.humanApprovalAbove),
        neverContactOptedOut: DEFAULT_MERCHANT_POLICY.neverContactOptedOut,
      },
    });
    return DEFAULT_MERCHANT_POLICY;
  }
}
