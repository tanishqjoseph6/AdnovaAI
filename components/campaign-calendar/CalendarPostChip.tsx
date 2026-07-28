"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import {
  CALENDAR_STATUS_LABELS,
  resolvePostColor,
} from "@/lib/campaign-calendar/utils";
import type { Campaign, ScheduledPost } from "@/lib/social-scheduler/types";
import { formatSchedulerDateTime } from "@/lib/social-scheduler/format";

type CalendarPostChipProps = {
  post: ScheduledPost;
  campaigns: Campaign[];
  compact?: boolean;
  onSelect: (post: ScheduledPost) => void;
};

export function CalendarPostChip({
  post,
  campaigns,
  compact = false,
  onSelect,
}: CalendarPostChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: post.id,
      data: { post },
      disabled: post.status === "published",
    });

  const campaign = campaigns.find((item) => item.id === post.campaignId);
  const color = resolvePostColor(post, campaign?.color);

  const style = {
    transform: CSS.Translate.toString(transform),
    borderLeftColor: color,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(post)}
      className={`w-full rounded-lg border border-white/10 border-l-4 bg-black/30 text-left transition hover:border-white/20 hover:bg-black/40 ${
        compact ? "px-1.5 py-1" : "px-2.5 py-2"
      } ${isDragging ? "z-20 shadow-lg shadow-violet-500/20" : ""}`}
      title={post.caption}
    >
      <div className="flex items-center gap-1.5">
        <PlatformIcon platform={post.platform} className="h-3 w-3 shrink-0" />
        <span
          className={`truncate text-zinc-200 ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          {post.caption}
        </span>
      </div>
      {!compact ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[10px] text-zinc-500">
            {formatSchedulerDateTime(post.scheduledFor)}
          </span>
          <span className="text-[10px] text-zinc-400">
            {CALENDAR_STATUS_LABELS[post.status]}
          </span>
        </div>
      ) : null}
    </button>
  );
}

type CalendarDayDropZoneProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function CalendarDayDropZone({
  id,
  children,
  className = "",
}: CalendarDayDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${
        isOver ? "ring-2 ring-cyan-400/40 bg-cyan-500/[0.08]" : ""
      }`}
    >
      {children}
    </div>
  );
}
