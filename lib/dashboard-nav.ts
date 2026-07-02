export type NavItem = {
  label: string;
  href: string;
  icon:
    | "dashboard"
    | "generate"
    | "brand"
    | "referrals"
    | "scheduler"
    | "landing"
    | "competitor"
    | "history"
    | "billing"
    | "settings"
    | "admin";
  adminOnly?: boolean;
};

export const dashboardNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Generate Ads", href: "/dashboard/generate", icon: "generate" },
  { label: "Brand Kit", href: "/dashboard/brand-kit", icon: "brand" },
  {
    label: "Social Scheduler",
    href: "/dashboard/social-scheduler",
    icon: "scheduler",
  },
  { label: "Referrals", href: "/dashboard/referrals", icon: "referrals" },
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
  {
    label: "Admin → Feedback",
    href: "/dashboard/admin/feedback",
    icon: "admin",
    adminOnly: true,
  },
];
