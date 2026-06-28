"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Trash2, Wand2 } from "lucide-react";
import {
  BRAND_VOICES,
  CAPTION_LENGTHS,
  CTA_STYLES,
  DEFAULT_BRAND_KIT,
  EMOJI_USAGE_LEVELS,
  WRITING_STYLES,
  type BrandKit,
  type BrandKitAutofill,
  type BrandKitRecord,
} from "@/lib/brand-kit/types";
import { validateBrandKit } from "@/lib/brand-kit/validation";
import {
  settingsInputClassName,
  settingsLabelClassName,
  settingsSelectClassName,
} from "@/lib/settings/display";

type BrandKitPageClientProps = {
  initialBrandKit: BrandKitRecord | null;
};

type Status = { type: "success" | "error"; message: string } | null;

const textareaClassName = `${settingsInputClassName} min-h-28 resize-y`;

function toEditableBrandKit(brandKit: BrandKitRecord | null): BrandKit {
  return brandKit ? { ...brandKit } : { ...DEFAULT_BRAND_KIT };
}

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 shadow-lg shadow-cyan-950/20"
          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

export default function BrandKitPageClient({
  initialBrandKit,
}: BrandKitPageClientProps) {
  const router = useRouter();
  const [brandKit, setBrandKit] = useState<BrandKit>(() =>
    toEditableBrandKit(initialBrandKit)
  );
  const [status, setStatus] = useState<Status>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);

  function update<K extends keyof BrandKit>(key: K, value: BrandKit[K]) {
    setBrandKit((current) => ({ ...current, [key]: value }));
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") || file.size > 500_000) {
      setStatus({
        type: "error",
        message: "Upload a logo image under 500 KB.",
      });
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Logo upload failed"));
      reader.readAsDataURL(file);
    });

    update("logoUrl", dataUrl);
  }

  async function handleAutofill() {
    setStatus(null);
    setIsAutofilling(true);

    try {
      const response = await fetch("/api/brand-kit/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: brandKit.websiteUrl }),
      });
      const payload = (await response.json()) as {
        error?: string;
        autofill?: BrandKitAutofill;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload.error ?? "Unable to autofill from this website.",
        });
        return;
      }

      const autofill = payload.autofill ?? {};
      setBrandKit((current) => ({
        ...current,
        brandName: autofill.brandName || current.brandName,
        industry: autofill.industry || current.industry,
        brandDescription:
          autofill.brandDescription || current.brandDescription,
      }));
      setStatus({
        type: "success",
        message:
          autofill.brandName || autofill.industry || autofill.brandDescription
            ? "Brand Kit fields autofilled."
            : "No brand details found, but you can keep filling it manually.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Autofill failed. You can still enter details manually.",
      });
    } finally {
      setIsAutofilling(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);

    const validation = validateBrandKit(brandKit as unknown as Record<string, unknown>);
    if (!validation.ok) {
      setStatus({ type: "error", message: validation.error });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/brand-kit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });
      const payload = (await response.json()) as {
        error?: string;
        brandKit?: BrandKitRecord;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload.error ?? "Unable to save Brand Kit.",
        });
        return;
      }

      setBrandKit(toEditableBrandKit(payload.brandKit ?? null));
      setStatus({
        type: "success",
        message: "Brand Kit saved. Future AI generations will use it.",
      });
      router.refresh();
    } catch {
      setStatus({
        type: "error",
        message: "Unable to save Brand Kit. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setStatus(null);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/brand-kit", { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload.error ?? "Unable to delete Brand Kit.",
        });
        return;
      }

      setBrandKit({ ...DEFAULT_BRAND_KIT });
      setStatus({ type: "success", message: "Brand Kit deleted." });
      router.refresh();
    } catch {
      setStatus({
        type: "error",
        message: "Unable to delete Brand Kit. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleReset() {
    setStatus(null);
    setIsResetting(true);

    try {
      const response = await fetch("/api/brand-kit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_BRAND_KIT),
      });
      const payload = (await response.json()) as {
        error?: string;
        brandKit?: BrandKitRecord;
      };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload.error ?? "Unable to reset Brand Kit.",
        });
        return;
      }

      setBrandKit(toEditableBrandKit(payload.brandKit ?? null));
      setStatus({ type: "success", message: "Brand Kit reset to defaults." });
      router.refresh();
    } catch {
      setStatus({
        type: "error",
        message: "Unable to reset Brand Kit. Please try again.",
      });
    } finally {
      setIsResetting(false);
    }
  }

  const previewVoice =
    brandKit.brandVoice === "Custom"
      ? brandKit.customBrandVoice || "Custom voice"
      : brandKit.brandVoice;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {status && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl sm:w-auto ${
            status.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : "border-red-500/30 bg-red-500/15 text-red-200"
          }`}
          role={status.type === "success" ? "status" : "alert"}
        >
          {status.message}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass relative overflow-hidden rounded-3xl border border-white/[0.08] p-5 shadow-2xl shadow-black/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Brand memory for every future generation
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Turn Advora into your brand-trained ad assistant.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Save your voice, audience, colors, and creative defaults once.
              Hooks, captions, CTAs, and UGC scripts will automatically follow
              this Brand Kit.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Live Preview
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${brandKit.primaryColor}, ${brandKit.secondaryColor})`,
                }}
              >
                {brandKit.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandKit.logoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (brandKit.brandName || "A").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">
                  {brandKit.brandName || "Your Brand"}
                </h2>
                <p className="truncate text-sm text-zinc-500">
                  {brandKit.industry || "Industry"} - {previewVoice}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {brandKit.usp ||
                "Your USP will guide every generated hook, caption, CTA, and UGC script."}
            </p>
            <button
              type="button"
              className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: brandKit.ctaColor }}
            >
              {brandKit.ctaStyle} CTA preview
            </button>
          </div>
        </div>
      </motion.section>

      <form className="grid gap-6 xl:grid-cols-[1fr_22rem]" onSubmit={handleSave}>
        <div className="space-y-6">
          <FieldGroup
            title="Brand Profile"
            description="Core identity that Advora should remember before writing."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="brand-name" className={settingsLabelClassName}>
                  Brand name
                </label>
                <input
                  id="brand-name"
                  value={brandKit.brandName}
                  onChange={(event) => update("brandName", event.target.value)}
                  className={settingsInputClassName}
                  placeholder="Advora AI"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="website-url" className={settingsLabelClassName}>
                    Website URL
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleAutofill()}
                    disabled={isAutofilling || !brandKit.websiteUrl}
                    className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAutofilling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                    Autofill
                  </button>
                </div>
                <input
                  id="website-url"
                  type="url"
                  value={brandKit.websiteUrl}
                  onChange={(event) => update("websiteUrl", event.target.value)}
                  className={settingsInputClassName}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label htmlFor="industry" className={settingsLabelClassName}>
                  Industry
                </label>
                <input
                  id="industry"
                  value={brandKit.industry}
                  onChange={(event) => update("industry", event.target.value)}
                  className={settingsInputClassName}
                  placeholder="Premium fitness, SaaS, beauty..."
                />
              </div>
              <div>
                <label htmlFor="logo-upload" className={settingsLabelClassName}>
                  Logo upload
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleLogoUpload(event)}
                  className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] text-sm text-zinc-400 file:mr-4 file:border-0 file:bg-white/10 file:px-4 file:py-3 file:text-sm file:font-medium file:text-white hover:file:bg-white/15"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  PNG, JPG, or SVG under 500 KB.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="brand-description"
                  className={settingsLabelClassName}
                >
                  Brand description
                </label>
                <textarea
                  id="brand-description"
                  value={brandKit.brandDescription}
                  onChange={(event) =>
                    update("brandDescription", event.target.value)
                  }
                  className={textareaClassName}
                  placeholder="What does your brand do and what should customers feel?"
                />
              </div>
              <div>
                <label
                  htmlFor="target-audience"
                  className={settingsLabelClassName}
                >
                  Target audience
                </label>
                <textarea
                  id="target-audience"
                  value={brandKit.targetAudience}
                  onChange={(event) =>
                    update("targetAudience", event.target.value)
                  }
                  className={textareaClassName}
                  placeholder="Founders, creators, DTC brands..."
                />
              </div>
              <div>
                <label htmlFor="usp" className={settingsLabelClassName}>
                  Unique selling proposition
                </label>
                <textarea
                  id="usp"
                  value={brandKit.usp}
                  onChange={(event) => update("usp", event.target.value)}
                  className={textareaClassName}
                  placeholder="The one thing customers should remember."
                />
              </div>
            </div>
          </FieldGroup>

          <FieldGroup
            title="Brand Voice"
            description="Choose a preset or describe a custom tone."
          >
            <div className="flex flex-wrap gap-2">
              {BRAND_VOICES.map((voice) => (
                <ChoiceButton
                  key={voice}
                  label={voice === "Custom" ? "Custom Brand Voice" : voice}
                  active={brandKit.brandVoice === voice}
                  onClick={() => update("brandVoice", voice)}
                />
              ))}
            </div>
            {brandKit.brandVoice === "Custom" && (
              <div className="mt-4">
                <label
                  htmlFor="custom-brand-voice"
                  className={settingsLabelClassName}
                >
                  Custom brand voice
                </label>
                <textarea
                  id="custom-brand-voice"
                  value={brandKit.customBrandVoice}
                  onChange={(event) =>
                    update("customBrandVoice", event.target.value)
                  }
                  className={textareaClassName}
                  placeholder='Write like Apple. Write like Nike. Write like Gymshark.'
                />
              </div>
            )}
          </FieldGroup>

          <FieldGroup
            title="Visual Identity"
            description="Color cues for brand-aligned CTAs and creative direction."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["primaryColor", "Primary brand color"],
                ["secondaryColor", "Secondary brand color"],
                ["ctaColor", "CTA button color"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label htmlFor={key} className={settingsLabelClassName}>
                    {label}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id={key}
                      type="color"
                      value={brandKit[key as keyof BrandKit] as string}
                      onChange={(event) =>
                        update(key as keyof BrandKit, event.target.value)
                      }
                      className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
                    />
                    <input
                      value={brandKit[key as keyof BrandKit] as string}
                      onChange={(event) =>
                        update(key as keyof BrandKit, event.target.value)
                      }
                      className={settingsInputClassName}
                    />
                  </div>
                </div>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup
            title="Default Settings"
            description="The defaults Advora should apply to future ad outputs."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="caption-length" className={settingsLabelClassName}>
                  Caption length
                </label>
                <select
                  id="caption-length"
                  value={brandKit.captionLength}
                  onChange={(event) =>
                    update("captionLength", event.target.value as BrandKit["captionLength"])
                  }
                  className={settingsSelectClassName}
                >
                  {CAPTION_LENGTHS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="emoji-usage" className={settingsLabelClassName}>
                  Emoji usage
                </label>
                <select
                  id="emoji-usage"
                  value={brandKit.emojiUsage}
                  onChange={(event) =>
                    update("emojiUsage", event.target.value as BrandKit["emojiUsage"])
                  }
                  className={settingsSelectClassName}
                >
                  {EMOJI_USAGE_LEVELS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cta-style" className={settingsLabelClassName}>
                  CTA style
                </label>
                <select
                  id="cta-style"
                  value={brandKit.ctaStyle}
                  onChange={(event) =>
                    update("ctaStyle", event.target.value as BrandKit["ctaStyle"])
                  }
                  className={settingsSelectClassName}
                >
                  {CTA_STYLES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="writing-style" className={settingsLabelClassName}>
                  Writing style
                </label>
                <select
                  id="writing-style"
                  value={brandKit.writingStyle}
                  onChange={(event) =>
                    update("writingStyle", event.target.value as BrandKit["writingStyle"])
                  }
                  className={settingsSelectClassName}
                >
                  {WRITING_STYLES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </FieldGroup>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="glass rounded-2xl border border-white/[0.08] p-5">
            <p className="text-sm font-semibold text-white">Brand Kit actions</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Saving updates the brand memory used by future AI generations.
            </p>
            <div className="mt-5 space-y-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Brand Kit
                  </>
                ) : (
                  "Save Brand Kit"
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleReset()}
                disabled={isResetting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResetting && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset Brand Kit
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:border-red-500/50 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Brand Kit
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-5">
            <p className="text-sm font-semibold text-white">
              Generation preview
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Future hooks will lead with{" "}
              <span className="text-cyan-200">
                {brandKit.usp || "your USP"}
              </span>
              , captions will stay{" "}
              <span className="text-violet-200">
                {brandKit.captionLength.toLowerCase()}
              </span>
              , and CTAs will feel{" "}
              <span className="text-fuchsia-200">
                {brandKit.ctaStyle.toLowerCase()}
              </span>
              .
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
