"use client";

import { useEffect } from "react";
import { captureFirstTouchIfNeeded } from "../lib/attribution";

/**
 * Client component that captures first-touch attribution on mount.
 * Should be included in the root layout or marketing layout.
 */
export default function AnalyticsProvider() {
  useEffect(() => {
    captureFirstTouchIfNeeded();
  }, []);

  return null;
}

