"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
import { usePathname } from "next/navigation";
import { AuthToastProvider } from "@/components/auth/AuthToast";
import CreditRefillToast from "@/components/dashboard/CreditRefillToast";
import NoCreditsModalHost from "@/components/credits/NoCreditsModalHost";
import { CreditsProvider } from "@/hooks/useCredits";
import { PlanFeaturesProvider } from "@/hooks/usePlanFeatures";
import FeedbackLauncher from "./FeedbackLauncher";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function DashboardShell({
  title,
  subtitle,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    startTransition(() => closeSidebar());
  }, [pathname, closeSidebar]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen, closeSidebar]);

  return (
    <AuthToastProvider>
      <CreditsProvider>
        <PlanFeaturesProvider>
          <CreditRefillToast />
          <NoCreditsModalHost />
          <div className="flex min-h-screen min-h-[100dvh] bg-[#030014] text-zinc-100">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
              <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-600/10 blur-[100px]" />
              <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-[100px]" />
            </div>

            <Sidebar open={sidebarOpen} onClose={closeSidebar} />

            <div className="relative flex min-w-0 flex-1 flex-col overflow-x-hidden">
              <TopNavbar
                title={title}
                subtitle={subtitle}
                onMenuClick={() => setSidebarOpen(true)}
                sidebarOpen={sidebarOpen}
                onSidebarClose={closeSidebar}
              />
              <main className="dashboard-scrollbar flex-1 overflow-x-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl">{children}</div>
              </main>
              <FeedbackLauncher />
            </div>
          </div>
        </PlanFeaturesProvider>
      </CreditsProvider>
    </AuthToastProvider>
  );
}
