"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSectionCard from "@/components/settings/SettingsSectionCard";
import SettingsSelect from "@/components/settings/SettingsSelect";
import { usePasswordResetCooldown } from "@/hooks/usePasswordResetCooldown";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import {
  FORGOT_PASSWORD_ERROR_MESSAGE,
  validateNewPassword,
} from "@/lib/auth/password-reset";
import { normalizeEmail } from "@/lib/auth/validation";
import {
  AI_AUDIENCES,
  AI_BRAND_VOICES,
  AI_CAPTION_LENGTHS,
  AI_CTA_STYLES,
  AI_EMOJI_USAGE,
  AI_GENERATION_QUALITIES,
  AI_LANGUAGES,
  AI_PLATFORMS,
  AI_TONES,
  DEFAULT_AI_PREFERENCES,
  type AiPreferences,
} from "@/lib/settings/ai-preferences";
import {
  getAvatarInitials,
  settingsInputClassName,
  settingsLabelClassName,
  settingsSliderClassName,
} from "@/lib/settings/display";
import { validateProfileSettings } from "@/lib/settings/profile";
import { supabase } from "@/lib/supabase";

type AiPreferencesApi = Omit<AiPreferences, never> & { updatedAt?: string };

type SettingsPageClientProps = {
  defaultFullName: string;
  defaultEmail: string;
  defaultUsername: string;
  defaultAvatarUrl: string;
  avatarInitials: string;
  initialAiPreferences: AiPreferencesApi | null;
};

type StatusMessage = {
  type: "success" | "error";
  message: string;
};

const FORGOT_PASSWORD_SUCCESS_TOAST =
  "Password reset link sent. Please check your email.";

const passwordInputClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60";

function mergeAiPreferences(
  initial: AiPreferencesApi | null
): AiPreferences {
  if (!initial) {
    return { ...DEFAULT_AI_PREFERENCES };
  }

  return {
    language: initial.language ?? DEFAULT_AI_PREFERENCES.language,
    tone: initial.tone ?? DEFAULT_AI_PREFERENCES.tone,
    captionLength: initial.captionLength ?? DEFAULT_AI_PREFERENCES.captionLength,
    emojiUsage: initial.emojiUsage ?? DEFAULT_AI_PREFERENCES.emojiUsage,
    ctaStyle: initial.ctaStyle ?? DEFAULT_AI_PREFERENCES.ctaStyle,
    creativeLevel: initial.creativeLevel ?? DEFAULT_AI_PREFERENCES.creativeLevel,
    generationQuality:
      initial.generationQuality ?? DEFAULT_AI_PREFERENCES.generationQuality,
    platform: initial.platform ?? DEFAULT_AI_PREFERENCES.platform,
    audience: initial.audience ?? DEFAULT_AI_PREFERENCES.audience,
    brandVoice: initial.brandVoice ?? DEFAULT_AI_PREFERENCES.brandVoice,
  };
}

