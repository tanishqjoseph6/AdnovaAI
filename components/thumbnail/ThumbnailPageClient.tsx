"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import ThumbnailForm from "@/components/thumbnail/ThumbnailForm";
import ThumbnailResults from "@/components/thumbnail/ThumbnailResults";
import ThumbnailSkeleton from "@/components/thumbnail/ThumbnailSkeleton";
import {
  generateThumbnail,
  listThumbnailTemplates,
  saveThumbnailTemplate,
} from "@/lib/api/thumbnail-client";
import { isNoCreditsError } from "@/lib/api/credits-client";
import { dispatchNoCreditsEvent } from "@/lib/credits/client-events";
import { useCredits } from "@/hooks/useCredits";
import {
  EMPTY_THUMBNAIL_INPUT,
  type ThumbnailInput,
  type ThumbnailResult,
  type ThumbnailTemplate,
} from "@/lib/thumbnail/types";

type GeneratorState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      result: ThumbnailResult;
      thumbnailId: string | null;
      saved: boolean;
    }
  | { status: "error"; message: string };

export default function ThumbnailPageClient() {
  const { refresh } = useCredits();
  const [form, setForm] = useState<ThumbnailInput>(EMPTY_THUMBNAIL_INPUT);
  const [state, setState] = useState<GeneratorState>({ status: "idle" });
  const [templates, setTemplates] = useState<ThumbnailTemplate[]>([]);
  const [isImportingBrandKit, setIsImportingBrandKit] = useState(false);

  useEffect(() => {
    void listThumbnailTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  function updateForm<K extends keyof ThumbnailInput>(
    key: K,
    value: ThumbnailInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (state.status === "error") {
      setState({ status: "idle" });
    }
  }

  function applyTemplate(template: ThumbnailTemplate) {
    setForm((current) => ({
      ...current,
      format: template.format,
      prompt: template.prompt,
      brandName: template.brand_name,
      brandColors: template.brand_colors,
      productUrl: template.product_url ?? "",
      templateId: template.id,
    }));
    setState({ status: "idle" });
  }

  async function importBrandKit() {
    setIsImportingBrandKit(true);
    try {
      const response = await fetch("/api/brand-kit", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.brandKit) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Brand Kit not found."
        );
      }

      const kit = payload.brandKit as {
        brandName?: string;
        websiteUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        ctaColor?: string;
        logoUrl?: string;
      };

      setForm((current) => ({
        ...current,
        brandName: kit.brandName?.trim() || current.brandName,
        productUrl: kit.websiteUrl?.trim() || current.productUrl,
        brandColors: {
          primary: kit.primaryColor || current.brandColors.primary,
          secondary: kit.secondaryColor || current.brandColors.secondary,
          accent: kit.ctaColor || current.brandColors.accent,
        },
      }));
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to import Brand Kit.",
      });
    } finally {
      setIsImportingBrandKit(false);
    }
  }

  async function handleGenerate() {
    setState({ status: "loading" });

    try {
      const response = await generateThumbnail(form);
      void refresh();
      window.dispatchEvent(new CustomEvent("advora:generation-success"));
      setState({
        status: "success",
        result: response.result,
        thumbnailId: response.thumbnailId,
        saved: response.saved,
      });
    } catch (error) {
      if (isNoCreditsError(error)) {
        dispatchNoCreditsEvent();
        setState({ status: "idle" });
        return;
      }

      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate thumbnails. Please try again.",
      });
    }
  }

  async function handleSaveTemplate(name: string) {
    if (state.status !== "success") {
      throw new Error("Generate thumbnails before saving a template.");
    }

    const template = await saveThumbnailTemplate({
      name,
      format: form.format,
      prompt: form.prompt,
      brandName: form.brandName,
      brandColors: form.brandColors,
      productUrl: form.productUrl,
      previewImageUrl: state.result.variations[0]?.imageUrl ?? null,
    });

    setTemplates((current) => [template, ...current]);
  }

  const isLoading = state.status === "loading";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="gradient-border overflow-hidden rounded-2xl bg-[#0a0618] shadow-xl shadow-violet-500/5">
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/20">
              <ImageIcon
                className="h-5 w-5 text-cyan-400"
                strokeWidth={1.75}
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white sm:text-lg">
                AI Thumbnail Generator
              </h2>
              <p className="text-sm text-zinc-500">
                YouTube, Instagram, Reels, product, and ad thumbnails with AI
                headlines and CTAs
              </p>
            </div>
            {isLoading ? (
              <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
                <LoadingSpinner className="h-3.5 w-3.5" />
                Rendering HD variations…
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <ThumbnailForm
            value={form}
            isLoading={isLoading}
            templates={templates}
            onChange={updateForm}
            onSubmit={() => void handleGenerate()}
            onApplyTemplate={applyTemplate}
            onImportBrandKit={() => void importBrandKit()}
            isImportingBrandKit={isImportingBrandKit}
          />

          {state.status === "error" ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <p className="text-sm text-red-400">{state.message}</p>
            </div>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <ThumbnailSkeleton count={form.variationCount} />
      ) : null}

      {state.status === "success" ? (
        <ThumbnailResults
          input={form}
          result={state.result}
          thumbnailId={state.thumbnailId}
          saved={state.saved}
          isRegenerating={isLoading}
          onRegenerate={() => void handleGenerate()}
          onSaveTemplate={handleSaveTemplate}
        />
      ) : null}

      {state.status === "idle" && !isLoading ? (
        <section className="glass rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-12">
          <ImageIcon
            className="mx-auto h-10 w-10 text-zinc-600"
            strokeWidth={1.5}
          />
          <h3 className="mt-4 text-lg font-semibold text-white">
            Ready to design scroll-stopping thumbnails
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Add a prompt, brand colors, and optional product/logo assets. Advora
            generates multiple HD variations with headlines and CTAs you can
            copy, download, regenerate, and save as templates.
          </p>
        </section>
      ) : null}
    </div>
  );
}
