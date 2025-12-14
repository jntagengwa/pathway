"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, DataTable, type ColumnDef } from "@pathway/ui";
import { AdminSessionRow, fetchSessionsMock } from "../../lib/api-client";

const statusCopy: Record<AdminSessionRow["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const statusTone: Record<
  AdminSessionRow["status"],
  "default" | "accent" | "warning" | "success"
> = {
  not_started: "default",
  in_progress: "accent",
  completed: "success",
};

function formatTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, range: `${startTime} – ${endTime}` };
}

export default function SessionsPage() {
  const [data, setData] = React.useState<AdminSessionRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSessionsMock();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns = React.useMemo<ColumnDef<AdminSessionRow>[]>(
    () => [
      {
        id: "date",
        header: "Date / Time",
        cell: (row) => {
          const { date, range } = formatTimeRange(row.startsAt, row.endsAt);
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-text-primary">{date}</span>
              <span className="text-sm text-text-muted">{range}</span>
            </div>
          );
        },
      },
      {
        id: "title",
        header: "Session",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{row.title}</span>
            <span className="text-sm text-text-muted">
              {row.ageGroup} · {row.room}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={statusTone[row.status]}>
            {statusCopy[row.status]}
          </Badge>
        ),
        align: "center",
        width: "140px",
      },
      {
        id: "attendance",
        header: "Attendance",
        cell: (row) => (
          <span className="text-sm text-text-primary font-medium">
            {row.attendanceMarked} / {row.attendanceTotal} marked
          </span>
        ),
        align: "right",
        width: "160px",
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary font-heading">
          Sessions & Attendance
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button size="sm">Create session</Button>
        </div>
      </div>
      <Card
        title="Upcoming sessions"
        description="Mocked data for now. Live data will respect tenant and role filters."
      >
        {error ? (
          <div className="flex flex-col gap-2 rounded-md bg-status-danger/5 p-4 text-sm text-status-danger">
            <span className="font-semibold">Unable to load sessions</span>
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
            emptyMessage="No sessions scheduled."
            onRowClick={(row) => {
              router.push(`/sessions/${row.id}`);
            }}
          />
        )}
      </Card>
    </div>
  );
}
