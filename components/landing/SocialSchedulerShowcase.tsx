"use client";

import { motion } from "framer-motion";
import { CalendarClock, Clock, ImageIcon } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import { PLATFORM_LABELS, SOCIAL_PLATFORMS } from "@/lib/social-scheduler/types";

const SAMPLE_POSTS = [
  {
    platform: "instagram" as const,
    caption: "New drop alert — studio sound, gym-proof fit. Link in bio.",
    time: "Today · 6:00 PM",
    status: "Upcoming",
  },
  {
    platform: "linkedin" as const,
    caption: "How we scaled paid social 3× with AI-generated creative...",
    time: "Fri · 9:30 AM",
    status: "Upcoming",
  },
  {
    platform: "x" as const,
    caption: "48-hour battery. Zero compromises. 🎧",
    time: "Sat · 12:00 PM",
    status: "Upcoming",
  },
];

export default function SocialSchedulerShowcase() {
  return (
    <LandingSection
      id="scheduler"
      eyebrow="Social Scheduler"
      title={
        <>
          Plan posts across{" "}
          <span className="gradient-text">every platform</span>
        </>
      }
      description="Schedule captions, images, and publish times for Instagram, Facebook, LinkedIn, and X — all from your Advora workspace."
      className="bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-3"
        >
          {SAMPLE_POSTS.map((post) => (
            <div
              key={post.caption.slice(0, 20)}
              className="glass flex items-start gap-4 rounded-2xl border border-white/[0.08] p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-xs font-bold text-cyan-300">
                {PLATFORM_LABELS[post.platform].slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {PLATFORM_LABELS[post.platform]}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                    {post.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{post.caption}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {post.time}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/[0.08] p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
              <CalendarClock className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="font-semibold text-white">Schedule a post</p>
              <p className="text-sm text-zinc-500">Multi-platform planning</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Platforms
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
                  >
                    {PLATFORM_LABELS[platform]}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-2 text-sm text-zinc-500">
                Attach caption, image, date & notes
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Upcoming", value: "3" },
                { label: "Published", value: "12" },
                { label: "Failed", value: "0" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
                >
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                  <p className="text-[10px] text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </LandingSection>
  );
}
