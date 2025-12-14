import * as React from "react";
import { cn } from "../../lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, description, actions, children, ...props }, ref) => {
    const hasHeader = title || description || actions;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border-subtle bg-surface shadow-card",
          className,
        )}
        {...props}
      >
        {hasHeader ? (
          <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
            <div className="space-y-1">
              {title ? (
                <h3 className="text-lg font-semibold text-text-primary font-heading leading-6">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="text-sm text-text-muted">{description}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex items-center gap-2">{actions}</div>
            ) : null}
          </div>
        ) : null}
        <div className={cn(hasHeader ? "p-5 pt-4" : "p-5")}>{children}</div>
      </div>
    );
  },
);
Card.displayName = "Card";
