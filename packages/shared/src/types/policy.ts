export interface MerchantPolicyConfig {
  maxRetries: number;
  maxReminders: number;
  minReminderIntervalMinutes: number;
  maxDiscountPercentage: number;
  humanApprovalAbove: number;
  neverContactOptedOut: boolean;
}

export const DEFAULT_MERCHANT_POLICY: MerchantPolicyConfig = {
  maxRetries: 2,
  maxReminders: 2,
  minReminderIntervalMinutes: 30,
  maxDiscountPercentage: 5,
  humanApprovalAbove: 1000000,
  neverContactOptedOut: true,
};
