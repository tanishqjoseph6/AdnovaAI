"use client";

import { useMemo } from "react";
import { CalendarClock, Loader2, Send, Upload } from "lucide-react";
import PostPreview from "@/components/social-scheduler/PostPreview";
import {
  AVAILABLE_PLATFORMS,
  PLATFORM_META,
  type SocialConnection,
  type SocialPlatform,
} from "@/lib/social-scheduler/types";
import {
  settingsInputClassName,
  settingsLabelClassName,
  settingsSelectClassName,
} from "@/lib/settings/display";
import {
  createDefaultComposeDateTime,
  formatSchedulerPreviewFromParts,
  localDateTimeToIso,
} from "@/lib/social-scheduler/format";
import { useSchedulerHydrated } from "@/lib/social-scheduler/use-scheduler-hydrated";

export type ComposeFormState = {
  platform: SocialPlatform;
  caption: string;
  imageUrl: string | null;
  imageStoragePath: string | null;
  date: string;
  time: string;
  notes: string;
};

type ComposePanelProps = {
  form: ComposeFormState;
  connections: SocialConnection[];
  editingPostId: string | null;
  isSaving: boolean;
  isUploadingImage: boolean;
  onChange: <K extends keyof ComposeFormState>(
    key: K,
    value: ComposeFormState[K]
  ) => void;
  onImageUpload: (file: File) => Promise<void>;
  onRemoveImage: () => void;
  onSubmitSchedule: () => Promise<void>;
  onSubmitPublishNow: () => Promise<void>;
  onCancelEdit: () => void;
};

const textareaClassName = `${settingsInputClassName} min-h-28 resize-y`;

export const EMPTY_COMPOSE_FORM: ComposeFormState = {
  platform: "x",
  caption: "",
  imageUrl: null,
  imageStoragePath: null,
  date: "",
  time: "",
  notes: "",
};

export function createDefaultComposeForm(): ComposeFormState {
  const { date, time } = createDefaultComposeDateTime();

  return {
    ...EMPTY_COMPOSE_FORM,
    date,
    time,
  };
}

export function scheduledLabelFromForm(form: ComposeFormState): string {
  return formatSchedulerPreviewFromParts(form.date, form.time);
}

export function scheduledForIsoFromForm(form: ComposeFormState): string {
  return localDateTimeToIso(form.date, form.time);
}

export default function ComposePanel({
  form,
  connections,
  editingPostId,
  isSaving,
  isUploadingImage,
  onChange,
  onImageUpload,
  onRemoveImage,
  onSubmitSchedule,
  onSubmitPublishNow,
  onCancelEdit,
}: ComposePanelProps) {
  const meta = PLATFORM_META[form.platform];
  const connection =
    connections.find((item) => item.platform === form.platform) ?? null;
  const isConnected = Boolean(connection);
  const hydrated = useSchedulerHydrated();
  const scheduledLabel = hydrated
    ? scheduledLabelFromForm(form)
    : "Select date and time";

  const characterWarning = useMemo(() => {
    const ratio = form.caption.length / meta.characterLimit;
    if (ratio >= 1) return "text-red-300";
    if (ratio >= 0.85) return "text-amber-300";
    return "text-zinc-600";
  }, [form.caption.length, meta.characterLimit]);

  return (
    <section className="glass rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {editingPostId ? "Edit Post" : "Compose Post"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Write, preview, and schedule across your connected accounts.
          </p>
        </div>
        {editingPostId ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <div>
            <label className={settingsLabelClassName} htmlFor="compose-platform">
              Platform
            </label>
            <select
              id="compose-platform"
              value={form.platform}
              onChange={(event) =>
                onChange("platform", event.target.value as SocialPlatform)
              }
              className={settingsSelectClassName}
            >
              {AVAILABLE_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_META[platform].label}
                </option>
              ))}
            </select>
            {!isConnected ? (
              <p className="mt-1.5 text-xs text-amber-300/90">
                Connect {meta.label} before publishing.
              </p>
            ) : null}
          </div>

          <div>
            <label className={settingsLabelClassName} htmlFor="compose-caption">
              Caption
            </label>
            <textarea
              id="compose-caption"
              value={form.caption}
              onChange={(event) => onChange("caption", event.target.value)}
              placeholder={`Write your ${meta.label} post...`}
              maxLength={meta.characterLimit}
              className={textareaClassName}
            />
            <p className={`mt-1 text-xs ${characterWarning}`}>
              {form.caption.length}/{meta.characterLimit}
            </p>
          </div>

          {meta.supportsImages ? (
            <div>
              <label className={settingsLabelClassName}>Image</label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-center transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]">
                {isUploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                ) : (
                  <Upload className="h-5 w-5 text-cyan-300" />
                )}
                <span className="mt-2 text-sm font-medium text-zinc-300">
                  Upload image
                </span>
                <span className="mt-1 text-xs text-zinc-600">
                  JPG, PNG, WebP, or GIF up to 5 MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void onImageUpload(file);
                    }
                  }}
                />
              </label>
              {form.imageUrl ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <img
                    src={form.imageUrl}
                    alt="Upload preview"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="text-xs font-medium text-red-300 transition hover:text-red-200"
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={settingsLabelClassName} htmlFor="compose-date">
                Date
              </label>
              <input
                id="compose-date"
                type="date"
                value={form.date}
                onChange={(event) => onChange("date", event.target.value)}
                className={settingsInputClassName}
              />
            </div>
            <div>
              <label className={settingsLabelClassName} htmlFor="compose-time">
                Time
              </label>
              <input
                id="compose-time"
                type="time"
                value={form.time}
                onChange={(event) => onChange("time", event.target.value)}
                className={settingsInputClassName}
              />
            </div>
          </div>

          <div>
            <label className={settingsLabelClassName} htmlFor="compose-notes">
              Notes
            </label>
            <textarea
              id="compose-notes"
              value={form.notes}
              onChange={(event) => onChange("notes", event.target.value)}
              placeholder="Campaign context or approval notes..."
              maxLength={1000}
              className={`${settingsInputClassName} min-h-20 resize-y`}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isSaving || !isConnected}
              onClick={() => void onSubmitPublishNow()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publish Now
            </button>
            <button
              type="button"
              disabled={isSaving || !isConnected}
              onClick={() => void onSubmitSchedule()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              Schedule Post
            </button>
          </div>
        </div>

        <PostPreview
          platform={form.platform}
          caption={form.caption}
          imageUrl={form.imageUrl}
          connection={connection}
          scheduledLabel={scheduledLabel}
        />
      </div>
    </section>
  );
}
