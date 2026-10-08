"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { ApiError, uploadImage } from "@/lib/api";
import { resolveImageUrl } from "@/lib/config";
import { useToast } from "@/components/ui/toast";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  shape?: "square" | "circle";
}

export function ImageUpload({ value, onChange, label, shape = "square" }: ImageUploadProps) {
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to upload image", "error");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex items-center gap-4">
      <div
        className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-2 ${shapeClass}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveImageUrl(value) ?? undefined} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-5 w-5 text-muted" />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
          >
            {value ? "Replace" : "Upload"} {label}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] text-muted transition-colors hover:text-danger disabled:opacity-50 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted">JPEG, PNG or WebP, up to 5MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
