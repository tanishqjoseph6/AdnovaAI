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
  title: "Terms of Service | Advora AI",
  description:
    "Read the Terms of Service for using Advora AI, including subscriptions, credits, and acceptable use.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle={`These Terms of Service govern your access to and use of ${LEGAL_COMPANY_NAME} at ${LEGAL_WEBSITE}. By creating an account or using the platform, you agree to these terms.`}
      currentPath="/terms-of-service"
    >
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing or using Advora AI, you agree to be bound by these Terms
          of Service and our Privacy Policy. If you do not agree, do not use the
          service.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          Advora AI provides software tools for AI-powered ad generation, Brand
          Kit management, landing page analysis, competitor ad analysis, social
          post scheduling, account management, and related marketing workflows.
          Features may change, improve, or be added over time.
        </p>
        <p>
          AI-generated content is provided as a draft or suggestion. You are
          solely responsible for reviewing, editing, and using outputs in
          compliance with applicable laws, platform policies, and advertising
          standards.
        </p>
      </LegalSection>

      <LegalSection title="3. Account Responsibilities">
        <p>
          You must provide accurate registration information and keep your login
          credentials secure. You are responsible for all activity under your
          account. Notify us immediately if you suspect unauthorized access.
        </p>
        <p>
          One person or organization should not create duplicate accounts to
          abuse free credits, referrals, or promotional offers. We may suspend
          or terminate accounts involved in abuse or fraud.
        </p>
      </LegalSection>

      <LegalSection title="4. Subscriptions and Billing">
        <p>
          Paid plans are billed on a subscription basis through Razorpay in INR
          unless otherwise stated. By subscribing, you authorize us and our
          payment processor to charge the applicable fees for your selected
          plan and billing interval.
        </p>
        <p>
          Subscription fees, plan limits, and included credits are described on
          our pricing and billing pages. Prices may change for future billing
          cycles with reasonable notice where required.
        </p>
      </LegalSection>

      <LegalSection title="5. Credits and Usage Limits">
        <p>
          Each plan includes a monthly allocation of AI credits as described at
          purchase. Credits are consumed when eligible AI actions complete
          successfully, such as ad generation or related premium features. You
          may also purchase additional credits, which are used after your
          monthly credits are exhausted.
        </p>
        <p>
          Credits have no cash value, are non-transferable, and may expire or
          reset according to your plan rules. Unused credits from a prior cycle
          may not roll over unless explicitly stated.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable Use">
        <p>You agree not to use Advora AI to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Violate any law, regulation, or third-party rights</li>
          <li>Generate deceptive, harmful, illegal, or infringing content</li>
          <li>Attempt to reverse engineer, scrape, or overload the platform</li>
          <li>Circumvent billing, credit limits, or security controls</li>
          <li>Upload malware or attempt unauthorized access to systems or data</li>
          <li>Misrepresent AI-generated content as human-created where prohibited</li>
        </ul>
        <p>
          We may investigate violations and suspend or terminate access where
          necessary to protect users, partners, and the integrity of the
          service.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual Property">
        <p>
          Advora AI, including its software, branding, design, and documentation,
          is owned by us or our licensors and protected by applicable intellectual
          property laws. These Terms do not grant you ownership of the platform.
        </p>
        <p>
          You retain ownership of content you submit. You grant Advora a limited
          license to host, process, and use that content solely to provide and
          improve the service, including AI generation and storage features.
        </p>
        <p>
          AI outputs are provided to you for your business use subject to these
          Terms, but we do not guarantee exclusivity or freedom from similarity
          with content generated for other users.
        </p>
      </LegalSection>

      <LegalSection title="8. Third-Party Services">
        <p>
          The platform integrates with third-party providers such as Razorpay,
          authentication services, hosting infrastructure, and AI model
          providers. Your use of those services may be subject to their separate
          terms and policies.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          Advora AI is provided on an &quot;as is&quot; and &quot;as available&quot;
          basis. We do not guarantee uninterrupted service, error-free outputs,
          or specific business results from generated ads, analyses, or
          scheduled content.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Advora AI and its affiliates
          will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or for loss of profits, revenue,
          data, or goodwill arising from your use of the service.
        </p>
        <p>
          Our total liability for any claim relating to the service will not
          exceed the amount you paid to Advora AI in the twelve (12) months
          before the event giving rise to the claim.
        </p>
      </LegalSection>

      <LegalSection title="11. Termination">
        <p>
          You may stop using the service at any time. We may suspend or terminate
          your account if you breach these Terms, create risk for other users, or
          where required by law. Upon termination, your right to access the
          platform ends, but sections that by nature should survive will
          continue to apply.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing Law">
        <p>
          These Terms are governed by the laws of India. Any disputes arising
          from or relating to these Terms or the service will be subject to the
          exclusive jurisdiction of the courts located in India, unless
          applicable law requires otherwise.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          For questions about these Terms, contact{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
