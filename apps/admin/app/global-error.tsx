"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-shell p-8 font-sans">
        <div className="mx-auto max-w-md space-y-4">
          <h1 className="text-xl font-semibold text-slate-800">Something went wrong</h1>
          <p className="text-sm text-slate-600">{error.message}</p>
          <button
            onClick={reset}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
