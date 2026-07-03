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
  }, [search]);

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
                className="grid gap-4 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{user.name}</p>
                  <p className="truncate text-sm text-zinc-500">{user.email}</p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize ${roleClasses(
                    user.role
                  )}`}
                >
                  {roleLabel(user.role)}
                </span>

                <div className="flex gap-2">
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
