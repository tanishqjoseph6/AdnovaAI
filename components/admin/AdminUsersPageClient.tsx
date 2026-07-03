"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProfileRole } from "@/lib/admin/auth";
import type { AdminUserView } from "@/lib/admin/users";

type UsersResponse = {
  users?: AdminUserView[];
  viewerRole?: ProfileRole;
  error?: string;
};

function roleClasses(role: ProfileRole): string {
  if (role === "owner") return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  if (role === "team_member") return "border-violet-400/25 bg-violet-400/10 text-violet-200";
  return "border-zinc-400/20 bg-white/[0.04] text-zinc-300";
}

function roleLabel(role: ProfileRole): string {
  if (role === "team_member") return "Team Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AdminUsersPageClient() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [viewerRole, setViewerRole] = useState<ProfileRole>("user");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const canManageRoles = viewerRole === "owner";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      async function loadUsers() {
        setIsLoading(true);
        try {
          const params = new URLSearchParams();
          if (search.trim()) params.set("search", search.trim());
          const response = await fetch(`/api/admin/users?${params.toString()}`, {
            cache: "no-store",
          });
          const payload = (await response.json().catch(() => ({}))) as
            UsersResponse;
          if (!response.ok) {
            throw new Error(payload.error ?? "Unable to load users.");
          }

          setUsers(payload.users ?? []);
          setViewerRole(payload.viewerRole ?? "user");
        } catch (error) {
          setToast({
            type: "error",
            message:
              error instanceof Error ? error.message : "Unable to load users.",
          });
        } finally {
          setIsLoading(false);
        }
      }

      void loadUsers();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(
    () => ({
      owners: users.filter((user) => user.role === "owner").length,
      teamMembers: users.filter((user) => user.role === "team_member").length,
      users: users.filter((user) => user.role === "user").length,
    }),
    [users]
  );

  async function changeRole(
    userId: string,
    role: "team_member" | "user"
  ) {
    if (!canManageRoles || savingId) return;

    setSavingId(userId);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      const payload = (await response.json().catch(() => ({}))) as
        | { user?: AdminUserView; error?: string }
        | undefined;
      if (!response.ok || !payload?.user) {
        throw new Error(payload?.error ?? "Unable to update role.");
      }

      setUsers((current) =>
        current.map((user) => (user.id === userId ? payload.user! : user))
      );
      setToast({ type: "success", message: "User role updated." });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to update role.",
      });
    } finally {
      setSavingId(null);
    }
  }

  async function runUserAction(
    user: AdminUserView,
    action: "suspend" | "unsuspend" | "delete" | "edit_credits" | "change_plan"
  ) {
    if (!canManageRoles || savingId) return;

    const payload: Record<string, string | number> = { action };
    if (action === "delete") {
      const confirmed = window.confirm(
        `Delete ${user.email}? This marks the account as deleted and keeps data for audit/history.`
      );
      if (!confirmed) return;
    }

    if (action === "suspend") {
      const confirmed = window.confirm(`Suspend ${user.email}?`);
      if (!confirmed) return;
    }

    if (action === "edit_credits") {
      const value = window.prompt(
        `Set credits for ${user.email}`,
        String(user.credits ?? 0)
      );
      if (value === null) return;
      const credits = Number(value);
      if (!Number.isInteger(credits) || credits < 0) {
        setToast({ type: "error", message: "Credits must be a non-negative integer." });
        return;
      }
      payload.credits = credits;
    }

    if (action === "change_plan") {
      const value = window.prompt(
        `Set plan for ${user.email} (free, starter, pro, custom)`,
        user.plan
      );
      if (value === null) return;
      if (!["free", "starter", "pro", "custom"].includes(value)) {
        setToast({ type: "error", message: "Plan must be free, starter, pro, or custom." });
        return;
      }
      payload.plan = value;
    }

    setSavingId(user.id);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(user.id)}/actions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Unable to update user.");
      setToast({ type: "success", message: "User updated." });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update user.",
      });
    } finally {
      setSavingId(null);
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

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Owners", stats.owners],
          ["Team Members", stats.teamMembers],
          ["Users", stats.users],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl"
          >
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
        <label className="block">
          <span className="text-sm font-medium text-zinc-200">Search users</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or username"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            No users found.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {users.map((user) => (
              <div
                key={user.id}
                className="grid gap-4 p-4 xl:grid-cols-[1.4fr_7rem_6rem_8rem_9rem_auto] xl:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{user.name}</p>
                  <p className="truncate text-sm text-zinc-500">{user.email}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Joined {user.joinedAt ?? "Unknown"} · Last login {user.lastLoginAt ?? "Never"}
                  </p>
                </div>

                <p className="text-sm capitalize text-zinc-300">{user.plan}</p>
                <p className="text-sm text-zinc-300">{user.credits ?? "—"}</p>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize ${roleClasses(
                    user.role
                  )}`}
                >
                  {roleLabel(user.role)}
                </span>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                    user.status === "active"
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                      : "border-red-400/25 bg-red-400/10 text-red-200"
                  }`}
                >
                  {user.status}
                </span>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setToast({
                        type: "success",
                        message: `${user.name} · ${user.email} · ${user.plan} · ${user.credits ?? 0} credits`,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300"
                  >
                    View
                  </button>
                  {user.role === "owner" ? (
                    <span className="text-xs text-zinc-500">
                      Owner role is locked
                    </span>
                  ) : canManageRoles ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void changeRole(user.id, "team_member")}
                        disabled={savingId === user.id || user.role === "team_member"}
                        className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-200 transition hover:border-violet-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Team
                      </button>
                      <button
                        type="button"
                        onClick={() => void changeRole(user.id, "user")}
                        disabled={savingId === user.id || user.role === "user"}
                        className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:border-red-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        User
                      </button>
                      <button
                        type="button"
                        onClick={() => void runUserAction(user, "edit_credits")}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300"
                      >
                        Credits
                      </button>
                      <button
                        type="button"
                        onClick={() => void runUserAction(user, "change_plan")}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300"
                      >
                        Plan
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void runUserAction(
                            user,
                            user.status === "suspended" ? "unsuspend" : "suspend"
                          )
                        }
                        className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200"
                      >
                        {user.status === "suspended" ? "Unsuspend" : "Suspend"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void runUserAction(user, "delete")}
                        className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-500">
                      Owner only
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
