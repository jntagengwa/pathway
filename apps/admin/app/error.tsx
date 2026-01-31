"use client";

import React from "react";
import { Button } from "@pathway/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold text-text-primary">Something went wrong</h2>
      <p className="text-sm text-text-muted text-center max-w-md">
        {error.message}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
