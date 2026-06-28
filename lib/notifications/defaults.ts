import type { AppNotification } from "@/lib/notifications/types";

const NOW = new Date().toISOString();

export const DEFAULT_NOTIFICATIONS: Omit<AppNotification, "read">[] = [
  {
    id: "welcome-advora",
    title: "Welcome to Advora",
    body: "Your AI ad workspace is ready. Start generating scroll-stopping ads in seconds.",
    category: "welcome",
    createdAt: NOW,
    href: "/dashboard/generate",
  },
  {
    id: "new-features",
    title: "New features",
    body: "Explore Competitor Analyzer, Landing Page Analyzer, and AI Ad Score from your dashboard.",
    category: "features",
    createdAt: NOW,
    href: "/dashboard/competitor-analyzer",
  },
  {
    id: "billing-updates",
    title: "Billing updates",
    body: "Monthly and yearly plans are now available in INR and USD from the Billing page.",
    category: "billing",
    createdAt: NOW,
    href: "/dashboard/billing",
  },
  {
    id: "product-announcements",
    title: "Product announcements",
    body: "We're rolling out premium AI models for Pro subscribers. Stay tuned for updates.",
    category: "product",
    createdAt: NOW,
    href: "/dashboard",
  },
];

export const NOTIFICATIONS_STORAGE_KEY = "advora-notifications-v1";
