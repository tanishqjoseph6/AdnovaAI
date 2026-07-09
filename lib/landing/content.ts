import { PLANS } from "@/lib/billing/plans";
import {
  FREE_PLAN_CREDITS,
  PRO_PLAN_CREDITS,
  STARTER_PLAN_CREDITS,
} from "@/lib/credits/plan-config";
import { SOCIAL_PLATFORMS, PLATFORM_LABELS } from "@/lib/social-scheduler/types";

export const TRUSTED_BRANDS = [
  "DTC Brands",
  "Performance Agencies",
  "SaaS Founders",
  "E-commerce",
  "Creators",
  "Growth Teams",
] as const;

export type LandingFeature = {
  id: string;
  title: string;
  description: string;
  href: string;
  tags: string[];
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: "generate",
    title: "AI Ad Generation",
    description:
      "Turn a product brief into 5 hooks, 3 captions, CTA suggestions, and a full UGC script in one run.",
    href: "/dashboard/generate",
    tags: ["Hooks", "Captions", "UGC", "CTAs"],
  },
  {
    id: "product-image",
    title: "Product Image Analysis",
    description:
      "Upload a product photo and let AI extract positioning, benefits, and copy-ready details automatically.",
    href: "/dashboard/generate",
    tags: ["Vision AI", "Auto-fill"],
  },
  {
    id: "ad-score",
    title: "Ad Performance Scoring",
    description:
      "Score generated hooks and captions for clarity, persuasion, and scroll-stopping potential before you publish.",
    href: "/dashboard/generate",
    tags: ["AI scoring", "Quality check"],
  },
  {
    id: "editor",
    title: "Content Editor & AI Rewrite",
    description:
      "Edit any hook, caption, CTA, or UGC script inline. Save versions, restore originals, or rewrite with AI.",
    href: "/dashboard/generate",
    tags: ["Edit", "Rewrite", "Save"],
  },
  {
    id: "brand-kit",
    title: "Brand Kit",
    description:
      "Store brand voice, writing style, CTA tone, and emoji usage once — every generation follows your identity.",
    href: "/dashboard/brand-kit",
    tags: ["Voice", "Autofill", "Consistency"],
  },
  {
    id: "competitor",
    title: "Competitor Ad Analyzer",
    description:
      "Upload a competitor ad screenshot for AI vision analysis, performance scores, insights, and a better ad draft.",
    href: "/dashboard/competitor-analyzer",
    tags: ["Vision AI", "PDF export"],
  },
  {
    id: "landing",
    title: "Landing Page Analyzer",
    description:
      "Paste any URL for conversion scoring, UX suggestions, and ready-to-use ad angles, hooks, and captions.",
    href: "/dashboard/landing-analyzer",
    tags: ["URL scan", "Ad strategy"],
  },
  {
    id: "scheduler",
    title: "Social Scheduler",
    description: `Plan posts for ${SOCIAL_PLATFORMS.map((p) => PLATFORM_LABELS[p]).join(", ")} with captions, images, and schedule times.`,
    href: "/dashboard/social-scheduler",
    tags: ["Schedule", "Multi-platform"],
  },
  {
    id: "history",
    title: "Generation History",
    description:
      "Search, filter, and revisit every ad generation and competitor analysis in one organized workspace.",
    href: "/dashboard/history",
    tags: ["Search", "Archive"],
  },
  {
    id: "referrals",
    title: "Referral Rewards",
    description:
      "Invite verified creators and earn credits or a free Starter month when they complete onboarding.",
    href: "/dashboard/referrals",
    tags: ["Credits", "Rewards"],
  },
  {
    id: "billing",
    title: "Billing & Invoices",
    description:
      "Upgrade with Razorpay, track credits, view payment history, and download PDF invoices anytime.",
    href: "/dashboard/billing",
    tags: ["Razorpay", "Invoices"],
  },
  {
    id: "dashboard",
    title: "Creative Dashboard",
    description:
      "Monitor credits, plan status, recent generations, and monthly activity from a single command center.",
    href: "/dashboard",
    tags: ["Metrics", "Credits"],
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Add your product",
    description:
      "Paste a description, product URL, or upload an image. Advora analyzes your offer and audience automatically.",
  },
  {
    step: "02",
    title: "Generate your ad kit",
    description:
      "Get hooks, captions, CTAs, and a UGC script tuned to your Brand Kit — scored and ready to refine in the editor.",
  },
  {
    step: "03",
    title: "Analyze, schedule & launch",
    description:
      "Benchmark competitors, analyze landing pages, schedule social posts, and ship creative across every channel.",
  },
] as const;

export const LANDING_FAQ = [
  {
    question: "What do I get on the Free plan?",
    answer: `${FREE_PLAN_CREDITS} AI credits per month with full access to hooks, captions, UGC scripts, the content editor, Brand Kit, analyzers, and history.`,
  },
  {
    question: "How much does Starter cost?",
    answer: `Starter is ${PLANS.starter.priceLabel} and includes ${STARTER_PLAN_CREDITS} AI credits per month with the same creative toolkit as Free.`,
  },
  {
    question: "What does Pro include?",
    answer: `Pro is ${PLANS.pro.priceLabel} with ${PRO_PLAN_CREDITS.toLocaleString("en-IN")} AI credits per month and priority support for teams scaling creative output.`,
  },
  {
    question: "Can Advora analyze competitor ads?",
    answer:
      "Yes. Upload any competitor ad screenshot for AI vision analysis, performance scores, improvement suggestions, a better ad draft, and PDF export.",
  },
  {
    question: "Does Brand Kit affect every generation?",
    answer:
      "Yes. Your saved brand voice, writing style, CTA tone, and emoji preferences are injected into every ad generation prompt.",
  },
  {
    question: "Which social platforms can I schedule?",
    answer: `${SOCIAL_PLATFORMS.map((p) => PLATFORM_LABELS[p]).join(", ")} — plan captions, images, and publish times from the Social Scheduler.`,
  },
] as const;
