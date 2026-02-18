"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Label, cn } from "@pathway/ui";
import { Checkbox } from "./ui/checkbox";

export type DropdownMultiSelectOption = {
  value: string;
  label: string;
  title?: string;
};

export type DropdownMultiSelectProps = {
  id?: string;
  label: string;
  options: DropdownMultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  helperText?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

/**
 * Multi-select that matches the bulk session "Classes / groups" UI:
 * collapsed trigger showing comma-separated selected labels + chevron,
 * expandable panel with checkboxes.
 */
export function DropdownMultiSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  helperText,
  error,
  disabled,
  "aria-label": ariaLabel,
  className,
}: DropdownMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const selectedLabels = value
    .map((id) => options.find((o) => o.value === id)?.label ?? id)
    .join(", ");
  const displayText = value.length === 0 ? placeholder : selectedLabels;

  return (
    <div className={cn("flex flex-col gap-2", className)} ref={containerRef}>
      <Label htmlFor={id}>{label}</Label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border-subtle bg-white px-3 py-2 text-left text-sm text-text-primary shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60",
          value.length === 0 && "text-text-muted",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? label}
      >
        <span
          className="min-w-0 truncate"
          title={value.length ? selectedLabels : undefined}
        >
          {displayText}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="z-10 max-h-48 overflow-y-auto rounded-md border border-border-subtle bg-white py-1 shadow-md">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-text-muted">
              No options available
            </p>
          ) : (
            <ul role="listbox" className="py-1">
              {options.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      title={opt.title}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => {
                          onChange(
                            checked
                              ? value.filter((id) => id !== opt.value)
                              : [...value, opt.value],
                          );
                        }}
                      />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
      {helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-status-danger">{error}</p>
      ) : null}
    </div>
  );
}
