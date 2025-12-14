import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-muted text-text-primary border-border-subtle",
        accent:
          "bg-accent-subtle text-accent-strong border border-accent-primary/30",
        success: "bg-status-ok/10 text-status-ok border border-status-ok/30",
        warning:
          "bg-status-warn/10 text-status-warn border border-status-warn/30",
        danger:
          "bg-status-danger/10 text-status-danger border border-status-danger/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
