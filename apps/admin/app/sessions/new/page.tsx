"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@pathway/ui";
import {
  AdminSessionFormValues,
  createSession,
} from "../../../lib/api-client";

const defaultStart = () => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString().slice(0, 16);
};

const defaultEnd = () => {
  const end = new Date();
  end.setHours(end.getHours() + 1);
  end.setMinutes(0, 0, 0);
  return end.toISOString().slice(0, 16);
};

export default function NewSessionPage() {
  const router = useRouter();
  const [form, setForm] = React.useState<AdminSessionFormValues>({
    title: "",
    startsAt: defaultStart(),
    endsAt: defaultEnd(),
    groupId: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleChange = (
    key: keyof AdminSessionFormValues,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const created = await createSession({
        ...form,
        groupId: form.groupId || undefined,
      });
      router.push(created?.id ? `/sessions/${created.id}` : "/sessions");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create session. Please try again.",
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
          onClick={() => router.push("/sessions")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sessions
        </Button>
        <Badge variant="secondary">Based on CreateSessionDto</Badge>
      </div>

      <Card
        title="Create session"
        description="Set up a new session with date, time, and group details."
      >
        {error ? (
          <div className="mb-4 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        ) : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Year 3 Maths"
              required
            />
            <p className="text-xs text-text-muted">
              A short label shown to staff when scheduling and marking attendance.
            </p>
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

          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location / room</Label>
              <Input
                id="location"
                placeholder="Optional room name"
                onChange={() => {
                  // Placeholder: location not part of DTO yet.
                }}
              />
              <p className="text-xs text-text-muted">
                Room is informational only and not yet persisted.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/sessions")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create session"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

