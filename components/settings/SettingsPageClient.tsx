"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSectionCard from "@/components/settings/SettingsSectionCard";
import SettingsToggle from "@/components/settings/SettingsToggle";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { validateNewPassword } from "@/lib/auth/password-reset";
import {
  getAvatarInitials,
  settingsInputClassName,
  settingsLabelClassName,
  settingsSelectClassName,
} from "@/lib/settings/display";
import { validateProfileSettings } from "@/lib/settings/profile";
import { supabase } from "@/lib/supabase";

type SettingsPageClientProps = {
  defaultFullName: string;
  defaultEmail: string;
  defaultUsername: string;
  defaultAvatarUrl: string;
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

const passwordInputClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60";

export default function SettingsPageClient({
  defaultFullName,
  defaultEmail,
  defaultUsername,
  defaultAvatarUrl,
  avatarInitials,
}: SettingsPageClientProps) {
  const router = useRouter();
  const [headerInitials, setHeaderInitials] = useState(avatarInitials);
  const [fullName, setFullName] = useState(defaultFullName);
  const [username, setUsername] = useState(defaultUsername);
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl);
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [saveStatus, setSaveStatus] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [creativeLevel, setCreativeLevel] = useState(65);
  const [quality, setQuality] = useState(QUALITY_OPTIONS[0]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    if (!passwordModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPasswordSaving) {
        closePasswordModal();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [passwordModalOpen, isPasswordSaving]);

  function closePasswordModal(force = false) {
    if (isPasswordSaving && !force) {
      return;
    }

    setPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError(null);
  }

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    const validation = validateNewPassword(newPassword, confirmNewPassword);
    if (!validation.ok) {
      setPasswordError(validation.error);
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Choose a new password that is different from your current password.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: defaultEmail,
        password: currentPassword,
      });

      if (verifyError) {
        setPasswordError("Current password is incorrect. Please try again.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(mapAuthErrorMessage(updateError.message));
        return;
      }

      closePasswordModal(true);
      setSaveStatus({
        type: "success",
        message: "Password updated.",
      });
    } catch {
      setPasswordError("Unable to update password. Please try again.");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setSaveStatus(null);

    const validation = validateProfileSettings({
      username,
      fullName,
      avatarUrl,
    });

    if (!validation.ok) {
      setSaveStatus({ type: "error", message: validation.error });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: validation.value.username,
          fullName: validation.value.fullName,
          avatarUrl: validation.value.avatarUrl,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        profile?: {
          username?: string | null;
          fullName?: string | null;
          avatarUrl?: string | null;
        };
      };

      if (!response.ok) {
        setSaveStatus({
          type: "error",
          message: payload.error ?? "Unable to save profile changes.",
        });
        return;
      }

      const savedFullName = payload.profile?.fullName ?? validation.value.fullName;
      const savedUsername = payload.profile?.username ?? validation.value.username;
      const savedAvatarUrl = payload.profile?.avatarUrl ?? validation.value.avatarUrl;

      setFullName(savedFullName);
      setUsername(savedUsername);
      setAvatarUrl(savedAvatarUrl ?? "");
      setHeaderInitials(getAvatarInitials(savedFullName || savedUsername, defaultEmail));
      setSaveStatus({
        type: "success",
        message: "Changes saved.",
      });
      router.refresh();
    } catch {
      setSaveStatus({
        type: "error",
        message: "Unable to save profile changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SettingsHeader initials={headerInitials} email={defaultEmail} />
      {saveStatus && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl sm:w-auto ${
            saveStatus.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 shadow-emerald-950/20"
              : "border-red-500/30 bg-red-500/15 text-red-200 shadow-red-950/20"
          }`}
          role={saveStatus.type === "success" ? "status" : "alert"}
        >
          {saveStatus.message}
        </div>
      )}
      {passwordModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
        >
          <button
            type="button"
            aria-label="Close change password dialog"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => closePasswordModal()}
            disabled={isPasswordSaving}
          />
          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            onSubmit={(event) => void handlePasswordChange(event)}
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#08031d]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3
                  id="change-password-title"
                  className="text-lg font-semibold tracking-tight text-white"
                >
                  Change password
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  Confirm your current password, then choose a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={() => closePasswordModal()}
                disabled={isPasswordSaving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className={settingsLabelClassName}
                >
                  Current password
                </label>
                <PasswordInput
                  id="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                  disabled={isPasswordSaving}
                  className={passwordInputClassName}
                />
              </div>

              <div>
                <label htmlFor="new-password" className={settingsLabelClassName}>
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password (min. 8 characters)"
                  autoComplete="new-password"
                  disabled={isPasswordSaving}
                  className={passwordInputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-new-password"
                  className={settingsLabelClassName}
                >
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm-new-password"
                  value={confirmNewPassword}
                  onChange={(event) =>
                    setConfirmNewPassword(event.target.value)
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={isPasswordSaving}
                  className={passwordInputClassName}
                />
              </div>

              {passwordError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {passwordError}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => closePasswordModal()}
                disabled={isPasswordSaving}
                className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPasswordSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPasswordSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save password"
                )}
              </button>
            </div>
          </motion.form>
        </div>
      )}

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
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-lg font-semibold text-white shadow-lg shadow-violet-500/20">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                headerInitials
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Profile photo</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Add an image URL or leave blank to use initials.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(event) => void handleSave(event)}>
            <div>
              <label htmlFor="username" className={settingsLabelClassName}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSaving}
                minLength={3}
                maxLength={30}
                autoComplete="username"
                className={settingsInputClassName}
              />
              <p className="mt-1 text-xs text-zinc-500">
                3–30 characters. Letters, numbers, dots, underscores, and hyphens.
              </p>
            </div>

            <div>
              <label htmlFor="full-name" className={settingsLabelClassName}>
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={isSaving}
                autoComplete="name"
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
                value={defaultEmail}
                readOnly
                className={`${settingsInputClassName} cursor-not-allowed opacity-70`}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Email changes are handled through authentication settings.
              </p>
            </div>

            <div>
              <label htmlFor="avatar-url" className={settingsLabelClassName}>
                Avatar image URL
              </label>
              <input
                id="avatar-url"
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                disabled={isSaving}
                placeholder="https://example.com/avatar.jpg"
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
                disabled={isSaving}
                className={settingsInputClassName}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
              {saveStatus && (
                <span
                  className={`text-sm ${
                    saveStatus.type === "success"
                      ? "text-emerald-400"
                      : "text-red-300"
                  }`}
                  role={saveStatus.type === "success" ? "status" : "alert"}
                >
                  {saveStatus.message}
                </span>
              )}
            </div>
          </form>
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
              onClick={() => {
                setSaveStatus(null);
                setPasswordModalOpen(true);
              }}
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
