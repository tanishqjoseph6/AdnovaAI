import crypto from "crypto";
import Razorpay from "razorpay";
import type { PaidPlanId } from "@/lib/billing/plans";
import {
  getPaidPlanAmountMinor,
  type BillingInterval,
} from "@/lib/billing/pricing";

type RazorpayKeyMode = "live" | "test" | "unknown";

export class RazorpayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RazorpayConfigError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new RazorpayConfigError(`Missing environment variable: ${name}`);
  }
  return value;
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function getRazorpayKeyId(): string {
  return requireEnv("RAZORPAY_KEY_ID");
}

export function getPublicRazorpayKeyId(): string {
  return requireEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID");
}

export function getRazorpayKeyMode(keyId: string): RazorpayKeyMode {
  if (keyId.startsWith("rzp_live_")) {
    return "live";
  }

  if (keyId.startsWith("rzp_test_")) {
    return "test";
  }

  return "unknown";
}

export function getRazorpayConfigDiagnostics() {
  const serverKeyId = process.env.RAZORPAY_KEY_ID ?? "";
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
  const serverKeyMode = serverKeyId ? getRazorpayKeyMode(serverKeyId) : "unknown";
  const publicKeyMode = publicKeyId ? getRazorpayKeyMode(publicKeyId) : "unknown";

  return {
    hasServerKeyId: Boolean(serverKeyId),
    hasPublicKeyId: Boolean(publicKeyId),
    hasSecret,
    serverKeyMode,
    publicKeyMode,
    keyIdsMatch: Boolean(serverKeyId && publicKeyId && serverKeyId === publicKeyId),
    isVercelProduction: process.env.VERCEL_ENV === "production",
  };
}

export function assertRazorpayConfig(): {
  serverKeyId: string;
  publicKeyId: string;
  keySecret: string;
  mode: RazorpayKeyMode;
} {
  const serverKeyId = getRazorpayKeyId();
  const publicKeyId = getPublicRazorpayKeyId();
  const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
  const mode = getRazorpayKeyMode(serverKeyId);
  const publicMode = getRazorpayKeyMode(publicKeyId);

  if (serverKeyId !== publicKeyId) {
    throw new RazorpayConfigError(
      "Razorpay key mismatch: NEXT_PUBLIC_RAZORPAY_KEY_ID must exactly match RAZORPAY_KEY_ID."
    );
  }

  if (mode !== publicMode) {
    throw new RazorpayConfigError(
      "Razorpay key mode mismatch: public and backend key IDs must both be test or both be live."
    );
  }

  if (process.env.VERCEL_ENV === "production" && mode !== "live") {
    throw new RazorpayConfigError(
      "Production Razorpay configuration must use LIVE keys (rzp_live_...)."
    );
  }

  return { serverKeyId, publicKeyId, keySecret, mode };
}

export function createRazorpayClient(): Razorpay {
  const config = assertRazorpayConfig();
  return new Razorpay({
    key_id: config.serverKeyId,
    key_secret: config.keySecret,
  });
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = requireEnv("RAZORPAY_KEY_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return secureCompare(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return secureCompare(expected, signature);
}

export function createRazorpayReceipt(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(6).toString("hex");
  return `adv_${timestamp}_${random}`;
}

export async function createPlanOrder(
  planId: PaidPlanId,
  userId: string,
  userEmail?: string | null,
  interval: BillingInterval = "monthly"
) {
  const razorpay = createRazorpayClient();
  const amount = getPaidPlanAmountMinor(planId, interval, "INR");

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: createRazorpayReceipt(),
    notes: {
      user_id: userId,
      plan: planId,
      interval,
      currency: "INR",
      merchant: "Advora AI",
      website: "https://useadvora.com",
      ...(userEmail ? { email: userEmail } : {}),
    },
  });

  return order;
}
