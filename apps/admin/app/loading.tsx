/**
 * Root loading UI shown during route transitions.
 * Helps prevent React #310 "Rendered more hooks than during the previous render"
 * during navigation (known Next.js App Router issue with redirects/transitions).
 */
export default function Loading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        <span className="text-sm text-text-muted">Loading…</span>
      </div>
    </div>
  );
}
