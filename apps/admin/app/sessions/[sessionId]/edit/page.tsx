"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@pathway/ui";
import {
  AdminSessionFormValues,
  AdminSessionDetail,
  fetchSessionById,
  updateSession,
} from "../../../../lib/api-client";

export default function EditSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [session, setSession] = React.useState<AdminSessionDetail | null>(null);
  const [form, setForm] = React.useState<AdminSessionFormValues | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSessionById(sessionId);
        if (!result) {
          setError("Session not found.");
          setSession(null);
          setForm(null);
        } else {
          setSession(result);
          setForm({
            title: result.title,
            startsAt: result.startsAt.slice(0, 16),
            endsAt: result.endsAt.slice(0, 16),
            groupId: undefined,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session.");
        setSession(null);
        setForm(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [sessionId]);

  const handleChange = (key: keyof AdminSessionFormValues, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.startsAt || !form.endsAt) {
      setError("Start and end time are required.");
      return;
    }
    if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
      setError("End time must be after start time.");
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
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update session. Please try again.",
      );
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
        <Badge variant="secondary">Based on UpdateSessionDto</Badge>
      </div>

      <Card
        title="Edit session"
        description="Update the session title or timings."
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
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="group">Group / class</Label>
              <Input
                id="group"
                value={form.groupId ?? ""}
                onChange={(e) => handleChange("groupId", e.target.value)}
                placeholder="e.g. group UUID"
              />
              <p className="text-xs text-text-muted">
                TODO: replace with a group selector once available.
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