export default function SettingsPageClient({
  defaultFullName,
  defaultEmail,
  defaultUsername,
  defaultAvatarUrl,
  avatarInitials,
  initialAiPreferences,
}: SettingsPageClientProps) {
  const router = useRouter();
  const [headerInitials, setHeaderInitials] = useState(avatarInitials);
  const [fullName, setFullName] = useState(defaultFullName);
  const [username, setUsername] = useState(defaultUsername);
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl);
  const [profileStatus, setProfileStatus] = useState<StatusMessage | null>(null);
  const [aiStatus, setAiStatus] = useState<StatusMessage | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);

  const [aiPreferences, setAiPreferences] = useState<AiPreferences>(() =>
    mergeAiPreferences(initialAiPreferences)
  );

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(
    null
  );
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const resetEmailInFlightRef = useRef(false);
  const normalizedAccountEmail = normalizeEmail(defaultEmail);
  const { secondsLeft, isOnCooldown, startCooldown } = usePasswordResetCooldown(
    normalizedAccountEmail
  );

  useEffect(() => {
    if (!passwordModalOpen && !deleteModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (passwordModalOpen && !isPasswordSaving && !isSendingResetEmail) {
          closePasswordModal();
        }
        if (deleteModalOpen && !isDeletingAccount) {
          closeDeleteModal();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    passwordModalOpen,
    deleteModalOpen,
    isPasswordSaving,
    isSendingResetEmail,
    isDeletingAccount,
  ]);

  function closePasswordModal(force = false) {
    if ((isPasswordSaving || isSendingResetEmail) && !force) return;
    setPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError(null);
    setForgotPasswordError(null);
  }

  async function handleForgotPassword() {
    if (
      resetEmailInFlightRef.current ||
      isSendingResetEmail ||
      isPasswordSaving ||
      isOnCooldown ||
      !normalizedAccountEmail
    ) {
      return;
    }

    setForgotPasswordError(null);
    resetEmailInFlightRef.current = true;
    setIsSendingResetEmail(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedAccountEmail }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        const message = mapAuthErrorMessage(
          payload.error ?? FORGOT_PASSWORD_ERROR_MESSAGE
        );
        setForgotPasswordError(message);
        setProfileStatus({ type: "error", message });
        return;
      }

      startCooldown();
      setProfileStatus({
        type: "success",
        message: FORGOT_PASSWORD_SUCCESS_TOAST,
      });
    } catch {
      setForgotPasswordError(FORGOT_PASSWORD_ERROR_MESSAGE);
      setProfileStatus({
        type: "error",
        message: FORGOT_PASSWORD_ERROR_MESSAGE,
      });
    } finally {
      resetEmailInFlightRef.current = false;
      setIsSendingResetEmail(false);
    }
  }

  function closeDeleteModal(force = false) {
    if (isDeletingAccount && !force) return;
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
  }

  function showPasswordError(message: string) {
    setPasswordError(message);
    setProfileStatus({ type: "error", message });
  }

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setProfileStatus(null);

    if (!currentPassword) {
      showPasswordError("Enter your current password.");
      return;
    }

    const validation = validateNewPassword(newPassword, confirmNewPassword);
    if (!validation.ok) {
      showPasswordError(validation.error);
      return;
    }

    if (currentPassword === newPassword) {
      showPasswordError(
        "Choose a new password that is different from your current password."
      );
      return;
    }

    setIsPasswordSaving(true);

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: defaultEmail,
        password: currentPassword,
      });

      if (verifyError) {
        showPasswordError("Current password is incorrect. Please try again.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        showPasswordError(mapAuthErrorMessage(updateError.message));
        return;
      }

      closePasswordModal(true);
      setProfileStatus({ type: "success", message: "Password updated." });
    } catch {
      showPasswordError("Unable to update password. Please try again.");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (isSavingProfile) return;

    setProfileStatus(null);

    const validation = validateProfileSettings({ username, fullName, avatarUrl });
    if (!validation.ok) {
      setProfileStatus({ type: "error", message: validation.error });
      return;
    }

    setIsSavingProfile(true);

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
        setProfileStatus({
          type: "error",
          message: payload.error ?? "Unable to save profile changes.",
        });
        return;
      }

      const savedFullName =
        payload.profile?.fullName ?? validation.value.fullName;
      const savedUsername =
        payload.profile?.username ?? validation.value.username;
      const savedAvatarUrl =
        payload.profile?.avatarUrl ?? validation.value.avatarUrl;

      setFullName(savedFullName);
      setUsername(savedUsername);
      setAvatarUrl(savedAvatarUrl ?? "");
      setHeaderInitials(
        getAvatarInitials(savedFullName || savedUsername, defaultEmail)
      );
      setProfileStatus({ type: "success", message: "Profile saved." });
      router.refresh();
    } catch {
      setProfileStatus({
        type: "error",
        message: "Unable to save profile changes. Please try again.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSaveAiPreferences(event: React.FormEvent) {
    event.preventDefault();
    if (isSavingAi) return;

    setAiStatus(null);
    setIsSavingAi(true);

    try {
      const response = await fetch("/api/settings/ai-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPreferences),
      });

      const payload = (await response.json()) as {
        error?: string;
        preferences?: AiPreferencesApi;
      };

      if (!response.ok) {
        setAiStatus({
          type: "error",
          message: payload.error ?? "Unable to save AI preferences.",
        });
        return;
      }

      if (payload.preferences) {
        setAiPreferences(mergeAiPreferences(payload.preferences));
      }

      setAiStatus({
        type: "success",
        message: "AI preferences saved. Future generations will use these settings.",
      });
      router.refresh();
    } catch {
      setAiStatus({
        type: "error",
        message: "Unable to save AI preferences. Please try again.",
      });
    } finally {
      setIsSavingAi(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE" || isDeletingAccount) return;

    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setProfileStatus({
          type: "error",
          message: payload.error ?? "Unable to delete account.",
        });
        return;
      }

      closeDeleteModal(true);
      router.push("/login?deleted=1");
      router.refresh();
    } catch {
      setProfileStatus({
        type: "error",
        message: "Unable to delete account. Please try again.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function updateAiPreference<K extends keyof AiPreferences>(
    key: K,
    value: AiPreferences[K]
  ) {
    setAiPreferences((current) => ({ ...current, [key]: value }));
  }

  const toastMessage = profileStatus ?? aiStatus;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <SettingsHeader initials={headerInitials} email={defaultEmail} />

      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl transition sm:w-auto ${
            toastMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 shadow-emerald-950/20"
              : "border-red-500/30 bg-red-500/15 text-red-200 shadow-red-950/20"
          }`}
          role={toastMessage.type === "success" ? "status" : "alert"}
        >
          {toastMessage.message}
        </div>
      )}

      {passwordModalOpen && (
        <ModalBackdrop
          onClose={() => closePasswordModal()}
          disabled={isPasswordSaving || isSendingResetEmail}
          label="Close change password dialog"
        >
          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            onSubmit={(event) => void handlePasswordChange(event)}
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#08031d]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6"
          >
            <ModalHeader
              id="change-password-title"
              title="Change password"
              description="Confirm your current password, then choose a new one."
              onClose={() => closePasswordModal()}
              disabled={isPasswordSaving || isSendingResetEmail}
            />
            <div className="space-y-4">
              <PasswordField
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Current password"
                autoComplete="current-password"
                disabled={isPasswordSaving || isSendingResetEmail}
                footer={
                  <div className="mt-2 flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleForgotPassword()}
                      disabled={
                        isPasswordSaving ||
                        isSendingResetEmail ||
                        isOnCooldown
                      }
                      className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSendingResetEmail ? (
                        <>
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin text-cyan-300"
                            aria-hidden
                          />
                          Sending reset link…
                        </>
                      ) : isOnCooldown ? (
                        `Resend in ${secondsLeft}s`
                      ) : (
                        <>
                          Forgot Password?
                          <span
                            aria-hidden
                            className="inline-block transition-transform group-hover:translate-x-0.5"
                          >
                            →
                          </span>
                        </>
                      )}
                    </button>
                    {forgotPasswordError ? (
                      <p role="alert" className="text-xs text-red-300">
                        {forgotPasswordError}
                      </p>
                    ) : null}
                  </div>
                }
              />
              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="New password (min. 8 characters)"
                autoComplete="new-password"
                disabled={isPasswordSaving || isSendingResetEmail}
              />
              <PasswordField
                id="confirm-new-password"
                label="Confirm password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isPasswordSaving || isSendingResetEmail}
              />
              {passwordError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {passwordError}
                </p>
              )}
            </div>
            <ModalActions
              onCancel={() => closePasswordModal()}
              cancelLabel="Cancel"
              submitLabel="Save password"
              loadingLabel="Saving…"
              isLoading={isPasswordSaving}
              disabled={isSendingResetEmail}
            />
          </motion.form>
        </ModalBackdrop>
      )}

      {deleteModalOpen && (
        <ModalBackdrop
          onClose={() => closeDeleteModal()}
          disabled={isDeletingAccount}
          label="Close delete account dialog"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-[#08031d]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6"
          >
            <ModalHeader
              id="delete-account-title"
              title="Delete account"
              description="This permanently marks your account as deleted. Type DELETE to confirm."
              onClose={() => closeDeleteModal()}
              disabled={isDeletingAccount}
            />
            <div className="space-y-4">
              <label htmlFor="delete-confirm" className={settingsLabelClassName}>
                Type DELETE to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                disabled={isDeletingAccount}
                placeholder="DELETE"
                className={settingsInputClassName}
                autoComplete="off"
              />
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => closeDeleteModal()}
                disabled={isDeletingAccount}
                className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Deleting…
                  </>
                ) : (
                  "Delete my account"
                )}
              </button>
            </div>
          </motion.div>
        </ModalBackdrop>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="space-y-6"
      >
        <SettingsSectionCard
          title="Profile"
          description="Your public identity across Advora AI."
          icon={<ProfileIcon />}
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-lg font-semibold text-white shadow-lg shadow-violet-500/25">
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

          <form
            className="space-y-4"
            onSubmit={(event) => void handleSaveProfile(event)}
          >
            <div>
              <label htmlFor="username" className={settingsLabelClassName}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSavingProfile}
                minLength={3}
                maxLength={30}
                autoComplete="username"
                className={settingsInputClassName}
              />
              <p className="mt-1.5 text-xs text-zinc-500">
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
                disabled={isSavingProfile}
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
                disabled={isSavingProfile}
                placeholder="https://example.com/avatar.jpg"
                className={settingsInputClassName}
              />
            </div>

            <SaveButton loading={isSavingProfile} label="Save profile" />
          </form>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="AI preferences"
          description="Defaults applied to every ad generation and rewrite."
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
        >
          <form
            className="space-y-6"
            onSubmit={(event) => void handleSaveAiPreferences(event)}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <SettingsSelect
                label="Output language"
                value={aiPreferences.language}
                onChange={(event) =>
                  updateAiPreference("language", event.target.value as AiPreferences["language"])
                }
                disabled={isSavingAi}
              >
                {AI_LANGUAGES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="Tone"
                value={aiPreferences.tone}
                onChange={(event) =>
                  updateAiPreference("tone", event.target.value as AiPreferences["tone"])
                }
                disabled={isSavingAi}
              >
                {AI_TONES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="Platform"
                value={aiPreferences.platform}
                onChange={(event) =>
                  updateAiPreference(
                    "platform",
                    event.target.value as AiPreferences["platform"]
                  )
                }
                disabled={isSavingAi}
              >
                {AI_PLATFORMS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="Audience"
                value={aiPreferences.audience}
                onChange={(event) =>
                  updateAiPreference(
                    "audience",
                    event.target.value as AiPreferences["audience"]
                  )
                }
                disabled={isSavingAi}
              >
                {AI_AUDIENCES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="Brand voice"
                value={aiPreferences.brandVoice}
                onChange={(event) =>
                  updateAiPreference(
                    "brandVoice",
                    event.target.value as AiPreferences["brandVoice"]
                  )
                }
                disabled={isSavingAi}
              >
                {AI_BRAND_VOICES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="Caption length"
                value={aiPreferences.captionLength}
                onChange={(event) =>
                  updateAiPreference(
                    "captionLength",
                    event.target.value as AiPreferences["captionLength"]
                  )
                }
                disabled={isSavingAi}
              >
                {AI_CAPTION_LENGTHS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="Emoji usage"
                value={aiPreferences.emojiUsage}
                onChange={(event) =>
                  updateAiPreference(
                    "emojiUsage",
                    event.target.value as AiPreferences["emojiUsage"]
                  )
                }
                disabled={isSavingAi}
              >
                {AI_EMOJI_USAGE.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="CTA style"
                value={aiPreferences.ctaStyle}
                onChange={(event) =>
                  updateAiPreference(
                    "ctaStyle",
                    event.target.value as AiPreferences["ctaStyle"]
                  )
                }
                disabled={isSavingAi}
              >
                {AI_CTA_STYLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>

              <SettingsSelect
                label="Generation quality"
                hint="Fast uses lighter models; Premium uses GPT-4o for higher quality."
                value={aiPreferences.generationQuality}
                onChange={(event) =>
                  updateAiPreference(
                    "generationQuality",
                    event.target.value as AiPreferences["generationQuality"]
                  )
                }
                disabled={isSavingAi}
                className="sm:col-span-2"
              >
                {AI_GENERATION_QUALITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SettingsSelect>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <label htmlFor="creative-level" className={settingsLabelClassName}>
                  Creative level
                </label>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-200">
                  {aiPreferences.creativeLevel}%
                </span>
              </div>
              <input
                id="creative-level"
                type="range"
                min={0}
                max={100}
                value={aiPreferences.creativeLevel}
                onChange={(event) =>
                  updateAiPreference("creativeLevel", Number(event.target.value))
                }
                disabled={isSavingAi}
                className={settingsSliderClassName}
              />
              <div className="mt-3 flex justify-between text-xs font-medium text-zinc-500">
                <span>Safe</span>
                <span>Experimental</span>
              </div>
            </div>

            <SaveButton loading={isSavingAi} label="Save AI preferences" />
          </form>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Security"
          description="Protect your Advora AI account."
          icon={<SecurityIcon />}
        >
          <button
            type="button"
            onClick={() => {
              setProfileStatus(null);
              setForgotPasswordError(null);
              setPasswordModalOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left text-sm font-medium text-zinc-200 transition hover:border-violet-500/30 hover:bg-white/[0.06]"
          >
            Change password
            <ChevronIcon />
          </button>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Account"
          description="Permanent account actions."
          icon={<WarningIcon />}
        >
          <p className="mb-4 text-sm leading-relaxed text-zinc-500">
            Deleting your account marks it as deleted and signs you out. Your
            generation history is retained for audit purposes.
          </p>
          <button
            type="button"
            onClick={() => {
              setProfileStatus(null);
              setDeleteModalOpen(true);
            }}
            className="w-full rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10"
          >
            Delete account
          </button>
        </SettingsSectionCard>
      </motion.div>
    </div>
  );
}

function SaveButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <div className="pt-1">
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}

function ModalBackdrop({
  children,
  onClose,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={label}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        disabled={disabled}
      />
      {children}
    </div>
  );
}

function ModalHeader({
  id,
  title,
  description,
  onClose,
  disabled,
}: {
  id: string;
  title: string;
  description: string;
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 id={id} className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Close"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ModalActions({
  onCancel,
  cancelLabel,
  submitLabel,
  loadingLabel,
  isLoading,
  disabled = false,
}: {
  onCancel: () => void;
  cancelLabel: string;
  submitLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  disabled?: boolean;
}) {
  const isDisabled = isLoading || disabled;

  return (
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={isDisabled}
        className="inline-flex justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={isDisabled}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {loadingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  footer,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  disabled: boolean;
  footer?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={settingsLabelClassName}>
        {label}
      </label>
      <PasswordInput
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={passwordInputClassName}
      />
      {footer}
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
