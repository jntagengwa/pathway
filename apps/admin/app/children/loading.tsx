/**
 * Loading UI for children routes (list and detail).
 * Shown during navigation to /children or /children/[childId].
 */
export default function ChildrenLoading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        <span className="text-sm text-text-muted">Loading…</span>
      </div>
    </div>
  );
}
