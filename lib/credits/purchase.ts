export type GrantPurchasedCreditsRpcResult = {
  granted: boolean;
  credits_added: number;
  purchased_credits: number;
  current_credits: number;
};

export type CreateCreditPurchaseInput = {
  userId: string;
  creditsAmount: number;
  amountPaid: number;
  currency?: string;
  paymentId?: string;
  orderId?: string;
};

export type CompleteCreditPurchaseInput = {
  purchaseId: string;
  paymentId: string;
};

export const CREDIT_PACK_OPTIONS = [
  { credits: 25, priceInr: 299, label: "25 credits" },
  { credits: 50, priceInr: 499, label: "50 credits" },
  { credits: 100, priceInr: 899, label: "100 credits" },
] as const;

export type CreditPackOption = (typeof CREDIT_PACK_OPTIONS)[number];
