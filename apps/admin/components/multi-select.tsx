"use client";

import * as React from "react";
import { cn } from "@pathway/ui";

export type MultiSelectOption = {
  value: string;
  label: string;
  title?: string;
};

export type MultiSelectProps = {
  id?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * Multi-select listbox using native <select multiple>.
 * Use for staff (multiple) or classes (single or multiple; API may accept first only).
 */
export function MultiSelect({
  id,
  options,
  value,
  onChange,
  size = 5,
  disabled,
  className,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    onChange(selected);
  };

  return (
    <select
      id={id}
      multiple
      size={size}
      disabled={disabled}
      aria-label={ariaLabel}
      value={value}
      onChange={handleChange}
      className={cn(
        "w-full rounded-md border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} title={opt.title}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
