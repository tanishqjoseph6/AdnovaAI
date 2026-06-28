import crypto from "crypto";
import Razorpay from "razorpay";
import type { PaidPlanId } from "@/lib/billing/plans";
import {
  getPaidPlanAmountMinor,
  type BillingInterval,
} from "@/lib/billing/pricing";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
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
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID ?? ""
  );
}

export function createRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
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
