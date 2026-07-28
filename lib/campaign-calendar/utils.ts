import type { ScheduledPost, ScheduledPostStatus, SocialPlatform } from "@/lib/social-scheduler/types";
import {
  formatSchedulerDateInput,
  formatSchedulerTimeInput,
  isSameLocalDay,
} from "@/lib/social-scheduler/format";

export type CalendarViewMode = "month" | "week" | "day";

export const CALENDAR_STATUS_LABELS: Record<ScheduledPostStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  upcoming: "Scheduled",
  published: "Published",
  failed: "Failed",
  rejected: "Rejected",
};

export const CALENDAR_STATUS_COLORS: Record<ScheduledPostStatus, string> = {
  draft: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  pending_approval: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  approved: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  upcoming: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  failed: "border-red-500/30 bg-red-500/10 text-red-300",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = day.getDay();
  day.setDate(day.getDate() - offset);
  return day;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayDropId(date: Date): string {
  return `day|${date.getFullYear()}|${date.getMonth()}|${date.getDate()}`;
}

export function parseDayDropId(value: string): Date | null {
  if (!value.startsWith("day|")) return null;
  const [, yearRaw, monthRaw, dayRaw] = value.split("|");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  return new Date(year, month, day);
}

export function groupPostsByDay(posts: ScheduledPost[]): Map<string, ScheduledPost[]> {
  const map = new Map<string, ScheduledPost[]>();
  for (const post of posts) {
    const date = new Date(post.scheduledFor);
    const key = dayKey(date);
    const existing = map.get(key) ?? [];
    existing.push(post);
    map.set(key, existing);
  }
  for (const [, list] of map) {
    list.sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  }
  return map;
}

export function filterCalendarPosts(
  posts: ScheduledPost[],
  filters: {
    search: string;
    platforms: SocialPlatform[];
    statuses: ScheduledPostStatus[];
    campaignId: string | null;
  }
): ScheduledPost[] {
  const search = filters.search.trim().toLowerCase();

  return posts.filter((post) => {
    if (filters.platforms.length > 0 && !filters.platforms.includes(post.platform)) {
      return false;
    }
    if (filters.statuses.length > 0 && !filters.statuses.includes(post.status)) {
      return false;
    }
    if (filters.campaignId && post.campaignId !== filters.campaignId) {
      return false;
    }
    if (!search) return true;
    return (
      post.caption.toLowerCase().includes(search) ||
      (post.notes ?? "").toLowerCase().includes(search)
    );
  });
}

export function getUpcomingPosts(posts: ScheduledPost[], limit = 8): ScheduledPost[] {
  const now = Date.now();
  return posts
    .filter(
      (post) =>
        (post.status === "upcoming" || post.status === "draft") &&
        new Date(post.scheduledFor).getTime() >= now - 60_000
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    )
    .slice(0, limit);
}

export function getTodaysPosts(posts: ScheduledPost[]): ScheduledPost[] {
  const today = new Date();
  return posts
    .filter((post) => isSameLocalDay(new Date(post.scheduledFor), today))
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
}

export function buildMonthCells(month: Date): Array<{ date: Date | null; key: string }> {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();

  const cells: Array<{ date: Date | null; key: string }> = [];
  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ date: null, key: `empty-start-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    cells.push({ date, key: dayKey(date) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `empty-end-${cells.length}` });
  }
  return cells;
}

export function buildWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function buildDayHours(): number[] {
  return Array.from({ length: 24 }, (_, hour) => hour);
}

export function dropTargetToIso(date: Date, preferredHour = 10): string {
  const next = new Date(date);
  next.setHours(preferredHour, 0, 0, 0);
  return next.toISOString();
}

export function preserveTimeOnDate(sourceIso: string, targetDate: Date): string {
  const source = new Date(sourceIso);
  const next = new Date(targetDate);
  next.setHours(source.getHours(), source.getMinutes(), 0, 0);
  return next.toISOString();
}

export function toLocalParts(iso: string): { date: string; time: string } {
  const date = new Date(iso);
  return {
    date: formatSchedulerDateInput(date),
    time: formatSchedulerTimeInput(date),
  };
}

export function resolvePostColor(post: ScheduledPost, campaignColor?: string | null): string {
  return post.campaignColor || campaignColor || "#22d3ee";
}
