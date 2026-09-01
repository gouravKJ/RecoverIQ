export const FAILURE_CODE_MAP: Record<string, string> = {
  BAD_REQUEST_ERROR: 'generic',
  GATEWAY_ERROR: 'network',
  SERVER_ERROR: 'network',
  TIMEOUT: 'timeout',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  MANDATE_EXPIRED: 'mandate_expired',
  BANK_DECLINED: 'bank_decline',
  PAYMENT_CANCELLED: 'abandonment',
  UPI_DECLINED: 'upi_failure',
  CARD_DECLINED: 'card_failure',
};

export const TIMEOUT_KEYWORDS = ['timeout', 'timed out', 'gateway', 'network'];
export const INSUFFICIENT_FUNDS_KEYWORDS = ['insufficient', 'balance', 'funds'];
export const MANDATE_KEYWORDS = ['mandate', 'expired', 'revoked'];
export const ABANDONMENT_KEYWORDS = ['cancelled', 'cancel', 'closed', 'abandon'];
