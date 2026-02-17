"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";

/**
 * Toast notifications styled like Option B:
 * - Success: light green bg, green checkmark icon
 * - Info: light blue bg, blue info icon
 * - Warning: light orange bg, orange exclamation icon
 * - Error: light red bg, red exclamation icon
 * - Rounded corners, icon left, close button right
 */
export function Toaster(props: Omit<ToasterProps, "icons">) {
  return (
    <Sonner
      position="top-center"
      richColors={false}
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-soft min-h-[48px] w-full max-w-md",
          title: "text-sm font-medium text-text-primary",
          description: "text-sm text-text-muted",
          closeButton:
            "rounded-full p-1.5 text-text-muted hover:bg-black/5 hover:text-text-primary transition-colors",
          success:
            "bg-[rgb(var(--pw-status-ok)/0.12)] border-[rgb(var(--pw-status-ok)/0.3)]",
          error:
            "bg-[rgb(var(--pw-status-danger)/0.12)] border-[rgb(var(--pw-status-danger)/0.3)]",
          warning:
            "bg-[rgb(var(--pw-status-warn)/0.12)] border-[rgb(var(--pw-status-warn)/0.3)]",
          info: "bg-[rgb(var(--pw-status-info)/0.12)] border-[rgb(var(--pw-status-info)/0.3)]",
        },
      }}
      icons={{
        success: (
          <CheckCircle2
            className="h-5 w-5 shrink-0"
            style={{ color: "rgb(var(--pw-status-ok))" }}
          />
        ),
        error: (
          <XCircle
            className="h-5 w-5 shrink-0"
            style={{ color: "rgb(var(--pw-status-danger))" }}
          />
        ),
        warning: (
          <AlertTriangle
            className="h-5 w-5 shrink-0"
            style={{ color: "rgb(var(--pw-status-warn))" }}
          />
        ),
        info: (
          <Info
            className="h-5 w-5 shrink-0"
            style={{ color: "rgb(var(--pw-status-info))" }}
          />
        ),
      }}
      {...props}
    />
  );
}
