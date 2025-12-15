"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, Button, Card, DataTable, type ColumnDef } from "@pathway/ui";
import {
  AdminAttendanceDetail,
  fetchAttendanceDetailBySessionId,
} from "../../../lib/api-client";

const statusCopy: Record<AdminAttendanceDetail["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const statusTone: Record<
  AdminAttendanceDetail["status"],
  "default" | "accent" | "success"
> = {
  not_started: "default",
  in_progress: "accent",
  completed: "success",
};

const childStatusTone: Record<
  "present" | "absent" | "late" | "unknown",
  "success" | "warning" | "default" | "accent"
> = {
  present: "success",
  absent: "warning",
  late: "accent",
  unknown: "default",
};

export default function AttendanceDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [detail, setDetail] = React.useState<AdminAttendanceDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchAttendanceDetailBySessionId(sessionId);
      if (!result) {
        setNotFound(true);
        setDetail(null);
      } else {
        setDetail(result);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load attendance",
      );
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns = React.useMemo<ColumnDef<AdminAttendanceDetail["rows"][number]>[]>(
    () => [
      {
        id: "child",
        header: "Child",
        cell: (row) => (
          <span className="text-sm font-semibold text-text-primary">
            {row.childName}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={childStatusTone[row.status]} className="capitalize">
            {row.status}
          </Badge>
        ),
        width: "140px",
      },
    ],
    [],
  );

  const renderSummary = () => {
    if (!detail) return null;
    const items = [
      { label: "Present", value: detail.summary.present },
      { label: "Absent", value: detail.summary.absent },
      { label: "Late", value: detail.summary.late },
      { label: "Unknown", value: detail.summary.unknown },
    ];
    return (
      <Card title="Summary">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-border-subtle bg-surface px-3 py-2"
            >
              <p className="text-xs text-text-muted">{item.label}</p>
              <p className="text-lg font-semibold text-text-primary">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="secondary" size="sm">
          <Link href="/attendance" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to attendance
          </Link>
        </Button>
        <Button variant="secondary" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </div>
          </Card>
          <Card>
            <div className="flex flex-col gap-3">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </Card>
        </div>
      ) : notFound ? (
        <Card title="Attendance Not Found">
          <p className="text-sm text-text-muted">
            We couldn’t find attendance for session <strong>{sessionId}</strong>.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push("/attendance")}>
              Back to attendance
            </Button>
          </div>
        </Card>
      ) : error ? (
        <Card title="Something Went Wrong">
          <p className="text-sm text-text-muted">{error}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/attendance")}>
              Back
            </Button>
            <Button onClick={load}>Retry</Button>
          </div>
        </Card>
      ) : detail ? (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-text-primary font-heading">
                  {detail.title}
                </h1>
                <Badge variant={statusTone[detail.status]}>
                  {statusCopy[detail.status]}
                </Badge>
              </div>
              <p className="text-sm text-text-muted">
                {detail.timeRangeLabel} · {detail.roomLabel ?? "Room TBC"} ·{" "}
                {detail.ageGroupLabel ?? "Group TBC"}
              </p>
            </div>
          </Card>

          {renderSummary()}

          <Card title="Attendance Details">
            <DataTable
              data={detail.rows}
              columns={columns}
              isLoading={false}
              emptyMessage="No attendance rows for this session."
            />
          </Card>
        </div>
      ) : null}
    </div>
  );
}

