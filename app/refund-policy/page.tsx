import type { Metadata } from "next";
import LegalPageShell, {
  LegalSection,
} from "@/components/legal/LegalPageShell";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_WEBSITE,
} from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Refund Policy | Advora AI",
  description:
    "Understand Advora AI subscription refunds, credit usage rules, and payment dispute handling.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      title="Refund Policy"
      subtitle={`This Refund Policy explains how billing, refunds, and payment issues are handled for paid subscriptions on ${LEGAL_COMPANY_NAME} (${LEGAL_WEBSITE}).`}
      currentPath="/refund-policy"
    >
      <LegalSection title="1. Subscription Policy">
        <p>
          Advora AI offers Free, Starter, Pro, and custom subscription options.
          Paid plans are billed in advance through Razorpay for the selected
          billing period. Access to paid features and included credits begins
          after successful payment confirmation.
        </p>
      </LegalSection>

      <LegalSection title="2. General Refund Eligibility">
        <p>
          Because Advora AI provides immediate access to digital software and AI
          generation credits, subscription fees are generally non-refundable once
          a plan is activated and credits become available for use.
        </p>
        <p>
          We may consider refund requests on a case-by-case basis where required
          by applicable law or where a clear billing error occurred on our side.
        </p>
      </LegalSection>

      <LegalSection title="3. No Refund After Credit Consumption">
        <p>
          If you have used any AI generation credits or consumed paid plan
          benefits after purchase, the subscription fee for that billing period
          is not refundable. This includes successful ad generations, analyses,
          rewrites, and other metered actions tied to your plan.
        </p>
        <p>
          Partial refunds are not provided for unused credits within a billing
          cycle once any paid credits have been consumed.
        </p>
      </LegalSection>

      <LegalSection title="4. Duplicate Payments">
        <p>
          If you were charged more than once for the same subscription period due
          to a duplicate transaction, contact us at{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          with your payment ID and account email. Verified duplicate charges will
          be refunded for the extra payment.
        </p>
      </LegalSection>

      <LegalSection title="5. Failed or Incomplete Payments">
        <p>
          If a payment fails, your subscription will not be activated and no
          credits will be granted until payment is successfully completed. You
          may retry checkout from the Billing page without being charged twice
          for the same successful order.
        </p>
        <p>
          If payment was deducted by your bank or UPI provider but Advora did
          not receive confirmation, contact support with transaction details so
          we can investigate with Razorpay.
        </p>
      </LegalSection>

      <LegalSection title="6. Cancellation">
        <p>
          You may cancel future renewals by managing your subscription through
          the product or by contacting support. Cancellation stops future billing
          but does not automatically refund the current billing period unless a
          refund is explicitly approved under this policy.
        </p>
      </LegalSection>

      <LegalSection title="7. Chargebacks and Disputes">
        <p>
          If you believe a charge is incorrect, please contact us before
          initiating a chargeback so we can resolve the issue quickly. Unauthorized
          chargebacks after successful service delivery may result in account
          suspension while the dispute is reviewed.
        </p>
      </LegalSection>

      <LegalSection title="8. How to Request Support">
        <p>
          For refund questions, billing issues, or payment verification, email{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          with:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your Advora account email</li>
          <li>Razorpay payment ID or order ID</li>
          <li>Date and amount of the transaction</li>
          <li>A brief description of the issue</li>
        </ul>
        <p>
          We aim to review billing support requests within a reasonable business
          timeframe.
        </p>
      </LegalSection>

      <LegalSection title="9. Policy Updates">
        <p>
          We may update this Refund Policy from time to time. Changes will be
          reflected by updating the Last Updated date on this page.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
