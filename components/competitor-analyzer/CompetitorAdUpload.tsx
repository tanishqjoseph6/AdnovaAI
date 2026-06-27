"use client";

import { ImagePlus, ScanSearch, Upload, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

type CompetitorAdUploadProps = {
  disabled?: boolean;
  onAnalyze: (file: File) => Promise<void>;
  isAnalyzing?: boolean;
};

export default function CompetitorAdUpload({
  disabled = false,
  onAnalyze,
  isAnalyzing = false,
}: CompetitorAdUploadProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadDisabled = disabled || isAnalyzing;

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

  const revokePreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const clearFile = useCallback(() => {
    revokePreview();
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [revokePreview]);

  const validateAndSetFile = useCallback(
    async (incoming: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(incoming.type)) {
        setError("Only JPG, PNG, and WebP images are supported.");
        return;
      }

      if (incoming.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Each file must be under ${MAX_SIZE_MB}MB.`);
        return;
      }

      const nextPreview = URL.createObjectURL(incoming);
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return nextPreview;
      });
      setFile(incoming);

      try {
        await onAnalyze(incoming);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to analyze competitor ad."
        );
      }
    },
    [onAnalyze]
  );

  const openFilePicker = useCallback(() => {
    if (uploadDisabled) return;
    fileInputRef.current?.click();
  }, [uploadDisabled]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const incoming = event.target.files?.[0];
      if (incoming) {
        void validateAndSetFile(incoming);
      }
    },
    [validateAndSetFile]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (uploadDisabled) return;
      dragCounterRef.current += 1;
      setIsDragging(true);
    },
    [uploadDisabled]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      if (uploadDisabled) return;

      const incoming = event.dataTransfer.files?.[0];
      if (incoming) {
        void validateAndSetFile(incoming);
      }
    },
    [uploadDisabled, validateAndSetFile]
  );

  if (file && previewUrl) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-xl p-3 sm:p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Competitor ad screenshot
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative mx-auto w-full max-w-[200px] shrink-0 sm:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Competitor ad preview"
                className="w-full rounded-xl border border-white/10 object-contain"
              />
              {!isAnalyzing && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0a0618] text-zinc-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <p className="truncate text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-zinc-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · JPG, PNG, or WebP
              </p>

              {!isAnalyzing && (
                <button
                  type="button"
                  disabled={uploadDisabled}
                  onClick={openFilePicker}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Replace image
                </button>
              )}

              {isAnalyzing && (
                <p className="inline-flex items-center gap-2 text-sm text-cyan-300">
                  <ScanSearch className="h-4 w-4 animate-pulse" />
                  Analyzing ad creative with AI vision…
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
          >
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={uploadDisabled ? -1 : 0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
          isDragging
            ? "border-cyan-400/60 bg-cyan-500/10"
            : "border-white/10 bg-white/[0.02] hover:border-violet-500/40 hover:bg-white/[0.04]"
        } ${uploadDisabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <div className="pointer-events-none">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/10">
            <Upload className="h-6 w-6 text-cyan-400" strokeWidth={1.75} />
          </div>
          <p className="mt-4 text-base font-semibold text-white">
            Drop competitor ad screenshot here
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            or click to browse · JPG, PNG, WebP · max {MAX_SIZE_MB}MB
          </p>
          <p className="mt-3 text-xs text-zinc-600">
            Meta, Instagram, Facebook, TikTok, or Google ads
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
        >
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  );
}
