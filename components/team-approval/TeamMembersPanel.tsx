"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import {
  TEAM_ROLE_LABELS,
  type TeamMember,
  type TeamPermissions,
  type TeamRole,
} from "@/lib/team-approval/types";

type TeamMembersPanelProps = {
  members: TeamMember[];
  permissions: TeamPermissions;
  onInvite: (email: string, role: Exclude<TeamRole, "owner">) => Promise<void>;
  onChangeRole: (
    memberId: string,
    role: Exclude<TeamRole, "owner">
  ) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
};

export default function TeamMembersPanel({
  members,
  permissions,
  onInvite,
  onChangeRole,
  onRemove,
}: TeamMembersPanelProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<TeamRole, "owner">>("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    setBusy(true);
    setError(null);
    try {
      await onInvite(email.trim(), role);
      setEmail("");
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to invite member."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
            Team
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">
            Members & roles
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/60">
          {members.length}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {members.map((member) => (
          <motion.li
            key={member.id}
            layout
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {member.email}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">
                  {TEAM_ROLE_LABELS[member.role]} · {member.status}
                </p>
              </div>
              {permissions.canManageMembers && member.role !== "owner" ? (
                <div className="flex flex-col items-end gap-1">
                  <select
                    value={member.role}
                    onChange={(event) => {
                      const next = event.target.value as Exclude<
                        TeamRole,
                        "owner"
                      >;
                      void onChangeRole(member.id, next);
                    }}
                    className="rounded-lg border border-white/10 bg-[#0b0818] px-2 py-1 text-xs text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void onRemove(member.id)}
                    className="text-[11px] text-rose-300/80 hover:text-rose-200"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          </motion.li>
        ))}
      </ul>

      {permissions.canManageMembers ? (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <label className="block text-xs font-medium text-white/60">
            Invite by email
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-cyan-400/30 placeholder:text-white/30 focus:ring-2"
            />
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as Exclude<TeamRole, "owner">)
              }
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <button
            type="button"
            disabled={busy || !email.trim()}
            onClick={() => void handleInvite()}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {busy ? "Inviting…" : "Invite member"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
