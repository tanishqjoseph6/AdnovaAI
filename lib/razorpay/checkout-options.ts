import { MERCHANT_NAME } from "@/lib/billing/plans";

export type RazorpayCheckoutPrefill = {
  email: string;
  name: string;
  contact?: string;
};

type RazorpayCheckoutHandler = (response: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => void;

/**
 * Builds Razorpay Standard Checkout options for subscription upgrades.
 *
 * Important:
 * - Use `order_id` only (do not pass `amount` / `currency`) so Checkout loads the
 *   full order-based payment screen with every method enabled on the account.
 * - Pass `config.display` so dashboard-level "cards only" configurations cannot
 *   restrict Test/Live checkout to a single method.
 */
export function createRazorpayCheckoutOptions(input: {
  keyId: string;
  orderId: string;
  planName: string;
  prefill: RazorpayCheckoutPrefill;
  handler: RazorpayCheckoutHandler;
  onDismiss: () => void;
}) {
  return {
    key: input.keyId,
    order_id: input.orderId,
    name: MERCHANT_NAME,
    description: `${input.planName} plan — useadvora.com`,
    prefill: {
      email: input.prefill.email,
      name: input.prefill.name,
      ...(input.prefill.contact ? { contact: input.prefill.contact } : {}),
    },
    theme: { color: "#7c3aed" },
    config: {
      display: {
        blocks: {
          all_methods: {
            name: "All Payment Options",
            instruments: [
              { method: "upi" },
              { method: "card" },
              { method: "wallet" },
              { method: "netbanking" },
            ],
          },
        },
        sequence: ["block.all_methods"],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
    handler: input.handler,
    modal: {
      ondismiss: input.onDismiss,
    },
  };
}
