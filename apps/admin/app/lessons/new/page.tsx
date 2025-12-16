"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Badge, Button, Card, Input, Label, Textarea } from "@pathway/ui";
import {
  AdminLessonFormValues,
  createLesson,
} from "../../../lib/api-client";

const startOfWeekIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export default function NewLessonPage() {
  const router = useRouter();
  const [form, setForm] = React.useState<AdminLessonFormValues>({
    title: "",
    description: "",
    weekOf: startOfWeekIso(),
    groupId: "",
    resources: [],
  });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.weekOf) {
      setError("Week of date is required.");
      return;
    }
    setSubmitting(true);
    try {
      const primaryResource = form.resources?.[0]?.label;
      const created = await createLesson({
        ...form,
        groupId: form.groupId || undefined,
        fileKey: primaryResource,
      });
      router.push(created?.id ? `/lessons/${created.id}` : "/lessons");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create lesson. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const addResource = () => {
    setForm((prev) => ({
      ...prev,
      resources: [...(prev.resources ?? []), { label: "" }],
    }));
  };

  const updateResource = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...(prev.resources ?? [])];
      next[index] = { label: value };
      return { ...prev, resources: next };
    });
  };

  const removeResource = (index: number) => {
    setForm((prev) => {
      const next = [...(prev.resources ?? [])];
      next.splice(index, 1);
      return { ...prev, resources: next };
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/lessons")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to lessons
        </Button>
        <Badge variant="secondary">Based on CreateLessonDto</Badge>
      </div>

      <Card
        title="Create lesson"
        description="Capture lesson details for the timetable. Files are optional for now."
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Year 4 Science – Habitats"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="weekOf">Week of</Label>
              <Input
                id="weekOf"
                type="date"
                value={form.weekOf ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, weekOf: e.target.value }))
                }
                required
              />
              <p className="text-xs text-text-muted">
                This maps to CreateLessonDto.weekOf.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="groupId">Group / class</Label>
              <Input
                id="groupId"
                value={form.groupId ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, groupId: e.target.value }))
                }
                placeholder="e.g. group UUID"
              />
              <p className="text-xs text-text-muted">
                TODO: replace with a group picker when available.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Overview, learning objectives, materials…"
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Resources (labels only)</Label>
            <div className="space-y-2">
              {(form.resources ?? []).map((res, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={res.label}
                    onChange={(e) => updateResource(idx, e.target.value)}
                    placeholder="Resource label"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResource(idx)}
                    aria-label="Remove resource"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addResource}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add resource
              </Button>
              <p className="text-xs text-text-muted">
                Stored as fileKey in the backend; uploads will follow later.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/lessons")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create lesson"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

