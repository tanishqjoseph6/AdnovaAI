"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsDesktopNav } from "@/hooks/useMediaQuery";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification, NotificationCategory } from "@/lib/notifications/types";

const CATEGORY_STYLES: Record<
  NotificationCategory,
  { icon: string; accent: string; bg: string }
> = {
  welcome: {
    icon: "👋",
    accent: "text-cyan-300",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  features: {
    icon: "✨",
    accent: "text-violet-300",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  billing: {
    icon: "💳",
    accent: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  product: {
    icon: "📣",
    accent: "text-fuchsia-300",
    bg: "bg-fuchsia-500/10 border-fuchsia-500/20",
  },
};

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const styles = CATEGORY_STYLES[notification.category];
  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base ${styles.bg}`}
        aria-hidden
      >
        {styles.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`break-words text-sm font-semibold ${
              notification.read ? "text-zinc-400" : "text-white"
            }`}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400"
              aria-hidden
            />
          )}
        </div>
        <p className="mt-1 break-words text-xs leading-relaxed text-zinc-500">
          {notification.body}
        </p>
        <p className="mt-2 text-[11px] text-zinc-600">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </>
  );

  const itemClass = `flex w-full gap-3 rounded-xl px-3 py-3 text-left transition ${
    notification.read
      ? "hover:bg-white/[0.03]"
      : "bg-white/[0.04] hover:bg-white/[0.06]"
  }`;

  if (notification.href) {
    return (
      <Link
        href={notification.href}
        onClick={() => onRead(notification.id)}
        className={itemClass}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRead(notification.id)}
      className={itemClass}
    >
      {content}
    </button>
  );
}

type NotificationPanelProps = {
  unreadCount: number;
  notifications: AppNotification[];
  showEmpty: boolean;
  showCaughtUp: boolean;
  markAllAsRead: () => void;
  onRead: (id: string) => void;
  className?: string;
};

function NotificationPanel({
  unreadCount,
  notifications,
  showEmpty,
  showCaughtUp,
  markAllAsRead,
  onRead,
  className = "",
}: NotificationPanelProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0618]/95 shadow-2xl shadow-violet-500/10 backdrop-blur-xl ${className}`}
      role="menu"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Notifications</p>
          {unreadCount > 0 && (
            <p className="text-xs text-zinc-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="shrink-0 text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto p-2 sm:max-h-[min(24rem,60vh)]">
        {showEmpty ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <span className="text-2xl" aria-hidden>
              ✓
            </span>
            <p className="mt-3 text-sm font-medium text-zinc-300">
              You&apos;re all caught up.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              No new notifications right now.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onRead}
              />
            ))}
          </div>
        )}
      </div>

      {showCaughtUp && (
        <div className="border-t border-white/[0.06] px-4 py-3 text-center">
          <p className="text-xs text-zinc-500">You&apos;re all caught up.</p>
        </div>
      )}
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, hydrated, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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
        if (target.closest("[data-notification-panel]")) {
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

  const showEmpty = notifications.length === 0;
  const showCaughtUp = !showEmpty && unreadCount === 0;

  const panelProps = {
    unreadCount,
    notifications,
    showEmpty,
    showCaughtUp,
    markAllAsRead,
    onRead: markAsRead,
  };

  const mobilePanel =
    mounted &&
    open &&
    !isDesktopNav &&
    createPortal(
      <>
        <button
          type="button"
          aria-label="Close notifications"
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
        <motion.div
          data-notification-panel
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed left-3 right-3 top-[calc(4.25rem+env(safe-area-inset-top))] z-[60] max-h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom))]"
        >
          <NotificationPanel
            {...panelProps}
            className="flex max-h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom))] flex-col"
          />
        </motion.div>
      </>,
      document.body
    );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white sm:h-10 sm:w-10"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {hydrated && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#030014]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && isDesktopNav && (
          <motion.div
            data-notification-panel
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            <NotificationPanel
              {...panelProps}
              className="max-h-[min(24rem,60vh)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {mobilePanel}
    </div>
  );
}
