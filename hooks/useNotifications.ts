"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppNotification } from "@/lib/notifications/types";

type NotificationsResponse = {
  notifications?: AppNotification[];
  error?: string;
  schemaReady?: boolean;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as
        NotificationsResponse;

      if (!response.ok) {
        console.error("Notifications API returned an error:", {
          status: response.status,
          error: payload.error,
        });
        setNotifications([]);
        return;
      }

      if (payload.schemaReady === false) {
        console.warn(
          "Notifications schema is not ready. Returning an empty notification list."
        );
      }

      setNotifications(
        Array.isArray(payload.notifications) ? payload.notifications : []
      );
    } catch (error) {
      console.error("Notifications load failed:", error);
      setNotifications([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    const onFocus = () => void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 30_000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      void fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
      }).catch((error) => {
        console.error("Notification mark-read failed:", error);
        void loadNotifications();
      });
    },
    [loadNotifications]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );

    void fetch("/api/notifications/read-all", {
      method: "PATCH",
    }).catch((error) => {
      console.error("Notifications mark-all-read failed:", error);
      void loadNotifications();
    });
  }, [loadNotifications]);

  const refresh = useCallback(() => {
    void loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    hydrated,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
