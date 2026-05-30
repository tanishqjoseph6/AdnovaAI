"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILES = 6;
const MAX_SIZE_MB = 10;

export type GeneratePayload = {
  productDescription: string;
};

type ProductUploadProps = {
  compact?: boolean;
  onGenerate?: (payload: GeneratePayload) => Promise<void>;
  isGenerating?: boolean;
  externalError?: string | null;
  onClearError?: () => void;
};

function PreviewThumbnail({
  src,
  index,
  onRemove,
}: {
  src: string;
  index: number;
  onRemove: () => void;
}) {
  return (
    <li className="group relative aspect-square">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Product upload ${index + 1}`}
        className="h-full w-full rounded-lg object-cover"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#030014] text-zinc-400 opacity-100 shadow-lg ring-1 ring-white/10 transition hover:bg-red-500/20 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`Remove image ${index + 1}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}

function buildProductDescription(
  description: string,
  productUrl: string,
  fileCount: number
): string {
  const parts: string[] = [];

  const trimmed = description.trim();
  if (trimmed) {
    parts.push(trimmed);
  }

  const url = productUrl.trim();
  if (url) {
    parts.push(`Product / landing page URL: ${url}`);
  }

  if (fileCount > 0) {
    parts.push(
      `The seller provided ${fileCount} product image(s) for visual reference.`
    );
  }

  return parts.join("\n\n");
}

export default function ProductUpload({
  compact = false,
  onGenerate,
  isGenerating = false,
  externalError = null,
  onClearError,
}: ProductUploadProps) {
  const urlInputId = useId();
  const descriptionInputId = useId();
  const dragCounterRef = useRef(0);
  const previewsRef = useRef<string[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [productDescription, setProductDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError ?? externalError;

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const clearErrors = useCallback(() => {
    setLocalError(null);
    onClearError?.();
  }, [onClearError]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    clearErrors();
    const list = Array.from(incoming);
    const valid: File[] = [];

    for (const file of list) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setLocalError("Only JPG, PNG, WebP, and GIF images are supported.");
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setLocalError(`Each file must be under ${MAX_SIZE_MB}MB.`);
        continue;
      }
      valid.push(file);
    }

    if (!valid.length) return;

    setFiles((prev) => {
      const room = MAX_FILES - prev.length;
      if (room <= 0) {
        setLocalError(`Maximum ${MAX_FILES} images allowed.`);
        return prev;
      }

      const toAdd = valid.slice(0, room);
      if (valid.length > room) {
        setLocalError(`Maximum ${MAX_FILES} images allowed.`);
      }

      const newPreviews = toAdd.map((file) => URL.createObjectURL(file));
      setPreviews((p) => [...p, ...newPreviews]);
      return [...prev, ...toAdd];
    });
  }, [clearErrors]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
    clearErrors();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleGenerate = async () => {
    if (!productDescription.trim() && !productUrl.trim() && files.length === 0) {
      setLocalError("Add a product description, URL, or at least one image.");
      return;
    }

    const fullDescription = buildProductDescription(
      productDescription,
      productUrl,
      files.length
    );

    if (fullDescription.trim().length < 10) {
      setLocalError(
        "Product description must be at least 10 characters for AI generation."
      );
      return;
    }

    clearErrors();

    try {
      await onGenerate?.({ productDescription: fullDescription });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to generate ads. Please try again."
      );
    }
  };

  const canGenerate =
    productDescription.trim().length > 0 ||
    productUrl.trim().length > 0 ||
    files.length > 0;

  return (
    <section
      className="gradient-border overflow-hidden rounded-2xl bg-[#0a0618] shadow-xl shadow-violet-500/5"
      aria-labelledby="product-upload-heading"
    >
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/20">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 id="product-upload-heading" className="text-base font-semibold text-white sm:text-lg">
                Product upload
              </h2>
              <p className="text-sm text-zinc-500">
                Describe your product, then generate ads with AI
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Step 1 of 2
          </span>
        </div>
      </div>

      <div
        className={`grid gap-6 p-4 sm:p-6 ${
          compact ? "" : "md:grid-cols-2"
        }`}
      >
        <div className="min-w-0 space-y-4">
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition sm:min-h-[200px] ${
              isDragging
                ? "border-cyan-400/60 bg-cyan-500/10"
                : "border-white/10 bg-white/[0.02]"
            } ${isGenerating ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              disabled={isGenerating}
              className="sr-only"
              id={`${urlInputId}-file`}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <label
              htmlFor={`${urlInputId}-file`}
              className={`flex flex-col items-center ${isGenerating ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                  isDragging
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-violet-300"
                }`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">
                {isDragging ? "Drop images here" : "Drag & drop product images"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                or <span className="text-cyan-400">tap to browse</span>
              </p>
            </label>
          </div>

          {previews.length > 0 && (
            <div className="glass rounded-xl p-3">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Uploaded ({previews.length}/{MAX_FILES})
              </p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {previews.map((src, i) => (
                  <PreviewThumbnail
                    key={src}
                    src={src}
                    index={i}
                    onRemove={() => removeFile(i)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="glass rounded-xl p-4 sm:p-5">
            <label
              htmlFor={descriptionInputId}
              className="flex items-center gap-2 text-sm font-medium text-zinc-300"
            >
              <svg className="h-4 w-4 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Product description
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              Sent to OpenAI — include features, audience, and price
            </p>
            <textarea
              id={descriptionInputId}
              rows={4}
              value={productDescription}
              disabled={isGenerating}
              onChange={(e) => {
                setProductDescription(e.target.value);
                clearErrors();
              }}
              placeholder="e.g. Premium wireless earbuds with ANC, 48h battery, sweat-resistant, $129. Target: runners and commuters."
              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"
            />
          </div>

          <div className="glass rounded-xl p-4 sm:p-5">
            <label
              htmlFor={urlInputId}
              className="flex items-center gap-2 text-sm font-medium text-zinc-300"
            >
              <svg className="h-4 w-4 shrink-0 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Product URL <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              id={urlInputId}
              type="url"
              inputMode="url"
              value={productUrl}
              disabled={isGenerating}
              onChange={(e) => {
                setProductUrl(e.target.value);
                clearErrors();
              }}
              placeholder="https://yourstore.com/products/..."
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"
            />
          </div>

          {displayError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <p className="text-sm text-red-400">{displayError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            aria-busy={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:py-4"
          >
            {isGenerating ? (
              <LoadingSpinner label="Generating ads with AI..." />
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Ads
              </>
            )}
          </button>

          <p className="text-center text-xs text-zinc-600">
            Powered by AI · ~30 sec · 5 hooks · 3 captions · 1 UGC script
          </p>
        </div>
      </div>
    </section>
  );
}
