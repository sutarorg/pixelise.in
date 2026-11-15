"use client";

import * as React from "react";
import { ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { validateImageFile } from "@/lib/upload";
import { uploadConstraints } from "@/config/studio";

export interface SelectedPhoto {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * Product photo picker.
 *
 * Three paths to the same file: drag and drop (an enhancement), a native
 * `<input type="file">` that screen readers and keyboards can operate, and a
 * "Browse files" button that opens the same picker. No upload starts here — the
 * bytes only leave the browser when the customer presses Generate.
 */
export function ImageUploader({
  photo,
  error,
  disabled,
  onSelect,
  onRemove,
}: {
  photo: SelectedPhoto | null;
  error: string | null;
  disabled?: boolean;
  onSelect: (photo: SelectedPhoto) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);

  const shownError = error ?? localError;

  const accept = React.useMemo(
    () => uploadConstraints.acceptedMimeTypes.join(","),
    [],
  );

  const handleFiles = React.useCallback(
    async (files: FileList | null) => {
      const next = files?.[0];
      if (!next || disabled) return;
      setChecking(true);
      setLocalError(null);
      const result = await validateImageFile(next);
      setChecking(false);
      if (!result.ok) {
        setLocalError(result.message);
        return;
      }
      onSelect({
        file: next,
        previewUrl: URL.createObjectURL(next),
        width: result.width,
        height: result.height,
      });
    },
    [disabled, onSelect],
  );

  return (
    <div>
      <input
        ref={inputRef}
        id="product-photo"
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        aria-describedby={shownError ? "upload-error" : "upload-help"}
        aria-invalid={shownError ? true : undefined}
        onChange={(event) => {
          void handleFiles(event.target.files);
          /* Allow choosing the same file again after a replace. */
          event.target.value = "";
        }}
      />

      {photo ? (
        <div>
          <div className="relative overflow-hidden rounded-[10px] border border-line bg-[linear-gradient(140deg,#faf9ff_0%,#f3f0ff_100%)]">
            {/* Local object URL of the customer's own file — not a stored asset. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.previewUrl}
              alt="The product photo you selected"
              className="mx-auto max-h-[15rem] w-full object-contain"
            />
          </div>

          <div className="mt-2.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[0.75rem] font-semibold text-ink">{photo.file.name}</p>
              <p className="text-[0.6875rem] text-muted">
                {formatBytes(photo.file.size)} · {photo.width}×{photo.height}px
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled || checking}
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => {
                  setLocalError(null);
                  onRemove();
                }}
                className="text-[#a52b22] hover:bg-[#fdf1f0]"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={(event) => {
            if (disabled) return;
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors",
            dragging
              ? "border-violet bg-tint"
              : "border-line-strong bg-surface hover:border-violet/40",
            disabled && "opacity-70",
          )}
        >
          <span
            aria-hidden="true"
            className="mx-auto grid size-10 place-items-center rounded-full border border-violet/15 bg-white text-violet"
          >
            {dragging ? (
              <UploadCloud className="size-[1.15rem]" strokeWidth={1.9} />
            ) : (
              <ImagePlus className="size-[1.15rem]" strokeWidth={1.9} />
            )}
          </span>
          <p className="mt-2.5 text-[0.8125rem] font-semibold text-ink">
            {dragging ? "Drop to add your photo" : "Drag a product photo here"}
          </p>
          <p className="mt-0.5 text-[0.71875rem] text-muted">or</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-2"
            disabled={disabled || checking}
            onClick={() => inputRef.current?.click()}
          >
            {checking ? "Checking…" : "Browse files"}
          </Button>
          <p id="upload-help" className="mt-3 text-[0.6875rem] leading-[1.5] text-muted">
            {uploadConstraints.acceptedLabel}. Straight-on product shots work best.
          </p>
        </div>
      )}

      {shownError ? (
        <p
          id="upload-error"
          role="alert"
          className="mt-2 rounded-[8px] bg-[#fdf1f0] px-2.5 py-2 text-[0.75rem] leading-[1.5] text-[#7d2a22]"
        >
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
