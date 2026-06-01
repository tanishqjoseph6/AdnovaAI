import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Advora AI",
  },
  description: "Manage your AI-generated ad campaigns",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
