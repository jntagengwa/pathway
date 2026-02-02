"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label, Select } from "@pathway/ui";
import {
  AdminSessionFormValues,
  fetchSessionById,
  updateSession,
  fetchGroups,
  type GroupOption,
} from "../../../../lib/api-client";

export default function EditSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [form, setForm] = React.useState<AdminSessionFormValues | null>(null);
  const [groups, setGroups] = React.useState<GroupOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] =
    React.useState<Partial<Record<keyof AdminSessionFormValues, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchGroups({ activeOnly: true })
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSessionById(sessionId);
        if (!result) {
          setError("Session not found.");
          setForm(null);
        } else {
          const r = result as { groupId?: string | null };
          setForm({
            title: result.title,
            startsAt: result.startsAt.slice(0, 16),
            endsAt: result.endsAt.slice(0, 16),
            groupId: r.groupId ?? "",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session.");
        setForm(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [sessionId]);

  const handleChange = (key: keyof AdminSessionFormValues, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);

    const nextErrors: typeof fieldErrors = {};
    const startMs = form.startsAt ? Date.parse(form.startsAt) : NaN;
    const endMs = form.endsAt ? Date.parse(form.endsAt) : NaN;
    if (!form.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!form.startsAt || Number.isNaN(startMs)) {
      nextErrors.startsAt = "Enter a valid start time.";
    }
    if (!form.endsAt || Number.isNaN(endMs)) {
      nextErrors.endsAt = "Enter a valid end time.";
    } else if (!Number.isNaN(startMs) && endMs <= startMs) {
      nextErrors.endsAt = "End time must be after start time.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await updateSession(sessionId, {
        ...form,
        groupId: form.groupId || undefined,
      });
      router.push(`/sessions/${sessionId}`);
    } catch (err) {
      setError("We couldn’t save this session. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/sessions/${sessionId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to session
        </Button>
      </div>

      <Card
        title="Edit session"
        description="Update details for this session."
      >
        {error ? (
          <div className="mb-4 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        ) : null}

        {loading || !form ? (
          <div className="space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
              {fieldErrors.title ? (
                <p className="text-xs text-status-danger">{fieldErrors.title}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="startsAt">Start time</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => handleChange("startsAt", e.target.value)}
                  required
                />
                {fieldErrors.startsAt ? (
                  <p className="text-xs text-status-danger">
                    {fieldErrors.startsAt}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="endsAt">End time</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => handleChange("endsAt", e.target.value)}
                  required
                />
                {fieldErrors.endsAt ? (
                  <p className="text-xs text-status-danger">
                    {fieldErrors.endsAt}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="group">Group / class</Label>
              <Select
                id="group"
                value={form.groupId ?? ""}
                onChange={(e) => handleChange("groupId", e.target.value)}
              >
                <option value="">None</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-text-muted">
                Assign this session to a class. Manage classes from the Classes
                page.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/sessions/${sessionId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating…" : "Update session"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

