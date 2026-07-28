"use client";

import {
  APPROVAL_STATUS_LABELS,
  type ApprovalWorkflowStatus,
} from "@/lib/team-approval/types";
import { CALENDAR_STATUS_COLORS } from "@/lib/campaign-calendar/utils";
import type { ScheduledPostStatus } from "@/lib/social-scheduler/types";

export default function ApprovalStatusBadge({
  status,
}: {
  status: ApprovalWorkflowStatus | ScheduledPostStatus;
}) {
  const className =
    CALENDAR_STATUS_COLORS[status as ScheduledPostStatus] ??
    "border-white/15 bg-white/5 text-white/70";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${className}`}
    >
      {APPROVAL_STATUS_LABELS[status as ApprovalWorkflowStatus] ?? status}
    </span>
  );
}
