/**
 * First-touch attribution capture and retrieval.
 * Stores UTM parameters and referrer on first visit.
 */

import type { AnalyticsUtm } from "./analytics";

export type FirstTouchAttribution = {
  utm: AnalyticsUtm;
  referrer?: string | null;
  landingPath: string;
  capturedAt: string; // ISO date
};

const STORAGE_KEY = "nexsteps_utm_first_touch";

/**
 * Parse UTM parameters from current URL.
 */
function parseUtmParams(): AnalyticsUtm {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const utm: AnalyticsUtm = {};

  const source = params.get("utm_source");
  if (source) utm.source = source;

  const medium = params.get("utm_medium");
  if (medium) utm.medium = medium;

  const campaign = params.get("utm_campaign");
  if (campaign) utm.campaign = campaign;

  const term = params.get("utm_term");
  if (term) utm.term = term;

  const content = params.get("utm_content");
  if (content) utm.content = content;

  return utm;
}

/**
 * Capture first-touch attribution if not already stored.
 * Should be called once per browser session on first page load.
 */
export function captureFirstTouchIfNeeded(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Check if already captured
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return; // Already captured
    }
  } catch (err) {
    console.warn("[Attribution] Failed to check localStorage:", err);
    return;
  }

  // Parse UTM params
  const utm = parseUtmParams();

  // Only store if we have at least one UTM parameter or a referrer
  const hasUtm = Boolean(utm.source || utm.medium || utm.campaign || utm.term || utm.content);
  const referrer = document.referrer || null;

  if (!hasUtm && !referrer) {
    return; // Nothing to store
  }

  // Create attribution record
  const attribution: FirstTouchAttribution = {
    utm,
    referrer,
    landingPath: window.location.pathname,
    capturedAt: new Date().toISOString(),
  };

  // Store in localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch (err) {
    console.warn("[Attribution] Failed to store attribution:", err);
  }
}

/**
 * Get stored first-touch attribution.
 * Returns null if not found or invalid.
 */
export function getFirstTouchAttribution(): FirstTouchAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as FirstTouchAttribution;

    // Validate structure
    if (
      typeof parsed !== "object" ||
      !parsed.utm ||
      typeof parsed.landingPath !== "string" ||
      typeof parsed.capturedAt !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn("[Attribution] Failed to parse attribution:", err);
    return null;
  }
}

