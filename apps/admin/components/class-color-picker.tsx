"use client";

import React from "react";
import { Label } from "@pathway/ui";

/** Preset colors for class/group cards on rota. Distinct and accessible. */
export const CLASS_COLOR_PRESETS = [
  "#0ec2a2", // Nexsteps teal
  "#f7ca68", // Golden yellow (accent-secondary)
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f97316", // Orange
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#eab308", // Amber
  "#a855f7", // Purple
] as const;

export function ClassColorPicker({
  value,
  onChange,
  id = "class-color",
}: {
  value: string | null;
  onChange: (color: string | null) => void;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label id={id}>Colour (for rota)</Label>
      <p className="text-xs text-text-muted">
        Pick a colour so this class is easy to spot on the rota.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={id}>
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong/30 focus-visible:ring-offset-2 ${
            value === null
              ? "border-accent-strong bg-surface"
              : "border-border-subtle bg-surface hover:border-border-strong"
          }`}
          aria-label="No colour"
          title="No colour"
        >
          <span className="text-text-muted text-xs">—</span>
        </button>
        {CLASS_COLOR_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className={`h-8 w-8 shrink-0 rounded-md border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong/30 focus-visible:ring-offset-2 ${
              value === hex
                ? "border-accent-strong ring-2 ring-accent-strong/30 ring-offset-2"
                : "border-transparent hover:border-border-strong"
            }`}
            style={{ backgroundColor: hex }}
            aria-label={`Colour ${hex}`}
            title={hex}
          />
        ))}
      </div>
    </div>
  );
}
