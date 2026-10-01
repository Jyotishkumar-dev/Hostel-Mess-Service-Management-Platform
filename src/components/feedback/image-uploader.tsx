"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  validateImage,
} from "@/lib/validations";

/**
 * Optional photo evidence picker.
 *
 * The file is validated in the browser for instant feedback and validated again
 * by `createComplaintAction`, because a client-side check is a convenience and
 * never a security boundary. The rules themselves live in `@/lib/validations`,
 * so this file hardcodes no limits.
 *
 * The parent owns the `File` (a File cannot be a React Hook Form value, so it
 * cannot ride along with the other fields). This component owns only the
 * preview, because an object URL has to be revoked by whoever created it.
 */
export function ImageUploader({
  onChange,
  error,
  disabled = false,
}: {
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const showError = localError ?? error;

  // Revoke on unmount so a preview never outlives the component holding it.
  const previewRef = useRef<string | null>(null);
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const clearPreview = useCallback(() => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const accept = useCallback(
    (next: File | null) => {
      if (!next) {
        clearPreview();
        setLocalError(null);
        onChange(null);
        return;
      }

      const result = validateImage(next);

      if (!result.ok) {
        clearPreview();
        setLocalError(result.message);
        onChange(null);
        return;
      }

      setLocalError(null);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(next);
      });
      onChange(next);
    },
    [clearPreview, onChange],
  );

  const resetInput = () => {
    // Lets the student re-pick the same file after removing it.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium">
          Photo{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        {preview ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={disabled}
            onClick={() => {
              accept(null);
              resetInput();
            }}
            className="text-muted-foreground"
          >
            <X aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        A photo helps the team find the problem the first time. JPG, PNG, WebP or
        GIF, up to {MAX_IMAGE_BYTES / (1024 * 1024)} MB.
      </p>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        className="sr-only"
        disabled={disabled || reading}
        onChange={(event) => {
          setReading(true);
          // Deferred a frame so the spinner paints before the image decodes.
          window.requestAnimationFrame(() => {
            accept(event.target.files?.[0] ?? null);
            event.target.value = "";
            setReading(false);
          });
        }}
      />

      {preview ? (
        <div className="overflow-hidden rounded-xl border bg-muted/40">
          {/* A blob: URL, which next/image cannot optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview of the photo you selected"
            className="max-h-72 w-full object-contain"
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={disabled || reading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "h-auto w-full justify-start gap-3 border-dashed py-6 text-left",
            showError && "border-destructive/50",
          )}
        >
          {reading ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
              <ImagePlus className="size-4" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {reading ? "Reading photo…" : "Attach a photo"}
            </span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Choose a file from your device
            </span>
          </span>
        </Button>
      )}

      {showError ? (
        <p role="alert" className="text-sm text-destructive">
          {showError}
        </p>
      ) : null}
    </div>
  );
}