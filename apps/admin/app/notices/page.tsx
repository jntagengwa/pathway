"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card, DataTable, type ColumnDef } from "@pathway/ui";
import { AdminAnnouncementRow, fetchAnnouncements } from "../../lib/api-client";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoticesPage() {
  const [data, setData] = React.useState<AdminAnnouncementRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAnnouncements();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load announcements",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns = React.useMemo<ColumnDef<AdminAnnouncementRow>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{row.title}</span>
            <span className="text-xs text-text-muted">
              Audience: {row.audienceLabel}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <Badge variant="accent">{row.statusLabel}</Badge>,
        align: "center",
        width: "120px",
      },
      {
        id: "created",
        header: "Created",
        cell: (row) => (
          <span className="text-sm text-text-primary">
            {formatDate(row.createdAt)}
          </span>
        ),
        width: "160px",
      },
      {
        id: "scheduled",
        header: "Scheduled",
        cell: (row) => (
          <span className="text-sm text-text-primary">
            {formatDate(row.scheduledAt)}
          </span>
        ),
        width: "180px",
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary font-heading">
          Notices & Announcements
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button size="sm" disabled>
            New notice (soon)
          </Button>
        </div>
      </div>
      <Card
        title="Messages Sent to Parents and Staff"
        description="High-level summary only. Contents are not shown here."
      >
        {error ? (
          <div className="flex flex-col gap-2 rounded-md bg-status-danger/5 p-4 text-sm text-status-danger">
            <span className="font-semibold">Unable to load announcements</span>
            <span>{error}</span>
            <div>
              <Button size="sm" variant="secondary" onClick={load}>
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No announcements yet."
            onRowClick={(row) => {
              // TODO: implement announcement detail/edit at /admin/notices/[id].
              router.push(`/notices/${row.id}`);
            }}
          />
        )}
        <p className="mt-3 text-xs text-text-muted">
          {/* Safeguarding note: content not displayed here; this list shows metadata only. */}
          Content is hidden here; open detail to review the full message once
          available.
        </p>
      </Card>
    </div>
  );
}
