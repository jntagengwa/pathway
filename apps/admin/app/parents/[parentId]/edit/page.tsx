"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label } from "@pathway/ui";
import {
  fetchParentById,
  updateParent,
  fetchChildren,
  type AdminParentDetail,
  type UpdateParentPayload,
} from "../../../../lib/api-client";

export default function EditParentPage() {
  const router = useRouter();
  const params = useParams();
  const parentId = typeof params.parentId === "string" ? params.parentId : "";
  const [parent, setParent] = React.useState<AdminParentDetail | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [childIds, setChildIds] = React.useState<string[]>([]);
  const [children, setChildren] = React.useState<{ id: string; fullName: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<string, string>>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!parentId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [parentData, childrenRes] = await Promise.all([
          fetchParentById(parentId),
          fetchChildren(),
        ]);
        if (!parentData) {
          setError("Parent not found");
          return;
        }
        setParent(parentData);
        setDisplayName(parentData.fullName || "");
        setChildIds(parentData.children?.map((c) => c.id) ?? []);
        setChildren(
          childrenRes.map((c) => ({
            id: c.id,
            fullName: c.fullName || "Child",
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load parent");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nextErrors: Partial<Record<string, string>> = {};
    if (!displayName?.trim()) {
      nextErrors.displayName = "Display name is required.";
    }
    if (displayName.trim().includes("@")) {
      nextErrors.displayName = "Do not use email as display name.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: UpdateParentPayload = {
        displayName: displayName.trim(),
        childIds,
      };
      await updateParent(parentId, payload);
      router.push(`/parents/${parentId}`);
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

  if (error && !parent) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/parents")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to parents
        </Button>
        <div className="rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!parent) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/parents/${parentId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to parent
        </Button>
      </div>

      <Card
        title="Edit parent"
        description="Update display name and linked children. Do not use email as name."
      >
        {error ? (
          <div className="mb-4 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        ) : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Display name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
              }}
              placeholder="e.g. Jane Smith"
              required
            />
            {fieldErrors.displayName ? (
              <p className="text-xs text-status-danger">{fieldErrors.displayName}</p>
            ) : null}
            <p className="text-xs text-text-muted">
              Email: {parent.email || "—"} (not editable here)
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Linked children</Label>
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              {children.length === 0 ? (
                <p className="text-sm text-text-muted">No children in this site.</p>
              ) : (
                children.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={childIds.includes(c.id)}
                      onChange={(e) => {
                        setChildIds((prev) =>
                          e.target.checked
                            ? [...prev, c.id]
                            : prev.filter((id) => id !== c.id),
                        );
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    {c.fullName}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/parents/${parentId}`)}
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
