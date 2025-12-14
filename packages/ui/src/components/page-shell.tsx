import * as React from "react";
import { cn } from "../lib/cn";

export type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  constrainWidth?: boolean;
};

export const PageShell: React.FC<PageShellProps> = ({
  children,
  className,
  constrainWidth = true,
}) => {
  return (
    <div className={cn("min-h-screen bg-shell text-text-primary", className)}>
      <div
        className={cn(
          constrainWidth ? "max-w-5xl mx-auto w-full" : "w-full",
          "px-6 py-8",
        )}
      >
        {children}
      </div>
    </div>
  );
};
