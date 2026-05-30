export type NavItem = {
  label: string;
  href: string;
  icon: "dashboard" | "generate" | "history" | "billing" | "settings";
};

export const dashboardNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Generate Ads", href: "/dashboard/generate", icon: "generate" },
  { label: "History", href: "/dashboard/history", icon: "history" },
  { label: "Billing", href: "/dashboard/billing", icon: "billing" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];
