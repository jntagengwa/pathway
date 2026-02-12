"use client";

import { useId } from "react";
import type { Question, SingleChoiceQuestion, NumericQuestion } from "../../lib/readiness-quiz/config";

interface QuizQuestionCardProps {
  question: Question;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  onContinue: () => void;
  onBack: () => void;
  canGoBack: boolean;
  validationError?: string;
}

export function QuizQuestionCard({
  question,
  value,
  onChange,
  onContinue,
  onBack,
  canGoBack,
  validationError,
}: QuizQuestionCardProps) {
  const id = useId();

  const handleSingleChoice = (q: SingleChoiceQuestion) => (
    <div
      role="radiogroup"
      aria-labelledby={`${id}-prompt`}
      className="grid gap-3 sm:grid-cols-2"
    >
      {q.options.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all focus-within:ring-2 focus-within:ring-accent-primary focus-within:ring-offset-2 ${
            value === opt.value
              ? "border-accent-primary bg-accent-subtle/30"
              : "border-border-subtle bg-surface hover:border-accent-primary/50 hover:bg-muted/30"
          }`}
        >
          <input
            type="radio"
            name={question.id}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 border-border-subtle text-accent-primary focus:ring-accent-primary"
          />
          <span className="text-sm font-medium text-text-primary">{opt.label}</span>
        </label>
      ))}
    </div>
  );

  const handleNumeric = (q: NumericQuestion) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          id={`${id}-input`}
          type="number"
          min={q.validation.min}
          max={q.validation.max}
          value={value !== undefined && value !== "" ? String(value) : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") onChange(undefined);
            else onChange(Number(v));
          }}
          placeholder={`e.g. ${q.validation.min}`}
          className="w-32 rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          aria-describedby={validationError ? `${id}-error` : undefined}
        />
        <span className="text-sm text-text-muted">{q.suffix}</span>
      </div>
      <p className="text-xs text-text-muted">
        Between {q.validation.min} and {q.validation.max}
      </p>
    </div>
  );

  const numericQ = question as NumericQuestion;
  const isValid =
    question.type !== "numeric"
      ? value !== undefined && value !== ""
      : typeof value === "number" &&
        !Number.isNaN(value) &&
        value >= numericQ.validation.min &&
        value <= numericQ.validation.max;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.type === "numeric") {
      const num = Number(value);
      const q = question as NumericQuestion;
      if (Number.isNaN(num) || num < q.validation.min || num > q.validation.max) {
        return;
      }
    }
    onContinue();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[20px] border border-border-subtle bg-surface p-6 shadow-soft sm:p-8">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent-foreground">
          {question.category}
        </span>
      </div>

      <h2
        id={`${id}-prompt`}
        className="mb-6 text-xl font-semibold text-text-primary sm:text-2xl"
      >
        {question.prompt}
      </h2>

      <div className="mb-6">
        {question.type === "single_choice"
          ? handleSingleChoice(question as SingleChoiceQuestion)
          : handleNumeric(question as NumericQuestion)}
      </div>

      {validationError && (
        <p id={`${id}-error`} className="mb-4 text-sm text-status-danger" role="alert">
          {validationError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-muted focus-visible:outline focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="submit"
          className="rounded-md bg-accent-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-accent-strong focus-visible:outline focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isValid}
        >
          Continue
        </button>
      </div>
    </form>
  );
}
