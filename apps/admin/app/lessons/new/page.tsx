"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button, Card, Input, Label, Textarea, Select } from "@pathway/ui";
import {
  AdminLessonFormValues,
  createLesson,
} from "../../../lib/api-client";
import { fetchGroups, type GroupOption } from "../../../lib/api-client";

const startOfWeekIso = () => {
  const d = new Date();
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day; // move to Monday
  d.setDate(d.getDate() + diff);
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
  const [fieldErrors, setFieldErrors] =
    React.useState<Partial<Record<keyof AdminLessonFormValues, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [groups, setGroups] = React.useState<GroupOption[]>([]);
  const [groupsError, setGroupsError] = React.useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = React.useState(true);

  React.useEffect(() => {
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
    void loadGroups();
  }, []);

  const handleFieldChange = (
    key: keyof AdminLessonFormValues,
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
      const created = await createLesson({
        ...form,
        groupId: form.groupId || undefined,
        fileKey: primaryResource,
        resources: cleanedResources,
      });
      router.push(created?.id ? `/lessons/${created.id}` : "/lessons");
    } catch (err) {
      setError("We couldn’t save this lesson. Try again.");
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
      </div>

      <Card
        title="New lesson"
        description="Capture lesson details for the timetable."
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
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="e.g. Year 4 Science - Habitats"
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
                required
              />
              {fieldErrors.weekOf ? (
                <p className="text-xs text-status-danger">{fieldErrors.weekOf}</p>
              ) : (
              <p className="text-xs text-text-muted">
                  Use the week’s start date. Maps to lesson weekOf.
              </p>
              )}
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
                  onChange={(e) => handleFieldChange("groupId", e.target.value)}
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
                    size="sm"
                    className="h-8 w-8 p-0"
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

