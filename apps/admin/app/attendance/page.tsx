"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, DataTable, type ColumnDef } from "@pathway/ui";
import {
  AdminAttendanceRow,
  fetchAttendanceSummariesForToday,
} from "../../lib/api-client";

const statusCopy: Record<AdminAttendanceRow["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const statusTone: Record<
  AdminAttendanceRow["status"],
  "default" | "accent" | "success"
> = {
  not_started: "default",
  in_progress: "accent",
  completed: "success",
};

export default function AttendancePage() {
  const router = useRouter();
  const [data, setData] = React.useState<AdminAttendanceRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAttendanceSummariesForToday();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load attendance",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns = React.useMemo<ColumnDef<AdminAttendanceRow>[]>(
    () => [
      {
        id: "session",
        header: "Session",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{row.title}</span>
            <span className="text-xs text-text-muted">
              {row.timeRangeLabel} · {row.ageGroupLabel ?? "Group TBC"}
            </span>
          </div>
        ),
      },
      {
        id: "room",
        header: "Room",
        cell: (row) => (
          <span className="text-sm text-text-muted">
            {row.roomLabel ?? "TBC"}
          </span>
        ),
        width: "120px",
      },
      {
        id: "attendance",
        header: "Attendance",
        cell: (row) => (
          <span className="text-sm text-text-primary">
            {row.attendanceMarked} / {row.attendanceTotal}
          </span>
        ),
        width: "140px",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={statusTone[row.status]}>{statusCopy[row.status]}</Badge>
        ),
        align: "center",
        width: "140px",
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            Attendance
          </h1>
          <p className="text-sm text-text-muted">
            Sessions with attendance to review or verify today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={load}>
            Refresh
          </Button>
          <Link
            href="/sessions"
            className="text-xs font-semibold text-accent-strong underline-offset-2 hover:underline"
          >
            View sessions
          </Link>
        </div>
      </div>

      <Card>
        {error ? (
          <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-4 text-sm text-status-danger">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                Unable to load attendance list.
              </span>
              <Button size="sm" variant="secondary" onClick={load}>
                Retry
              </Button>
            </div>
            <p className="text-xs text-text-muted">{error}</p>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No sessions with attendance to review today."
            onRowClick={(row) => router.push(`/attendance/${row.sessionId}`)}
          />
        )}
      </Card>
    </div>
  );
}
