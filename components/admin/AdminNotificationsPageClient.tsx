"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminUserView } from "@/lib/admin/users";

type AdminNotificationView = {
  id: string;
  userId: string;
  user: AdminUserView | null;
  title: string;
  message: string;
  isRead: boolean;
  feedbackId: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications?: AdminNotificationView[];
  error?: string;
};

type UsersResponse = {
  users?: AdminUserView[];
  error?: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminNotificationsPageClient() {
  const [notifications, setNotifications] = useState<AdminNotificationView[]>([]);
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function loadData() {
    setIsLoading(true);
    try {
      const [notificationsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/notifications", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);
      const notificationsPayload =
        (await notificationsResponse.json().catch(() => ({}))) as NotificationsResponse;
      const usersPayload = (await usersResponse.json().catch(() => ({}))) as
        UsersResponse;

      if (!notificationsResponse.ok) {
        throw new Error(
          notificationsPayload.error ?? "Unable to load notifications."
        );
      }

      if (!usersResponse.ok) {
        throw new Error(usersPayload.error ?? "Unable to load users.");
      }

      setNotifications(notificationsPayload.notifications ?? []);
      setUsers(usersPayload.users ?? []);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to load notifications.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  async function sendNotification() {
    if (isSending) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          title,
          message,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send notification.");
      }

      setTitle("");
      setMessage("");
      setSelectedUserId("");
      setToast({ type: "success", message: "Notification sent." });
      await loadData();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send notification.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/25 bg-red-400/10 text-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="text-sm text-zinc-500">Total notifications</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {notifications.length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="text-sm text-zinc-500">Unread</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-200">
            {unreadCount}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Send notification</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">User</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="" className="bg-[#09031f]">
                Choose a user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-[#09031f]">
                  {user.email || user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Notification title"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-zinc-200">Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Write the notification message..."
            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>

        <button
          type="button"
          onClick={() => void sendNotification()}
          disabled={isSending}
          className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSending ? "Sending..." : "Send Notification"}
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            No notifications sent yet.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {notifications.map((notification) => (
              <article key={notification.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{notification.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">
                      To {notification.user?.email ?? notification.userId} ·{" "}
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
                      notification.isRead
                        ? "border-zinc-400/20 bg-white/[0.04] text-zinc-400"
                        : "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
                    }`}
                  >
                    {notification.isRead ? "Read" : "Unread"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
