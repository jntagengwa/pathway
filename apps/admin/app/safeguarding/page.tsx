"use client";

import React from "react";
import { Badge, Button, Card, DataTable, type ColumnDef } from "@pathway/ui";
import {
  AdminConcernRow,
  AdminNotesSummary,
  fetchNotesSummary,
  fetchOpenConcerns,
} from "../../lib/api-client";

const statusTone: Record<
  AdminConcernRow["status"],
  "warning" | "accent" | "success" | "default"
> = {
  open: "warning",
  in_review: "accent",
  closed: "success",
  other: "default",
};

export default function SafeguardingPage() {
  const [concerns, setConcerns] = React.useState<AdminConcernRow[]>([]);
  const [notesSummary, setNotesSummary] =
    React.useState<AdminNotesSummary | null>(null);
  const [isLoadingConcerns, setIsLoadingConcerns] = React.useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = React.useState(true);
  const [concernError, setConcernError] = React.useState<string | null>(null);
  const [notesError, setNotesError] = React.useState<string | null>(null);

  const loadConcerns = React.useCallback(async () => {
    setIsLoadingConcerns(true);
    setConcernError(null);
    try {
      const result = await fetchOpenConcerns();
      setConcerns(result);
    } catch (err) {
      setConcernError(
        err instanceof Error ? err.message : "Failed to load concerns",
      );
    } finally {
      setIsLoadingConcerns(false);
    }
  }, []);

  const loadNotes = React.useCallback(async () => {
    setIsLoadingNotes(true);
    setNotesError(null);
    try {
      const result = await fetchNotesSummary();
      setNotesSummary(result);
    } catch (err) {
      setNotesError(
        err instanceof Error ? err.message : "Failed to load notes summary",
      );
    } finally {
      setIsLoadingNotes(false);
    }
  }, []);

  React.useEffect(() => {
    void loadConcerns();
    void loadNotes();
  }, [loadConcerns, loadNotes]);

  const columns = React.useMemo<ColumnDef<AdminConcernRow>[]>(
    () => [
      {
        id: "created",
        header: "Created",
        cell: (row) => (
          <span className="text-sm text-text-muted">
            {new Date(row.createdAt).toLocaleString()}
          </span>
        ),
        width: "180px",
      },
      {
        id: "child",
        header: "Child",
        // SAFEGUARDING: childLabel is initials/generic only.
        cell: (row) => (
          <span className="text-sm font-semibold text-text-primary">
            {row.childLabel}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={statusTone[row.status]} className="capitalize">
            {row.status.replace("_", " ")}
          </Badge>
        ),
        width: "130px",
        align: "center",
      },
      {
        id: "category",
        header: "Category",
        cell: (row) => (
          <span className="text-sm text-text-muted">
            {row.category ?? "—"}
          </span>
        ),
        width: "140px",
      },
      {
        id: "reportedBy",
        header: "Reported by",
        cell: (row) => (
          <span className="text-sm text-text-muted">
            {row.reportedByLabel ?? "—"}
          </span>
        ),
        width: "140px",
      },
    ],
    [],
  );

  const concernContent = () => {
    if (isLoadingConcerns) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface px-3 py-3"
            >
              <div className="flex flex-col gap-2">
                <span className="h-3 w-32 animate-pulse rounded bg-muted" />
                <span className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
              <span className="h-5 w-14 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      );
    }
    if (concernError) {
      return (
        <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-4 text-sm text-status-danger">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              Couldn’t load concerns right now.
            </span>
            <Button size="sm" variant="secondary" onClick={loadConcerns}>
              Retry
            </Button>
          </div>
          <p className="text-xs text-text-muted">{concernError}</p>
        </div>
      );
    }
    if (concerns.length === 0) {
      return (
        <p className="text-sm text-text-muted">
          No open concerns recorded for this organisation.
        </p>
      );
    }
    return (
      <DataTable
        data={concerns}
        columns={columns}
        isLoading={false}
        emptyMessage="No open concerns."
      />
    );
  };

  const notesContent = () => {
    if (isLoadingNotes) {
      return (
        <div className="space-y-2">
          <span className="block h-3 w-32 animate-pulse rounded bg-muted" />
          <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      );
    }
    if (notesError) {
      return (
        <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-4 text-sm text-status-danger">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Couldn’t load notes summary.</span>
            <Button size="sm" variant="secondary" onClick={loadNotes}>
              Retry
            </Button>
          </div>
          <p className="text-xs text-text-muted">{notesError}</p>
        </div>
      );
    }
    if (!notesSummary) {
      return (
        <p className="text-sm text-text-muted">
          Positive notes and pastoral records will be summarised here in a future
          update.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-border-subtle bg-surface px-3 py-2">
          <p className="text-xs text-text-muted">Total notes</p>
          <p className="text-lg font-semibold text-text-primary">
            {notesSummary.totalNotes}
          </p>
        </div>
        <div className="rounded-md border border-border-subtle bg-surface px-3 py-2">
          <p className="text-xs text-text-muted">Visible to parents</p>
          <p className="text-lg font-semibold text-text-primary">
            {notesSummary.visibleToParents}
          </p>
        </div>
        <div className="rounded-md border border-border-subtle bg-surface px-3 py-2">
          <p className="text-xs text-text-muted">Staff-only</p>
          <p className="text-lg font-semibold text-text-primary">
            {notesSummary.staffOnly}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            Safeguarding & Wellbeing
          </h1>
          <p className="text-sm text-text-muted">
            High-level overview for safeguarding leads and admins.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            SAFEGUARDING: metadata-only. Do NOT show free-text concern/note content in this overview.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Open Concerns">
          {concernContent()}
        </Card>
        <Card title="Positive Notes & Wellbeing Summary">
          {notesContent()}
          <p className="mt-3 text-xs text-text-muted">
            {/* TODO: Wire richer notes summary once backend exposes aggregate-friendly fields. */}
            TODO: Wire richer notes summary once backend exposes aggregate-friendly fields.
          </p>
        </Card>
      </div>
    </div>
  );
}
