"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Badge, Button, Card, Input, Label, Textarea } from "@pathway/ui";
import {
  AdminLessonFormValues,
  AdminLessonDetail,
  fetchLessonById,
  updateLesson,
} from "../../../../lib/api-client";

export default function EditLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = params.lessonId;

  const [lesson, setLesson] = React.useState<AdminLessonDetail | null>(null);
  const [form, setForm] = React.useState<AdminLessonFormValues | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLessonById(lessonId);
        if (!result) {
          setLesson(null);
          setForm(null);
          setError("Lesson not found.");
        } else {
          setLesson(result);
          setForm({
            title: result.title,
            description: result.description ?? "",
            weekOf: result.updatedAt ? result.updatedAt.slice(0, 10) : "",
            groupId: result.groupLabel ?? "",
            resources: result.resources.map((r) => ({ label: r.label })),
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load lesson details.",
        );
        setLesson(null);
        setForm(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const primaryResource = form.resources?.[0]?.label;
      await updateLesson(lessonId, {
        ...form,
        weekOf: form.weekOf || undefined,
        groupId: form.groupId || undefined,
        fileKey: primaryResource,
      });
      router.push(`/lessons/${lessonId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update lesson. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateResource = (index: number, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = [...(prev.resources ?? [])];
      next[index] = { label: value };
      return { ...prev, resources: next };
    });
  };

  const addResource = () => {
    setForm((prev) =>
      prev
        ? { ...prev, resources: [...(prev.resources ?? []), { label: "" }] }
        : prev,
    );
  };

  const removeResource = (index: number) => {
    setForm((prev) => {
      if (!prev) return prev;
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
          onClick={() => router.push(`/lessons/${lessonId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to lesson
        </Button>
        <Badge variant="secondary">Based on UpdateLessonDto</Badge>
      </div>

      <Card
        title="Edit lesson"
        description="Update lesson details. Files and uploads remain TODO."
      >
        {error ? (
          <div className="mb-4 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        ) : null}

        {loading || !form ? (
          <div className="space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                }
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
                    setForm((prev) =>
                      prev ? { ...prev, weekOf: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="groupId">Group / class</Label>
                <Input
                  id="groupId"
                  value={form.groupId ?? ""}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev ? { ...prev, groupId: e.target.value } : prev,
                    )
                  }
                  placeholder="e.g. group UUID"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev,
                  )
                }
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
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/lessons/${lessonId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating…" : "Update lesson"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

