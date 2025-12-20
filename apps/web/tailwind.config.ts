import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "pw-primary": "#2563eb",
        "pw-primary-soft": "#e0e7ff",
        "pw-surface": "#f8fafc",
        "pw-border": "#e5e7eb",
        "pw-text": "#0f172a",
        "pw-text-muted": "#475569",
        "pw-success": "#16a34a",
        "pw-warning": "#f59e0b",
        "pw-danger": "#dc2626",
      },
      fontFamily: {
        heading: ["var(--font-inter, Inter)", "system-ui", "sans-serif"],
        body: ["var(--font-inter, Inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

