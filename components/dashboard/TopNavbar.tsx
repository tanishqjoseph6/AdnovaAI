"use client";

import Link from "next/link";
import CreditBadge from "@/components/credits/CreditBadge";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProfileMenu from "@/components/dashboard/ProfileMenu";

type TopNavbarProps = {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  sidebarOpen?: boolean;
  onSidebarClose?: () => void;
};

export default function TopNavbar({
  title,
  subtitle,
  onMenuClick,
  sidebarOpen = false,
  onSidebarClose,
}: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#030014]/80 backdrop-blur-xl">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6 sm:py-0 sm:pt-[max(0px,env(safe-area-inset-top))] lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={sidebarOpen ? onSidebarClose : onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-white sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-zinc-500 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 md:flex md:max-w-xs lg:max-w-sm">
            <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search ads..."
              aria-label="Search ads"
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
            />
            <kbd className="hidden shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-600 lg:inline">
              ⌘K
            </kbd>
          </div>

          <NotificationBell />

          <CreditBadge />

          <Link
            href="/dashboard/generate"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New ad</span>
            <span className="sm:hidden">New</span>
          </Link>

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
