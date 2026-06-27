export type NavItem = {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "generate"
    | "landing"
    | "competitor"
    | "history"
    | "billing"
    | "settings";
};

export const dashboardNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Generate Ads", href: "/dashboard/generate", icon: "generate" },
  {
    label: "Landing Analyzer",
    href: "/dashboard/landing-analyzer",
    icon: "landing",
  },
  {
    label: "Competitor Ad Analyzer",
    href: "/dashboard/competitor-analyzer",
    icon: "competitor",
  },
  { label: "History", href: "/dashboard/history", icon: "history" },
  { label: "Billing", href: "/dashboard/billing", icon: "billing" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];
