import type {
  CreditFeatureId,
  CreditSource,
  CreditTransactionType,
} from "./schema";

export type CreditTransaction = {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  transactionType: CreditTransactionType;
  featureId: CreditFeatureId | null;
  creditSource: CreditSource | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreditTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: CreditTransactionType;
  feature_id: string | null;
  credit_source: CreditSource | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function creditTransactionFromRow(
  row: CreditTransactionRow
): CreditTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    balanceAfter: row.balance_after,
    transactionType: row.transaction_type,
    featureId: row.feature_id as CreditFeatureId | null,
    creditSource: row.credit_source,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export type CreditPurchase = {
  id: string;
  userId: string;
  creditsAmount: number;
  amountPaid: number;
  currency: string;
  paymentId: string | null;
  orderId: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type CreditPurchaseRow = {
  id: string;
  user_id: string;
  credits_amount: number;
  amount_paid: number;
  currency: string;
  payment_id: string | null;
  order_id: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
};

export function creditPurchaseFromRow(row: CreditPurchaseRow): CreditPurchase {
  return {
    id: row.id,
    userId: row.user_id,
    creditsAmount: row.credits_amount,
    amountPaid: row.amount_paid,
    currency: row.currency,
    paymentId: row.payment_id,
    orderId: row.order_id,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export type FeatureCost = {
  featureId: CreditFeatureId;
  cost: number;
  label: string;
  description: string | null;
  enabled: boolean;
};

export type FeatureCostRow = {
  feature_id: string;
  cost: number;
  label: string;
  description: string | null;
  enabled: boolean;
};

export function featureCostFromRow(row: FeatureCostRow): FeatureCost {
  return {
    featureId: row.feature_id as CreditFeatureId,
    cost: row.cost,
    label: row.label,
    description: row.description,
    enabled: row.enabled,
  };
}
