/**
 * Affiliate program defaults, kept free of server-only imports so marketing
 * (client) components and the server-side referral engine share one source.
 * The effective values can be raised by admins in ReferralRewardConfig but
 * never fall below these.
 */
export const DEFAULT_COMMISSION_PERCENT = 30;
export const DEFAULT_MIN_WITHDRAWAL_USD = 500;
