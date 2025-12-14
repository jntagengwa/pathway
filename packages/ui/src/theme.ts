export type ColorTokens = {
  bg: {
    shell: string;
    surface: string;
    muted: string;
  };
  text: {
    primary: string;
    muted: string;
    inverse: string;
  };
  accent: {
    primary: string;
    subtle: string;
    strong: string;
  };
  border: {
    subtle: string;
    strong: string;
  };
  status: {
    ok: string;
    warn: string;
    danger: string;
    info: string;
  };
  focus: string;
};

export type TypographyTokens = {
  fontFamily: {
    heading: string;
    body: string;
  };
  heading: {
    xl: { size: string; lineHeight: string; weight: number };
    lg: { size: string; lineHeight: string; weight: number };
    md: { size: string; lineHeight: string; weight: number };
  };
  body: { size: string; lineHeight: string; weight: number };
  label: { size: string; lineHeight: string; weight: number };
  caption: { size: string; lineHeight: string; weight: number };
};

export type SpacingTokens = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
};

export type RadiusTokens = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

export type ShadowTokens = {
  card: string;
  soft: string;
};

export type LayoutTokens = {
  maxWidth: string;
  sidebarWidth: string;
  topBarHeight: string;
};

export type Theme = {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadow: ShadowTokens;
  layout: LayoutTokens;
};

export const theme: Theme = {
  colors: {
    bg: {
      shell: "#f4f6f8",
      surface: "#ffffff",
      muted: "#eef2f6",
    },
    text: {
      primary: "#0f172a",
      muted: "#475569",
      inverse: "#ffffff",
    },
    accent: {
      primary: "#17b89e",
      subtle: "#d7f5ee",
      strong: "#0f9d82",
    },
    border: {
      subtle: "#e2e8f0",
      strong: "#cbd5e1",
    },
    status: {
      ok: "#22c55e",
      warn: "#f59e0b",
      danger: "#ef4444",
      info: "#3b82f6",
    },
    focus: "#0ea5e9",
  },
  typography: {
    fontFamily: {
      heading:
        '"Nunito", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
      body: '"Quicksand", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    },
    heading: {
      xl: { size: "28px", lineHeight: "36px", weight: 700 },
      lg: { size: "24px", lineHeight: "32px", weight: 700 },
      md: { size: "20px", lineHeight: "28px", weight: 600 },
    },
    body: { size: "16px", lineHeight: "24px", weight: 500 },
    label: { size: "14px", lineHeight: "20px", weight: 600 },
    caption: { size: "12px", lineHeight: "16px", weight: 500 },
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 40,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadow: {
    card: "0px 10px 30px rgba(15, 23, 42, 0.06)",
    soft: "0px 4px 12px rgba(15, 23, 42, 0.04)",
  },
  layout: {
    maxWidth: "1200px",
    sidebarWidth: "260px",
    topBarHeight: "64px",
  },
};

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
