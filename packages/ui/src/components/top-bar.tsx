import * as React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/cn";

export type TopBarProps = {
  title?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
};

export const TopBar: React.FC<TopBarProps> = ({
  title,
  breadcrumbs,
  actions,
  rightSlot,
  className,
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-6 shadow-soft",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {breadcrumbs ?? null}
        {title ? (
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-text-primary font-heading leading-7">
              {title}
            </p>
            <p className="text-xs text-text-muted">
              {/* TODO: replace with live breadcrumb / context summary */}
              Overview
            </p>
          </div>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-3">
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
        {rightSlot ?? (
          <div className="flex items-center gap-2">
            {/* TODO: wire org switcher to PathwayRequestContext when auth is available */}
            <Badge variant="accent">Org Switcher</Badge>
            {/* TODO: replace placeholder user menu with real user info */}
            <Button variant="secondary" size="sm">
              User Menu
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
