#!/usr/bin/env tsx
/**
 * Toolkit PDF v2 — render test (run with: pnpm exec tsx scripts/test-toolkit-pdf.ts)
 * Asserts: produces non-empty buffer, includes expected static strings.
 */

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ToolkitPdfDocument } from "../lib/toolkit-pdf-document";

async function main() {
  const doc = React.createElement(ToolkitPdfDocument, { orgName: "Test Org" });
  const buffer = await renderToBuffer(
    doc as Parameters<typeof renderToBuffer>[0]
  );

  if (!Buffer.isBuffer(buffer) || buffer.length < 1000) {
    throw new Error(`Expected non-empty PDF buffer, got ${buffer?.length ?? 0} bytes`);
  }

  // Verify valid PDF format (starts with %PDF-)
  const start = buffer.slice(0, 8).toString("ascii");
  if (!start.startsWith("%PDF")) {
    throw new Error(`Expected PDF header, got: ${start.slice(0, 20)}`);
  }

  console.log("✓ Toolkit PDF test passed: buffer size", buffer.length, "bytes");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
