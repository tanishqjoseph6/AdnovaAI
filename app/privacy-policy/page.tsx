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
  title: "Privacy Policy | Advora AI",
  description:
    "Learn how Advora AI collects, uses, and protects your data when you use our AI ad generation platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle={`This Privacy Policy explains how ${LEGAL_COMPANY_NAME} ("Advora", "we", "us") collects, uses, and protects information when you use ${LEGAL_WEBSITE} and our AI marketing platform.`}
      currentPath="/privacy-policy"
    >
      <LegalSection title="1. Information We Collect">
        <p>
          We collect information you provide directly when you create an account,
          use our services, or contact support. This may include your name,
          email address, profile details, billing information, and content you
          submit through features such as AI ad generation, Brand Kit, Landing
          Page Analyzer, Competitor Ad Analyzer, and Social Scheduler.
        </p>
        <p>
          We also collect technical and usage data automatically, including IP
          address, browser type, device information, pages visited, feature
          usage, credit consumption, and error logs to operate and improve the
          platform.
        </p>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>
          We use your information to provide and maintain Advora AI, authenticate
          users, process subscriptions, allocate and track credits, generate AI
          outputs, store Brand Kit preferences, analyze landing pages and
          competitor ads, schedule social content, and deliver customer support.
        </p>
        <p>
          We may use aggregated or de-identified data to improve product quality,
          monitor performance, prevent abuse, and develop new features. We do not
          sell your personal information.
        </p>
      </LegalSection>

      <LegalSection title="3. AI Processing">
        <p>
          When you submit prompts, URLs, images, brand assets, or other inputs,
          that content may be processed by third-party AI providers to generate
          hooks, captions, CTAs, UGC scripts, analyses, and related outputs.
          You are responsible for ensuring you have the right to submit such
          content and that generated outputs are reviewed before publication.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies and Similar Technologies">
        <p>
          We use cookies and similar technologies to keep you signed in, remember
          preferences, secure sessions, and understand how the product is used.
          You can control cookies through your browser settings, but disabling
          certain cookies may limit functionality such as authentication and
          billing access.
        </p>
      </LegalSection>

      <LegalSection title="5. Payment Processing">
        <p>
          Paid subscriptions are processed through Razorpay. When you purchase a
          plan, payment details are handled directly by Razorpay in accordance
          with their privacy and security practices. Advora receives limited
          transaction metadata such as payment status, order identifiers, plan
          type, and billing confirmation needed to activate your subscription
          and credits.
        </p>
        <p>
          We do not store full card numbers or UPI credentials on our servers.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Sharing">
        <p>
          We may share information with trusted service providers that help us
          operate Advora AI, including hosting, authentication, analytics,
          payment processing, email delivery, and AI infrastructure partners.
          These providers may access data only as needed to perform services on
          our behalf and under appropriate confidentiality obligations.
        </p>
        <p>
          We may also disclose information if required by law, to protect our
          rights, or to prevent fraud, abuse, or security incidents.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Security">
        <p>
          We implement administrative, technical, and organizational safeguards
          designed to protect your information, including encrypted transport,
          access controls, and secure infrastructure practices. No online
          service can guarantee absolute security, but we work to reduce risk
          and respond to incidents promptly.
        </p>
      </LegalSection>

      <LegalSection title="8. Data Retention">
        <p>
          We retain account, billing, and usage data for as long as your account
          is active or as needed to provide services, comply with legal
          obligations, resolve disputes, and enforce our agreements. You may
          request deletion of your account subject to applicable retention
          requirements.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Rights">
        <p>
          Depending on your location, you may have rights to access, correct,
          update, export, or delete personal information, or to object to or
          restrict certain processing. To exercise these rights, contact us at{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . We may need to verify your identity before fulfilling a request.
        </p>
      </LegalSection>

      <LegalSection title="10. International Users">
        <p>
          Advora AI is operated from India. If you access the service from
          outside India, you understand that your information may be processed in
          India or other locations where our service providers operate.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will revise the Last Updated date at the top of this page. Material
          changes may also be communicated through the product or by email where
          appropriate.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact Us">
        <p>
          For privacy-related questions or requests, contact{" "}
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
