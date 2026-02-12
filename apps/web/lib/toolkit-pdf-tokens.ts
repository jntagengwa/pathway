/**
 * Design tokens for Nexsteps Toolkit PDF (v2).
 * Print-safe, grayscale-friendly, WCAG-minded.
 * A4 portrait, margins 24mm. Use Helvetica (built-in); Inter requires Font.register.
 */

export const TOOLKIT_TOKENS = {
  // Layout (pt; 1mm ≈ 2.83pt)
  pageMargin: 68, // 24mm
  pageMarginBottom: 55, // ~19mm
  sectionGap: 10,
  boxPadding: 9,
  boxPaddingSmall: 8,

  // Typography (pt)
  fontFamily: "Helvetica",
  h1Size: 19,
  h2Size: 12.5,
  bodySize: 10.5,
  helperSize: 9,
  lineHeight: 1.4,

  // Colors (print-safe)
  primary: "#111111",
  secondary: "#444444",
  muted: "#666666",
  border: "#D6D6D6",
  lightFill: "#F5F6F7",

  // Boxes
  borderWidth: 1,
  borderRadius: 0, // react-pdf radius can be unreliable; use 0 for consistency
} as const;
