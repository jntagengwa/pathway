"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
  createAnnouncement,
} from "../../../lib/api-client";

type AudienceOption = "ALL" | "PARENTS" | "STAFF";
type SendMode = "draft" | "now" | "schedule";

export default function NewNoticePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<AdminAnnouncementFormValues>({
    title: "",
    body: "",
    audience: "ALL",
    sendMode: "draft",
    scheduledAt: "",
    channels: ["in-app"],
  });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const created = await createAnnouncement({
        ...form,
        scheduledAt: form.scheduledAt || undefined,
      });
      router.push(created?.id ? `/notices/${created.id}` : "/notices");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create notice. Please try again.",
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
          onClick={() => router.push("/notices")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to notices
        </Button>
        <Badge variant="secondary">Based on CreateAnnouncementDto</Badge>
      </div>

      <Card
        title="Create notice"
        description="Send a message to parents and/or staff. Content only; provider payloads stay server-side."
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
              placeholder="e.g. Staff inset day reminder"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              rows={6}
              placeholder="Write the message to send…"
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
                  setForm((prev) => ({
                    ...prev,
                    audience: e.target.value as AudienceOption,
                  }))
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
                      setForm((prev) => ({ ...prev, sendMode: "draft" }))
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
                      setForm((prev) => ({ ...prev, sendMode: "now" }))
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
                      setForm((prev) => ({ ...prev, sendMode: "schedule" }))
                    }
                  />
                  Schedule
                </label>
                {form.sendMode === "schedule" ? (
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        scheduledAt: e.target.value,
                      }))
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
              onClick={() => router.push("/notices")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create notice"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

