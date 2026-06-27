"use client";

import { ImagePlus, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { analyzeProductImage } from "@/lib/api/analyze-product-client";
import {
  createEmptyProductAnalysis,
  getAutoFillDescription,
  hasProductAnalysisContent,
  type ProductAnalysis,
} from "@/lib/product-analysis/types";
import ProductAnalysisCard from "./ProductAnalysisCard";
import LoadingSpinner from "./LoadingSpinner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 10;

export type GeneratePayload = {
  productDescription: string;
  productAnalysis?: ProductAnalysis | null;
};

type ProductUploadProps = {
  compact?: boolean;
  onGenerate?: (payload: GeneratePayload) => Promise<void>;
  isGenerating?: boolean;
  externalError?: string | null;
  onClearError?: () => void;
};

function buildProductDescription(
  description: string,
  productUrl: string,
  hasImage: boolean
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

  if (hasImage) {
    parts.push("The seller provided 1 product image for visual reference.");
  }

  return parts.join("\n\n");
}

function ProductImagePreview({
  src,
  fileName,
  onRemove,
  onReplace,
  disabled,
}: {
  src: string;
  fileName: string;
  onRemove: () => void;
  onReplace: () => void;
  disabled: boolean;
}) {
  return (
    <div className="glass rounded-xl p-3 sm:p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Product image
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative mx-auto w-full max-w-[140px] shrink-0 sm:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Uploaded product preview"
            className="aspect-square w-full rounded-xl border border-white/10 object-cover"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#030014] text-zinc-400 shadow-lg transition hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className="truncate text-sm font-medium text-zinc-300" title={fileName}>
            {fileName}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={onReplace}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Replace image
          </button>
        </div>
      </div>
    </div>
  );
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
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [productDescription, setProductDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis>(
    createEmptyProductAnalysis()
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError ?? externalError;
  const uploadDisabled = isGenerating || isProcessingUpload;

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const clearErrors = useCallback(() => {
    setLocalError(null);
    onClearError?.();
  }, [onClearError]);

  const revokeCurrentPreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const clearImage = useCallback(() => {
    revokeCurrentPreview();
    setFile(null);
    setAnalysis(createEmptyProductAnalysis());
    setAnalysisError(null);
    setIsEditingAnalysis(false);
    setIsAnalyzing(false);
    clearErrors();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [clearErrors, revokeCurrentPreview]);

  const runAnalysis = useCallback(async (imageFile: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeProductImage(imageFile);
      setAnalysis(result);
      setIsEditingAnalysis(false);

      const autoDescription = getAutoFillDescription(result);
      if (autoDescription) {
        setProductDescription(autoDescription);
      }
    } catch (err) {
      setAnalysis(createEmptyProductAnalysis());
      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Analysis failed. You can edit the fields manually."
      );
      setIsEditingAnalysis(true);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const openFilePicker = useCallback(() => {
    if (uploadDisabled) return;
    fileInputRef.current?.click();
  }, [uploadDisabled]);

  const processFile = useCallback(
    async (incoming: File) => {
      clearErrors();

      if (!ACCEPTED_TYPES.includes(incoming.type)) {
        setLocalError("Only JPG, PNG, WebP, and GIF images are supported.");
        return;
      }

      if (incoming.size > MAX_SIZE_MB * 1024 * 1024) {
        setLocalError(`Each file must be under ${MAX_SIZE_MB}MB.`);
        return;
      }

      setIsProcessingUpload(true);

      try {
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });

        const nextPreview = URL.createObjectURL(incoming);

        setPreviewUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return nextPreview;
        });
        setFile(incoming);
        void runAnalysis(incoming);
      } finally {
        setIsProcessingUpload(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [clearErrors, runAnalysis]
  );

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const first = Array.from(incoming)[0];
      if (first) {
        void processFile(first);
      }
    },
    [processFile]
  );

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
    if (uploadDisabled) return;
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleGenerate = async () => {
    if (!productDescription.trim() && !productUrl.trim() && !file) {
      setLocalError("Add a product description, URL, or at least one image.");
      return;
    }

    const fullDescription = buildProductDescription(
      productDescription,
      productUrl,
      Boolean(file)
    );

    if (fullDescription.trim().length < 10) {
      setLocalError(
        "Product description must be at least 10 characters for AI generation."
      );
      return;
    }

    clearErrors();

    try {
      await onGenerate?.({
        productDescription: fullDescription,
        productAnalysis: hasProductAnalysisContent(analysis) ? analysis : null,
      });
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : "Failed to generate ads. Please try again."
      );
    }
  };

  const canGenerate =
    productDescription.trim().length > 0 ||
    productUrl.trim().length > 0 ||
    Boolean(file);

  const dropZoneLabel = previewUrl
    ? isDragging
      ? "Drop to replace image"
      : "Drag & drop or tap to replace"
    : isDragging
      ? "Drop image here"
      : "Drag & drop product image";

  return (
    <section
      className="gradient-border overflow-hidden rounded-2xl bg-[#0a0618] shadow-xl shadow-violet-500/5"
      aria-labelledby="product-upload-heading"
    >
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/20">
              <svg
                className="h-5 w-5 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <h2
                id="product-upload-heading"
                className="text-base font-semibold text-white sm:text-lg"
              >
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
        className={`grid gap-6 p-4 sm:p-6 ${compact ? "" : "md:grid-cols-2"}`}
      >
        <div className="min-w-0 space-y-4">
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            disabled={uploadDisabled}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
              }
            }}
          />

          {previewUrl && file && !isProcessingUpload && (
            <ProductImagePreview
              src={previewUrl}
              fileName={file.name}
              onRemove={clearImage}
              onReplace={openFilePicker}
              disabled={uploadDisabled || isAnalyzing}
            />
          )}

          {previewUrl && file && !isProcessingUpload && (
            <ProductAnalysisCard
              analysis={analysis}
              isEditing={isEditingAnalysis}
              isAnalyzing={isAnalyzing}
              analysisError={analysisError}
              disabled={isGenerating}
              onChange={setAnalysis}
              onEditToggle={() => setIsEditingAnalysis((current) => !current)}
              onRegenerate={() => {
                if (file) {
                  void runAnalysis(file);
                }
              }}
            />
          )}

          <div
            role="button"
            tabIndex={uploadDisabled ? -1 : 0}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
              }
            }}
            aria-label={dropZoneLabel}
            aria-disabled={uploadDisabled}
            className={`relative flex min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 sm:min-h-[160px] ${
              isDragging
                ? "border-cyan-400/60 bg-cyan-500/10"
                : "border-white/10 bg-white/[0.02]"
            } ${uploadDisabled ? "pointer-events-none opacity-60" : "cursor-pointer hover:border-white/20 hover:bg-white/[0.04]"}`}
          >
            {isProcessingUpload ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <LoadingSpinner className="h-8 w-8 text-cyan-400" />
                <p className="text-sm font-medium text-white">
                  Processing image...
                </p>
                <p className="text-xs text-zinc-500">Validating and preparing preview</p>
              </div>
            ) : (
              <>
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    isDragging
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-violet-300"
                  }`}
                >
                  <ImagePlus className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </div>
                <p className="text-sm font-medium text-white">{dropZoneLabel}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  JPG, PNG, WebP, GIF · up to {MAX_SIZE_MB}MB
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="glass rounded-xl p-4 sm:p-5">
            <label
              htmlFor={descriptionInputId}
              className="flex items-center gap-2 text-sm font-medium text-zinc-300"
            >
              <svg
                className="h-4 w-4 shrink-0 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
              Product description
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              Auto-filled from image analysis — edit before generating
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
              <svg
                className="h-4 w-4 shrink-0 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
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
