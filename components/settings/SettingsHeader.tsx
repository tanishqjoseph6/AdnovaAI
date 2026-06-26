"use client";

import { motion } from "framer-motion";

type SettingsHeaderProps = {
  initials: string;
  email: string;
};

export default function SettingsHeader({
  initials,
  email,
}: SettingsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Manage your account, profile and preferences.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/20"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Signed in as
          </p>
          <p className="truncate text-sm font-medium text-white">{email}</p>
        </div>
      </div>
    </motion.div>
  );
}
