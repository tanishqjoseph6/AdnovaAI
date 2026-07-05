"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useIsDesktopNav } from "@/hooks/useMediaQuery";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import UserAvatar from "@/components/settings/UserAvatar";
import { invalidateCreditsCache } from "@/hooks/useCredits";
import { supabase } from "@/lib/supabase";

type ProfileMenuItem = {
  id: string;
  label: string;
  href?: string;
  icon: typeof User;
  external?: boolean;
  isActive?: (pathname: string) => boolean;
};

const MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: "profile",
    label: "My Profile",
    href: "/dashboard/settings",
    icon: User,
    isActive: (pathname) => pathname === "/dashboard/settings",
  },
  {
    id: "billing",
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    isActive: (pathname) => pathname.startsWith("/dashboard/billing"),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    isActive: (pathname) => pathname.startsWith("/dashboard/settings"),
  },
  {
    id: "help",
    label: "Help Center",
    href: "/#cta",
    icon: HelpCircle,
    external: false,
    isActive: () => false,
  },
];

function MenuLink({
  item,
  active,
  onNavigate,
}: {
  item: ProfileMenuItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const className = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
    active
      ? "bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-fuchsia-500/15 text-white ring-1 ring-white/10"
      : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
  }`;

  const content = (
    <>
      <Icon
        className={`h-4 w-4 shrink-0 ${active ? "text-cyan-300" : "text-zinc-500"}`}
        aria-hidden
      />
      <span className="font-medium">{item.label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden />
      )}
    </>
  );

  if (!item.href) {
    return null;
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {content}
    </Link>
  );
}

type ProfilePanelProps = {
  displayName: string;
  initials: string;
  pathname: string;
  isSigningOut: boolean;
  onNavigate: () => void;
  onSignOut: () => void;
  className?: string;
};

function ProfilePanel({
  displayName,
  initials,
  pathname,
  isSigningOut,
  onNavigate,
  onSignOut,
  className = "",
}: ProfilePanelProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0a0618]/95 shadow-2xl shadow-violet-500/10 backdrop-blur-xl ${className}`}
      role="menu"
      aria-label="Account menu"
    >
      {(displayName || initials) && (
        <div className="border-b border-white/[0.06] px-4 py-3">
          <p className="truncate text-sm font-semibold text-white">
            {displayName || "Account"}
          </p>
          <p className="text-xs text-zinc-500">Manage your account</p>
        </div>
      )}

      <div className="p-2">
        {MENU_ITEMS.map((item) => (
          <MenuLink
            key={item.id}
            item={item}
            active={item.isActive?.(pathname) ?? false}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="border-t border-white/[0.06] p-2">
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          role="menuitem"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {isSigningOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </div>
  );
}

export default function ProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { initials, displayName, imageUrl } = useUserAvatar();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDesktopNav = useIsDesktopNav();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        if (target.closest("[data-profile-panel]")) {
          return;
        }
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || isDesktopNav) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isDesktopNav]);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setOpen(false);

    try {
      invalidateCreditsCache();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  const panelProps = {
    displayName,
    initials,
    pathname,
    isSigningOut,
    onNavigate: () => setOpen(false),
    onSignOut: () => void handleSignOut(),
  };

  const mobilePanel =
    mounted &&
    open &&
    !isDesktopNav &&
    createPortal(
      <>
        <button
          type="button"
          aria-label="Close account menu"
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
        <motion.div
          data-profile-panel
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed left-3 right-3 top-[calc(4.25rem+env(safe-area-inset-top))] z-[60]"
        >
          <ProfilePanel {...panelProps} className="w-full" />
        </motion.div>
      </>,
      document.body
    );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-2 transition hover:bg-white/[0.06] sm:pr-3"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <UserAvatar
          imageUrl={imageUrl}
          initials={initials}
          className="h-7 w-7 rounded-lg"
          textClassName="text-xs font-semibold"
        />
        {displayName && (
          <span className="hidden max-w-[8rem] truncate text-sm font-medium text-zinc-300 md:inline">
            {displayName}
          </span>
        )}
        <svg
          className={`hidden h-4 w-4 text-zinc-500 transition md:block ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && isDesktopNav && (
          <motion.div
            data-profile-panel
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 max-w-[calc(100vw-2rem)]"
          >
            <ProfilePanel {...panelProps} />
          </motion.div>
        )}
      </AnimatePresence>

      {mobilePanel}
    </div>
  );
}
