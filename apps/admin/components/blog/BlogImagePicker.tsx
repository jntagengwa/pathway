"use client";

import React, { useCallback, useRef } from "react";
import { Label } from "@pathway/ui";
import { uploadBlogAsset } from "../../lib/api-client";

type Props = {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  helpText?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function BlogImagePicker({ label, value, onChange, helpText }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return;
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = typeof btoa !== "undefined" ? btoa(binary) : "";
    const mimeType = file.type as "image/png" | "image/jpeg" | "image/webp";
    const type = label.toLowerCase().includes("thumbnail") ? "THUMBNAIL" : "HEADER";
    const res = await uploadBlogAsset(base64, mimeType, type);
    onChange(res.id);
  }, [label, onChange]);

  const imageUrl = value && API_BASE ? `${API_BASE.replace(/\/$/, "")}/media/${value}` : null;

  return (
    <div>
      <Label>{label}</Label>
      {helpText && (
        <p className="mt-1 text-xs text-text-muted">{helpText}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {imageUrl && (
          <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-border-subtle bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-muted"
          >
            {value ? "Change image" : "Select image"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-md border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-status-danger hover:bg-status-danger/10"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
