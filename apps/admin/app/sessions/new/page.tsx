"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label, Select } from "@pathway/ui";
import {
  AdminSessionFormValues,
  createSession,
  fetchGroups,
  type GroupOption,
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
  const [groups, setGroups] = React.useState<GroupOption[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] =
    React.useState<Partial<Record<keyof AdminSessionFormValues, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchGroups({ activeOnly: true })
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  const handleChange = (
    key: keyof AdminSessionFormValues,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nextErrors: typeof fieldErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    const startMs = Date.parse(form.startsAt);
    const endMs = Date.parse(form.endsAt);
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
      const created = await createSession({
        ...form,
        groupId: form.groupId || undefined,
      });
      router.push(created?.id ? `/sessions/${created.id}` : "/sessions");
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
          onClick={() => router.push("/sessions")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sessions
        </Button>
      </div>

      <Card
        title="New session"
        description="Create a new session in the rota."
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
            {fieldErrors.title ? (
              <p className="text-xs text-status-danger">{fieldErrors.title}</p>
            ) : (
            <p className="text-xs text-text-muted">
                A short label shown to staff when scheduling and marking
                attendance.
            </p>
            )}
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

