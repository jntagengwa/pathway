"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button, Card, Input, Label, Textarea, Select } from "@pathway/ui";
import {
  AdminLessonFormValues,
  fetchLessonById,
  updateLesson,
} from "../../../../lib/api-client";
import { fetchGroups, type GroupOption } from "../../../../lib/api-client";

export default function EditLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = params.lessonId;

  const [form, setForm] = React.useState<AdminLessonFormValues | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fieldErrors, setFieldErrors] =
    React.useState<Partial<Record<keyof AdminLessonFormValues, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [groups, setGroups] = React.useState<GroupOption[]>([]);
  const [groupsError, setGroupsError] = React.useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = React.useState(true);
  const [legacyGroupLabel, setLegacyGroupLabel] = React.useState<string | null>(
    null,
  );

  const handleFieldChange = (
    key: keyof AdminLessonFormValues,
    value: string,
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLessonById(lessonId);
        if (!result) {
          setForm(null);
          setError("Lesson not found.");
        } else {
          setForm({
            title: result.title,
            description: result.description ?? "",
            weekOf: result.weekOf ? result.weekOf.slice(0, 10) : "",
            groupId: (result as any).groupId ?? "",
            resources: result.resources.map((r) => ({ label: r.label })),
          });
          if (!(result as any).groupId && result.groupLabel) {
            setLegacyGroupLabel(result.groupLabel);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load lesson details.",
        );
        setForm(null);
      } finally {
        setLoading(false);
      }
    };
    const loadGroups = async () => {
      setGroupsLoading(true);
      setGroupsError(null);
      try {
        const result = await fetchGroups({ activeOnly: true });
        setGroups(result);
      } catch (err) {
        setGroupsError(
          err instanceof Error ? err.message : "Failed to load groups",
        );
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };
    void load();
    void loadGroups();
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    const nextErrors: typeof fieldErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!form.weekOf) {
      nextErrors.weekOf = "Week of date is required.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const cleanedResources =
      form.resources?.map((r) => ({ label: r.label.trim() })).filter((r) => r.label) ?? [];
    setSubmitting(true);
    try {
      const primaryResource = cleanedResources[0]?.label;
      await updateLesson(lessonId, {
        ...form,
        weekOf: form.weekOf || undefined,
        groupId: form.groupId || undefined,
        fileKey: primaryResource,
        resources: cleanedResources,
      });
      router.push(`/lessons/${lessonId}`);
    } catch (err) {
      setError("We couldn’t save this lesson. Try again.");
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
      </div>

      <Card
        title="Edit lesson"
        description="Update lesson details for staff."
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
                onChange={(e) => handleFieldChange("title", e.target.value)}
                required
              />
              {fieldErrors.title ? (
                <p className="text-xs text-status-danger">{fieldErrors.title}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="weekOf">Week of</Label>
                <Input
                  id="weekOf"
                  type="date"
                  value={form.weekOf ?? ""}
                onChange={(e) => handleFieldChange("weekOf", e.target.value)}
                />
                {fieldErrors.weekOf ? (
                  <p className="text-xs text-status-danger">{fieldErrors.weekOf}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="groupId">Group / class</Label>
                {groupsLoading ? (
                  <Input
                    id="groupId"
                    disabled
                    placeholder="Loading groups…"
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    id="groupId"
                    value={form.groupId ?? ""}
                    onChange={(e) =>
                      handleFieldChange("groupId", e.target.value)
                    }
                  >
                    <option value="">Select a group…</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </Select>
                )}
                {groupsError ? (
                  <p className="text-xs text-status-danger">
                    {groupsError} — you can retry by refreshing the page.
                  </p>
                ) : legacyGroupLabel ? (
                  <p className="text-xs text-text-muted">
                    Previously saved as “{legacyGroupLabel}”. Choose a current
                    group to update this lesson.
                  </p>
                ) : (
                  <p className="text-xs text-text-muted">
                    Choose the group or class this lesson belongs to.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
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
                      size="sm"
                      onClick={() => removeResource(idx)}
                      aria-label="Remove resource"
                      className="h-8 w-8 p-0"
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

