"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_NOTIFICATIONS,
  NOTIFICATIONS_STORAGE_KEY,
} from "@/lib/notifications/defaults";
import type { AppNotification, NotificationState } from "@/lib/notifications/types";

function loadReadIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as NotificationState;
    return Array.isArray(parsed.readIds) ? parsed.readIds : [];
  } catch {
    return [];
  }
}

function saveReadIds(readIds: string[]): void {
  const state: NotificationState = { readIds };
  window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(state));
}

function buildNotifications(readIds: string[]): AppNotification[] {
  return DEFAULT_NOTIFICATIONS.map((notification) => ({
    ...notification,
    read: readIds.includes(notification.id),
  }));
}

export function useNotifications() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(loadReadIds());
    setHydrated(true);
  }, []);

  const notifications = useMemo(
    () => buildNotifications(readIds),
    [readIds]
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((current) => {
      if (current.includes(id)) {
        return current;
      }

      const next = [...current, id];
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((current) => {
      const allIds = DEFAULT_NOTIFICATIONS.map((notification) => notification.id);
      const hasUnread = allIds.some((id) => !current.includes(id));

      if (!hasUnread) {
        return current;
      }

      saveReadIds(allIds);
      return allIds;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    hydrated,
    markAsRead,
    markAllAsRead,
  };
}
