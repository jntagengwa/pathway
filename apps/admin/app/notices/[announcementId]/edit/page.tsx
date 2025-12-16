"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Textarea,
  Select,
} from "@pathway/ui";
import {
  AdminAnnouncementFormValues,
  AdminAnnouncementDetail,
  fetchAnnouncementById,
  updateAnnouncement,
} from "../../../../lib/api-client";

type AudienceOption = "ALL" | "PARENTS" | "STAFF";
type SendMode = "draft" | "now" | "schedule";

const audienceFromLabel = (label?: string | null): AudienceOption => {
  if (!label) return "ALL";
  const l = label.toLowerCase();
  if (l.includes("parent")) return "PARENTS";
  if (l.includes("staff")) return "STAFF";
  return "ALL";
};

const sendModeFromDetail = (
  detail: AdminAnnouncementDetail,
): { mode: SendMode; scheduledAt?: string } => {
  if (detail.status === "scheduled" || detail.scheduledAt) {
    return { mode: "schedule", scheduledAt: detail.scheduledAt ?? undefined };
  }
  if (detail.status === "sent") return { mode: "now" };
  return { mode: "draft" };
};

export default function EditNoticePage() {
  const params = useParams<{ announcementId: string }>();
  const router = useRouter();
  const announcementId = params.announcementId;

  const [announcement, setAnnouncement] =
    React.useState<AdminAnnouncementDetail | null>(null);
  const [form, setForm] = React.useState<AdminAnnouncementFormValues | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchAnnouncementById(announcementId);
        if (!detail) {
          setError("Notice not found.");
          setForm(null);
          setAnnouncement(null);
        } else {
          const delivery = sendModeFromDetail(detail);
          setAnnouncement(detail);
          setForm({
            title: detail.title ?? "",
            body: detail.body ?? "",
            audience: audienceFromLabel(detail.audienceLabel),
            sendMode: delivery.mode,
            scheduledAt: delivery.scheduledAt ?? "",
            channels: detail.channels ?? ["in-app"],
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load notice details.",
        );
        setForm(null);
        setAnnouncement(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [announcementId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required.");
      return;
    }
    if (form.sendMode === "schedule" && !form.scheduledAt) {
      setError("Please pick a scheduled time.");
      return;
    }
    setSubmitting(true);
    try {
      await updateAnnouncement(announcementId, {
        ...form,
        scheduledAt: form.scheduledAt || undefined,
      });
      router.push(`/notices/${announcementId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notice. Please try again.",
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
          onClick={() => router.push(`/notices/${announcementId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to notice
        </Button>
        <Badge variant="secondary">Based on UpdateAnnouncementDto</Badge>
      </div>

      <Card
        title="Edit notice"
        description="Update the content or delivery schedule. Provider payloads remain server-side."
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) =>
                  setForm((prev) => (prev ? { ...prev, body: e.target.value } : prev))
                }
                rows={6}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="audience">Audience</Label>
                <Select
                  id="audience"
                  value={form.audience}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, audience: e.target.value as AudienceOption }
                        : prev,
                    )
                  }
                >
                  <option value="ALL">Parents & staff</option>
                  <option value="PARENTS">Parents / guardians</option>
                  <option value="STAFF">Staff</option>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Delivery</Label>
                <div className="flex flex-col gap-2 text-sm text-text-primary">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="sendMode"
                    className="h-4 w-4 rounded-full border border-border-subtle text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                      value="draft"
                      checked={form.sendMode === "draft"}
                      onChange={() =>
                        setForm((prev) => (prev ? { ...prev, sendMode: "draft" } : prev))
                      }
                    />
                    Save as draft
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="sendMode"
                    className="h-4 w-4 rounded-full border border-border-subtle text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                      value="now"
                      checked={form.sendMode === "now"}
                      onChange={() =>
                        setForm((prev) => (prev ? { ...prev, sendMode: "now" } : prev))
                      }
                    />
                    Send now
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="sendMode"
                    className="h-4 w-4 rounded-full border border-border-subtle text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                      value="schedule"
                      checked={form.sendMode === "schedule"}
                      onChange={() =>
                        setForm((prev) =>
                          prev ? { ...prev, sendMode: "schedule" } : prev,
                        )
                      }
                    />
                    Schedule
                  </label>
                  {form.sendMode === "schedule" ? (
                    <Input
                      type="datetime-local"
                      value={form.scheduledAt ?? ""}
                      onChange={(e) =>
                        setForm((prev) =>
                          prev ? { ...prev, scheduledAt: e.target.value } : prev,
                        )
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-3 text-sm text-text-primary">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-border-subtle text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                    checked={form.channels?.includes("email") ?? false}
                    onChange={(e) =>
                      setForm((prev) => {
                        if (!prev) return prev;
                        const next = new Set(prev.channels ?? []);
                        if (e.target.checked) next.add("email");
                        else next.delete("email");
                        return { ...prev, channels: Array.from(next) };
                      })
                    }
                  />
                  Email
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-border-subtle text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                    checked={form.channels?.includes("in-app") ?? true}
                    onChange={(e) =>
                      setForm((prev) => {
                        if (!prev) return prev;
                        const next = new Set(prev.channels ?? []);
                        if (e.target.checked) next.add("in-app");
                        else next.delete("in-app");
                        return { ...prev, channels: Array.from(next) };
                      })
                    }
                  />
                  In-app
                </label>
                <span className="text-xs text-text-muted">
                  Channels are advisory; backend delivery rules still apply.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/notices/${announcementId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating…" : "Update notice"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

