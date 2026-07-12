"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import {
  formatSchedulerMonthYear,
  isSameLocalDay,
} from "@/lib/social-scheduler/format";
import { useSchedulerHydrated } from "@/lib/social-scheduler/use-scheduler-hydrated";
import type { ScheduledPost } from "@/lib/social-scheduler/types";

type CalendarViewProps = {
  posts: ScheduledPost[];
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export default function CalendarView({ posts }: CalendarViewProps) {
  const hydrated = useSchedulerHydrated();
  const [month, setMonth] = useState<Date | null>(null);

  useEffect(() => {
    setMonth(startOfMonth(new Date()));
  }, []);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();

    for (const post of posts) {
      const date = new Date(post.scheduledFor);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const existing = map.get(key) ?? [];
      existing.push(post);
      map.set(key, existing);
    }

    return map;
  }, [posts]);

  const cells = useMemo(() => {
    if (!month) {
      return [];
    }

    const firstDay = startOfMonth(month);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();

    const result: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      result.push({ date: null, key: `empty-start-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      result.push({
        date,
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      });
    }

    while (result.length % 7 !== 0) {
      result.push({ date: null, key: `empty-end-${result.length}` });
    }

    return result;
  }, [month]);

  if (!hydrated || !month) {
    return (
      <section className="glass rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="h-56 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      </section>
    );
  }

  const monthLabel = formatSchedulerMonthYear(month);
  const today = new Date();

  return (
    <section className="glass rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Calendar View</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Visualize your upcoming and past scheduled posts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-32 text-center text-sm font-medium text-white">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((cell) => {
          if (!cell.date) {
            return (
              <div
                key={cell.key}
                className="min-h-24 rounded-xl border border-transparent bg-transparent"
              />
            );
          }

          const dayPosts = postsByDay.get(cell.key) ?? [];
          const isToday = isSameLocalDay(cell.date, today);

          return (
            <div
              key={cell.key}
              className={`min-h-24 rounded-xl border p-2 ${
                isToday
                  ? "border-cyan-400/30 bg-cyan-500/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  isToday ? "text-cyan-200" : "text-zinc-400"
                }`}
              >
                {cell.date.getDate()}
              </p>
              <div className="mt-2 space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-1 rounded-md border border-white/8 bg-black/20 px-1.5 py-1"
                    title={post.caption}
                  >
                    <PlatformIcon platform={post.platform} className="h-3 w-3" />
                    <span className="truncate text-[10px] text-zinc-300">
                      {post.caption}
                    </span>
                  </div>
                ))}
                {dayPosts.length > 3 ? (
                  <p className="text-[10px] text-zinc-500">
                    +{dayPosts.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
