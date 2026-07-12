"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Settings2 } from "lucide-react";
import { SOCIAL_OAUTH_ENV } from "@/lib/social-scheduler/env-vars";

export default function OAuthSetupCard() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] via-white/[0.03] to-violet-500/[0.06] p-5 shadow-xl shadow-amber-500/10 sm:p-6"
      aria-label="Social connections setup"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-200">
            <Settings2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              Social connections are not configured yet.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              This is a development environment. Configure X and LinkedIn OAuth
              credentials to enable account connections.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGuideOpen((open) => !open)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
          aria-expanded={guideOpen}
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Setup Guide
        </button>
      </div>

      <AnimatePresence initial={false}>
        {guideOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="relative mt-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <ol className="space-y-3 text-sm text-zinc-300">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-400">
                    1
                  </span>
                  <span>
                    Add{" "}
                    <code className="text-zinc-200">
                      {SOCIAL_OAUTH_ENV.X_CLIENT_ID}
                    </code>{" "}
                    and{" "}
                    <code className="text-zinc-200">
                      {SOCIAL_OAUTH_ENV.X_CLIENT_SECRET}
                    </code>{" "}
                    to your environment.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-400">
                    2
                  </span>
                  <span>
                    Add{" "}
                    <code className="text-zinc-200">
                      {SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_ID}
                    </code>{" "}
                    and{" "}
                    <code className="text-zinc-200">
                      {SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_SECRET}
                    </code>{" "}
                    to your environment.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-400">
                    3
                  </span>
                  <span>
                    Register OAuth callback URLs for X and LinkedIn pointing to
                    your Advora app&apos;s social connection callback routes.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-400">
                    4
                  </span>
                  <span>Restart the app, then return here to connect accounts.</span>
                </li>
              </ol>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
