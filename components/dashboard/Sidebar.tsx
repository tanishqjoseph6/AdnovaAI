"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNav } from "@/lib/dashboard-nav";
import NavIcon from "./NavIcon";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        id="dashboard-sidebar"
        aria-label="Dashboard navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(16rem,85vw)] flex-col border-r border-white/[0.06] bg-[#050118]/95 backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/[0.06] px-4 pt-[env(safe-area-inset-top)] sm:px-5 lg:pt-0">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
              A
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                AdNova<span className="text-cyan-400">AI</span>
              </p>
              <p className="truncate text-xs text-zinc-500">Pro workspace</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="dashboard-scrollbar flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main menu">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Menu
          </p>
          {dashboardNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-fuchsia-500/10 text-white shadow-inner shadow-violet-500/5"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    active
                      ? "bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-cyan-300"
                      : "bg-white/[0.04] text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Credits</span>
              <span className="font-medium text-cyan-400">342 left</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                style={{ width: "68%" }}
              />
            </div>
            <Link
              href="/dashboard/billing"
              onClick={onClose}
              className="mt-3 block text-center text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              Upgrade plan →
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
