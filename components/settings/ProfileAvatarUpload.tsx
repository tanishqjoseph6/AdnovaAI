"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import UserAvatar from "@/components/settings/UserAvatar";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  validateAvatarFile,
} from "@/lib/settings/avatar";
import {
  dispatchProfileUpdated,
  refreshAuthSession,
} from "@/lib/settings/profile-events";

type ProfileAvatarUploadProps = {
  avatarUrl: string;
  initials: string;
  disabled?: boolean;
  onAvatarChange: (avatarUrl: string) => void;
  onStatus: (status: { type: "success" | "error"; message: string }) => void;
};

export default function ProfileAvatarUpload({
  avatarUrl,
  initials,
  disabled = false,
  onAvatarChange,
  onStatus,
}: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);

  const isBusy = isUploading || isRemoving || disabled;

  function uploadWithProgress(formData: FormData): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/profile/avatar");
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        resolve(
          new Response(xhr.responseText, {
            status: xhr.status,
            headers: { "Content-Type": "application/json" },
          })
        );
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));
      xhr.send(formData);
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || isBusy) {
      return;
    }

    const validation = validateAvatarFile(file);
    if (!validation.ok) {
      onStatus({ type: "error", message: validation.error });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.set("avatar", file);

      const response = await uploadWithProgress(formData);
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        avatarUrl?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload profile photo.");
      }

      const nextUrl =
        typeof payload.avatarUrl === "string" ? payload.avatarUrl : "";
      onAvatarChange(nextUrl);
      await refreshAuthSession();
      dispatchProfileUpdated({ avatarUrl: nextUrl || null });
      onStatus({ type: "success", message: "Profile photo updated." });
    } catch (error) {
      onStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to upload profile photo.",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  async function handleRemove() {
    if (isBusy || !avatarUrl) {
      return;
    }

    setIsRemoving(true);

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to remove profile photo.");
      }

      onAvatarChange("");
      await refreshAuthSession();
      dispatchProfileUpdated({ avatarUrl: null });
      onStatus({ type: "success", message: "Profile photo removed." });
    } catch (error) {
      onStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to remove profile photo.",
      });
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0 self-start">
        <UserAvatar
          imageUrl={avatarUrl}
          initials={initials}
          className="h-20 w-20 rounded-2xl shadow-lg shadow-violet-500/25 sm:h-24 sm:w-24"
          textClassName="text-xl font-semibold"
        />
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 backdrop-blur-[1px]">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-300" aria-hidden />
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-medium text-white">Profile photo</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Upload JPG, PNG, or WebP up to 5MB. Initials show when no photo is set.
          </p>
        </div>

        {isUploading ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-200"
                style={{ width: `${Math.max(progress, 8)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-violet-500/30 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-cyan-300" aria-hidden />
                Change photo
              </>
            )}
          </button>

          {avatarUrl ? (
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={isBusy}
              className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:border-red-500/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </>
              )}
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
          onChange={(event) => void handleFileChange(event)}
          disabled={isBusy}
          className="sr-only"
          aria-label="Upload profile photo"
        />
      </div>
    </div>
  );
}
