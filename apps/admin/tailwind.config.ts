import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "rgb(var(--pw-bg-shell) / <alpha-value>)",
        surface: "rgb(var(--pw-bg-surface) / <alpha-value>)",
        muted: "rgb(var(--pw-bg-muted) / <alpha-value>)",
        accent: {
          primary: "rgb(var(--pw-accent-primary) / <alpha-value>)",
          subtle: "rgb(var(--pw-accent-subtle) / <alpha-value>)",
          strong: "rgb(var(--pw-accent-strong) / <alpha-value>)",
          foreground: "rgb(var(--pw-accent-foreground) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--pw-text-primary) / <alpha-value>)",
          muted: "rgb(var(--pw-text-muted) / <alpha-value>)",
          inverse: "rgb(var(--pw-text-inverse) / <alpha-value>)",
        },
        border: {
          subtle: "rgb(var(--pw-border-subtle) / <alpha-value>)",
          strong: "rgb(var(--pw-border-strong) / <alpha-value>)",
        },
        status: {
          ok: "rgb(var(--pw-status-ok) / <alpha-value>)",
          warn: "rgb(var(--pw-status-warn) / <alpha-value>)",
          danger: "rgb(var(--pw-status-danger) / <alpha-value>)",
          info: "rgb(var(--pw-status-info) / <alpha-value>)",
        },
      },
      fontFamily: {
        heading: [
          "var(--font-heading)",
          "Nunito",
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: [
          "var(--font-body)",
          "Quicksand",
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0px 10px 30px rgba(15, 23, 42, 0.06)",
        soft: "0px 4px 12px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
