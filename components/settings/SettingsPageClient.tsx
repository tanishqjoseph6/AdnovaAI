"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSectionCard from "@/components/settings/SettingsSectionCard";
import SettingsToggle from "@/components/settings/SettingsToggle";
import {
  settingsInputClassName,
  settingsLabelClassName,
  settingsSelectClassName,
} from "@/lib/settings/display";

type SettingsPageClientProps = {
  defaultFullName: string;
  defaultEmail: string;
  avatarInitials: string;
};

const TONE_OPTIONS = [
  "Professional & confident",
  "Friendly & casual",
  "Bold & disruptive",
  "Luxury & refined",
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Spanish", "French", "German"];

const QUALITY_OPTIONS = ["High quality", "Balanced", "Fast"];

export default function SettingsPageClient({
  defaultFullName,
  defaultEmail,
  avatarInitials,
}: SettingsPageClientProps) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [saved, setSaved] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [creativeLevel, setCreativeLevel] = useState(65);
  const [quality, setQuality] = useState(QUALITY_OPTIONS[0]);

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SettingsHeader initials={avatarInitials} email={defaultEmail} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="space-y-6"
      >
        {/* Profile */}
        <SettingsSectionCard
          title="Profile"
          description="Update your personal and workspace information."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-lg font-semibold text-white shadow-lg shadow-violet-500/20">
              {avatarInitials}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Avatar generated from your initials
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className={settingsLabelClassName}>
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label htmlFor="email" className={settingsLabelClassName}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label htmlFor="workspace" className={settingsLabelClassName}>
                Workspace name
              </label>
              <input
                id="workspace"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className={settingsInputClassName}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
            >
              Save changes
            </button>
            {saved && (
              <span className="text-sm text-emerald-400" role="status">
                Changes saved
              </span>
            )}
          </div>
        </SettingsSectionCard>

        {/* Appearance */}
        <SettingsSectionCard
          title="Appearance"
          description="Customize how Advora AI looks on your device."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.5 1.5 0 00-2.4-1.813L15.376 5.39a15.996 15.996 0 00-4.648 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          }
        >
          <ul className="space-y-4">
            <li className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-white">Dark mode</p>
                <p className="mt-0.5 text-xs text-zinc-500">Default Advora experience</p>
              </div>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                Active
              </span>
            </li>
            <li className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 opacity-60">
              <div>
                <p className="text-sm font-medium text-zinc-300">Light mode</p>
                <p className="mt-0.5 text-xs text-zinc-500">Coming Soon</p>
              </div>
              <span
                className="relative h-7 w-12 shrink-0 cursor-not-allowed rounded-full bg-white/10"
                aria-hidden
              >
                <span className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white/50 shadow-md" />
              </span>
            </li>
          </ul>
        </SettingsSectionCard>

        {/* Notifications */}
        <SettingsSectionCard
          title="Notifications"
          description="Choose what you want to hear about."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          }
        >
          <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <li className="px-4 py-4">
              <SettingsToggle
                label="Email notifications"
                description="Get notified when your AI ad generation completes."
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
            </li>
            <li className="px-4 py-4">
              <SettingsToggle
                label="Product updates"
                description="New features, improvements and release notes."
                checked={productUpdates}
                onChange={setProductUpdates}
              />
            </li>
            <li className="px-4 py-4">
              <SettingsToggle
                label="Marketing emails"
                description="Tips, inspiration and promotional offers."
                checked={marketingEmails}
                onChange={setMarketingEmails}
              />
            </li>
          </ul>
        </SettingsSectionCard>

        {/* AI Preferences */}
        <SettingsSectionCard
          title="AI preferences"
          description="Default settings for AI ad generation."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="language" className={settingsLabelClassName}>
                Default output language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={settingsSelectClassName}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tone" className={settingsLabelClassName}>
                Default tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className={settingsSelectClassName}
              >
                {TONE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="creative-level" className={settingsLabelClassName}>
                  Creative level
                </label>
                <span className="text-sm font-medium text-violet-300">
                  {creativeLevel}%
                </span>
              </div>
              <input
                id="creative-level"
                type="range"
                min={0}
                max={100}
                value={creativeLevel}
                onChange={(e) => setCreativeLevel(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-500"
              />
              <div className="mt-2 flex justify-between text-xs text-zinc-600">
                <span>Conservative</span>
                <span>Bold</span>
              </div>
            </div>

            <div>
              <label htmlFor="quality" className={settingsLabelClassName}>
                Generation quality
              </label>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className={settingsSelectClassName}
              >
                {QUALITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SettingsSectionCard>

        {/* Security */}
        <SettingsSectionCard
          title="Security"
          description="Manage your account security and sessions."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        >
          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              Change password
              <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <p className="text-sm font-medium text-white">Active sessions</p>
              <p className="mt-1 text-xs text-zinc-500">
                1 active session on this device
              </p>
            </div>

            <button
              type="button"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              Sign out from all devices
            </button>
          </div>
        </SettingsSectionCard>

        {/* Account */}
        <SettingsSectionCard
          title="Account"
          description="Permanent account actions."
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        >
          <p className="mb-4 text-sm leading-relaxed text-zinc-500">
            Deleting your account permanently removes all generations, credits
            history and billing data. This action cannot be undone.
          </p>
          <button
            type="button"
            className="w-full rounded-xl border border-red-500/40 bg-transparent px-4 py-3 text-sm font-semibold text-red-400 transition hover:border-red-500/60 hover:bg-red-500/5"
          >
            Delete account
          </button>
        </SettingsSectionCard>
      </motion.div>
    </div>
  );
}
