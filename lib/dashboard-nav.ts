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
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: "admin" },
  { label: "Users", href: "/dashboard/admin/users", icon: "admin" },
  { label: "Payments", href: "/dashboard/admin/payments", icon: "admin" },
  { label: "Feedback", href: "/dashboard/admin/feedback", icon: "admin" },
  {
    label: "Notifications",
    href: "/dashboard/admin/notifications",
    icon: "admin",
  },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: "admin" },
  {
    label: "Announcements",
    href: "/dashboard/admin/announcements",
    icon: "admin",
  },
  { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: "admin" },
  { label: "Admin Settings", href: "/dashboard/admin/settings", icon: "admin" },
];
