"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import ApprovalDetailDrawer from "@/components/team-approval/ApprovalDetailDrawer";
import ApprovalQueue from "@/components/team-approval/ApprovalQueue";
import ApprovalSkeleton from "@/components/team-approval/ApprovalSkeleton";
import TeamMembersPanel from "@/components/team-approval/TeamMembersPanel";
import {
  approvePost,
  fetchApprovals,
  fetchTeamAuditLogs,
  fetchTeamDashboard,
  inviteTeamMember,
  rejectPost,
  removeTeamMember,
  scheduleApprovedPost,
  submitForApproval,
  updateTeamMemberRole,
} from "@/lib/api/team-approval-client";
import type { ScheduledPost } from "@/lib/social-scheduler/types";
import type {
  ApprovalWorkflowStatus,
  Team,
  TeamAuditLog,
  TeamDashboardSummary,
  TeamMember,
  TeamPermissions,
} from "@/lib/team-approval/types";
import { TEAM_ROLE_LABELS } from "@/lib/team-approval/types";

const emptySummary: TeamDashboardSummary = {
  draft: 0,
  pendingApproval: 0,
  approved: 0,
  scheduled: 0,
  published: 0,
  rejected: 0,
  failed: 0,
  members: 0,
};

const emptyPermissions: TeamPermissions = {
  canSubmit: false,
  canApprove: false,
  canReject: false,
  canSchedule: false,
  canComment: false,
  canManageMembers: false,
  canViewAudit: false,
  canEditAny: false,
};

export default function TeamApprovalsPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [membership, setMembership] = useState<TeamMember | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [permissions, setPermissions] =
    useState<TeamPermissions>(emptyPermissions);
  const [summary, setSummary] = useState<TeamDashboardSummary>(emptySummary);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [auditLogs, setAuditLogs] = useState<TeamAuditLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    ApprovalWorkflowStatus | "all"
  >("pending_approval");
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refresh = useCallback(async () => {
    const [dashboard, approvals] = await Promise.all([
      fetchTeamDashboard(),
      fetchApprovals({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
    ]);

    setTeam(dashboard.team);
    setMembership(dashboard.membership);
    setMembers(dashboard.members);
    setPermissions(dashboard.permissions);
    setSummary(dashboard.summary);
    setPosts(approvals.posts);

    if (dashboard.permissions.canViewAudit) {
      try {
        const logs = await fetchTeamAuditLogs();
        setAuditLogs(logs);
      } catch {
        setAuditLogs([]);
      }
    } else {
      setAuditLogs([]);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (bootError) {
        if (!cancelled) {
          setError(
            bootError instanceof Error
              ? bootError.message
              : "Unable to load team approvals."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const stats = useMemo(
    () => [
      { label: "Pending", value: summary.pendingApproval },
      { label: "Approved", value: summary.approved },
      { label: "Scheduled", value: summary.scheduled },
      { label: "Members", value: summary.members },
    ],
    [summary]
  );

  async function replacePost(updated: ScheduledPost) {
    setPosts((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelectedPost(updated);
    await refresh();
  }

  if (loading) return <ApprovalSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-8 text-center">
        <p className="text-sm text-rose-100">{error}</p>
        <button
          type="button"
          onClick={() => void refresh().then(() => setError(null))}
          className="mt-4 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#120b28] via-[#0b1328] to-[#071018] p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Team approval workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {team?.name ?? "Team workspace"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              Draft → Pending Approval → Approved → Scheduled → Published.
              {membership
                ? ` You are ${TEAM_ROLE_LABELS[membership.role]}.`
                : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
              >
                <p className="text-[11px] uppercase tracking-wider text-white/40">
                  {stat.label}
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ApprovalQueue
          posts={posts}
          statusFilter={statusFilter}
          search={search}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearch}
          onSelect={setSelectedPost}
        />

        <div className="space-y-4">
          <TeamMembersPanel
            members={members}
            permissions={permissions}
            onInvite={async (email, role) => {
              const member = await inviteTeamMember({ email, role });
              setMembers((current) => [...current, member]);
              showToast("Member invited.");
              await refresh();
            }}
            onChangeRole={async (memberId, role) => {
              const updated = await updateTeamMemberRole(memberId, role);
              setMembers((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item
                )
              );
              showToast("Role updated.");
            }}
            onRemove={async (memberId) => {
              await removeTeamMember(memberId);
              setMembers((current) =>
                current.filter((item) => item.id !== memberId)
              );
              showToast("Member removed.");
            }}
          />

          {permissions.canViewAudit ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Audit logs
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">
                Recent team actions
              </h3>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <li className="text-sm text-white/40">No audit events yet.</li>
                ) : (
                  auditLogs.slice(0, 20).map((log) => (
                    <li
                      key={log.id}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <p className="text-sm text-white/85">
                        {log.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {log.actorEmail ?? "System"} ·{" "}
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <ApprovalDetailDrawer
        post={selectedPost}
        open={Boolean(selectedPost)}
        permissions={permissions}
        onClose={() => setSelectedPost(null)}
        onSubmit={async (postId) => {
          const updated = await submitForApproval(postId);
          await replacePost(updated);
          showToast("Submitted for approval.");
        }}
        onApprove={async (postId) => {
          const updated = await approvePost(postId);
          await replacePost(updated);
          showToast("Post approved.");
        }}
        onReject={async (postId, reason) => {
          const updated = await rejectPost(postId, reason);
          await replacePost(updated);
          showToast("Post rejected.");
        }}
        onSchedule={async (postId) => {
          const updated = await scheduleApprovedPost(postId);
          await replacePost(updated);
          showToast("Post scheduled.");
        }}
      />

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-sm text-emerald-50 shadow-lg backdrop-blur"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
