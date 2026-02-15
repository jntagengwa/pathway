"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label, Select } from "@pathway/ui";
import {
  fetchChildForEdit,
  updateChild,
  fetchGroups,
  fetchParents,
  type ChildEditFormData,
  type UpdateChildPayload,
} from "../../../../lib/api-client";

export default function EditChildPage() {
  const router = useRouter();
  const params = useParams();
  const childId = typeof params.childId === "string" ? params.childId : "";
  const [form, setForm] = React.useState<ChildEditFormData | null>(null);
  const [groups, setGroups] = React.useState<{ id: string; name: string }[]>([]);
  const [parents, setParents] = React.useState<{ id: string; fullName: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<string, string>>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!childId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [childData, groupsRes, parentsRes] = await Promise.all([
          fetchChildForEdit(childId),
          fetchGroups({ activeOnly: true }),
          fetchParents(),
        ]);
        if (!childData) {
          setError("Child not found");
          return;
        }
        setForm(childData);
        setGroups(groupsRes);
        setParents(
          parentsRes.map((p) => ({ id: p.id, fullName: p.fullName || p.email || "Unknown" })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load child");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [childId]);

  const handleChange = (
    key: keyof ChildEditFormData,
    value: string | string[] | boolean | null,
  ) => {
    if (!form) return;
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);

    const nextErrors: Partial<Record<string, string>> = {};
    if (!form.firstName?.trim()) {
      nextErrors.firstName = "First name is required.";
    }
    if (!form.lastName?.trim()) {
      nextErrors.lastName = "Last name is required.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: UpdateChildPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        preferredName: form.preferredName?.trim() || null,
        allergies: form.allergies?.trim() || "none",
        photoConsent: form.photoConsent,
        groupId: form.groupId || null,
        guardianIds: form.guardianIds,
      };
      await updateChild(childId, payload);
      router.push(`/children/${childId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/children")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to children
        </Button>
        <div className="rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/children/${childId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to child
        </Button>
      </div>

      <Card
        title="Edit child"
        description="Update core child details. Safeguarding-sensitive fields are not editable here."
      >
        {error ? (
          <div className="mb-4 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        ) : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
              {fieldErrors.firstName ? (
                <p className="text-xs text-status-danger">{fieldErrors.firstName}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
              {fieldErrors.lastName ? (
                <p className="text-xs text-status-danger">{fieldErrors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="preferredName">Preferred name</Label>
            <Input
              id="preferredName"
              value={form.preferredName ?? ""}
              onChange={(e) =>
                handleChange("preferredName", e.target.value || null)
              }
              placeholder="If different from first name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="allergies">Allergies / key medical needs</Label>
            <Input
              id="allergies"
              value={form.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
              placeholder="e.g. none, peanuts, asthma"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="photoConsent">Photo consent</Label>
            <Select
              id="photoConsent"
              value={form.photoConsent ? "yes" : "no"}
              onChange={(e) => handleChange("photoConsent", e.target.value === "yes")}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="groupId">Primary group / class</Label>
            <Select
              id="groupId"
              value={form.groupId ?? ""}
              onChange={(e) =>
                handleChange("groupId", e.target.value || null)
              }
            >
              <option value="">Unassigned</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Linked guardians (parents)</Label>
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              {parents.length === 0 ? (
                <p className="text-sm text-text-muted">No parents in this site.</p>
              ) : (
                parents.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.guardianIds.includes(p.id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.guardianIds, p.id]
                          : form.guardianIds.filter((id) => id !== p.id);
                        handleChange("guardianIds", next);
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    {p.fullName}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/children/${childId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
