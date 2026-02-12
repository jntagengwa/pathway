"use client";

interface QuizHelperPanelProps {
  category?: string;
}

export function QuizHelperPanel({ category }: QuizHelperPanelProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h3 className="mb-2 text-sm font-semibold text-text-primary">Privacy Note</h3>
      <p className="text-sm text-text-muted">
        This assessment does not require child names or sensitive details. Use approximate
        answers.
      </p>
      {category && (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="text-xs font-medium text-text-muted">What this checks</p>
          <p className="mt-1 text-sm text-text-primary">{category}</p>
        </div>
      )}
    </div>
  );
}
