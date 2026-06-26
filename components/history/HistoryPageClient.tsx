"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import GenerationCard from "@/components/history/GenerationCard";
import HistoryEmptyState from "@/components/history/HistoryEmptyState";
import { useCredits } from "@/hooks/useCredits";
import type {
  GenerationRecord,
  HistoryFilter,
  HistorySort,
  PlanBadge,
} from "@/lib/history/types";
import {
  matchesDateFilter,
  matchesSearchQuery,
  sortGenerations,
} from "@/lib/history/utils";

type HistoryPageClientProps = {
  initialGenerations: GenerationRecord[];
};

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All" },
];

export default function HistoryPageClient({
  initialGenerations,
}: HistoryPageClientProps) {
  const { credits } = useCredits();
  const planBadge: PlanBadge = credits?.unlimited ? "Pro" : "Free";

  const [generations, setGenerations] =
    useState<GenerationRecord[]>(initialGenerations);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sort, setSort] = useState<HistorySort>("newest");

  const filteredGenerations = useMemo(() => {
    const filtered = generations.filter(
      (item) =>
        matchesSearchQuery(item, search) && matchesDateFilter(item.created_at, filter)
    );
    return sortGenerations(filtered, sort);
  }, [generations, search, filter, sort]);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("generations").delete().eq("id", id);

    if (error) {
      throw error;
    }

    setGenerations((prev) => prev.filter((item) => item.id !== id));
  };

  const hasAnyGenerations = generations.length > 0;
  const hasFilteredResults = filteredGenerations.length > 0;

  return (
    <div className="space-y-6">
      {hasAnyGenerations && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search generations…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 transition focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                aria-label="Search generations"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="history-sort">
                Sort order
              </label>
              <select
                id="history-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as HistorySort)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-300 transition focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>

              <p className="text-sm text-zinc-500">
                {filteredGenerations.length} of {generations.length}
              </p>
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by date"
          >
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-violet-500/40 bg-violet-500/15 text-violet-200 shadow-sm shadow-violet-500/10"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-200"
                  }`}
                  aria-pressed={active}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {!hasAnyGenerations ? (
        <HistoryEmptyState />
      ) : !hasFilteredResults ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl border border-white/[0.08] px-6 py-12 text-center"
        >
          <p className="text-lg font-medium text-white">No matches found</p>
          <p className="mt-2 text-sm text-zinc-400">
            Try adjusting your search or date filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
          >
            Clear filters
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-5">
          <AnimatePresence mode="popLayout">
            {filteredGenerations.map((generation, index) => (
              <GenerationCard
                key={generation.id}
                generation={generation}
                planBadge={planBadge}
                index={index}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
