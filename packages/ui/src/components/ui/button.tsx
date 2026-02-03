import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-info focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-primary text-text-inverse hover:bg-accent-strong shadow-soft motion-safe:hover:shadow-md",
        secondary:
          "bg-surface text-text-primary border border-border-subtle hover:bg-muted motion-safe:hover:shadow-sm",
        outline:
          "border border-border-subtle text-text-primary bg-transparent hover:bg-muted motion-safe:hover:shadow-sm",
        ghost: "bg-transparent text-text-primary hover:bg-muted",
        destructive:
          "bg-status-danger text-text-inverse hover:bg-status-danger/90 shadow-soft motion-safe:hover:shadow-md",
        success:
          "bg-status-ok text-text-inverse hover:bg-status-ok/90 shadow-soft motion-safe:hover:shadow-md",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
