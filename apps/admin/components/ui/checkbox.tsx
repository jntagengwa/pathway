"use client";

import * as React from "react";
import { cn } from "@pathway/ui";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  className?: string;
};

const CheckmarkIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 16 16"
    fill="none"
    className="h-3.5 w-3.5 shrink-0 text-accent-strong"
  >
    <path
      d="M13.485 3.146a.5.5 0 0 1 .708.708l-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l6.985-6.985z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Checkbox styled with Nexsteps design tokens (subtle secondary accent).
 * Unchecked: light border. Checked: accent-subtle bg, accent-strong border, visible checkmark.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <span
      className={cn(
        "relative inline-flex h-4 w-4 shrink-0 cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...props}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors",
          "peer-hover:border-accent-strong/40",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-accent-strong/30 peer-focus-visible:ring-offset-2",
          "peer-checked:border-accent-strong peer-checked:bg-accent-subtle",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        )}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity peer-checked:opacity-100"
        aria-hidden
      >
        <CheckmarkIcon />
      </span>
    </span>
  ),
);
Checkbox.displayName = "Checkbox";
