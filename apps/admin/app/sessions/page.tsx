"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Select,
  type ColumnDef,
} from "@pathway/ui";
import {
  AdminAssignmentRow,
  AdminRotaDay,
  AdminSessionRow,
  fetchAssignmentsForOrg,
  fetchSessions,
  mapApiAssignmentsToRotaDays,
} from "../../lib/api-client";

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

const assignmentStatusTone: Record<
  AdminAssignmentRow["status"],
  "default" | "accent" | "warning" | "success"
> = {
  pending: "warning",
  confirmed: "success",
  declined: "default",
};

function formatTimeRange(startsAt?: string, endsAt?: string) {
  if (!startsAt || !endsAt) return { date: "Unknown", range: "—" };
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

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as first day
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatWeekRange = (start: Date) => {
  const end = addDays(start, 6);
  const startLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${startLabel} – ${endLabel}`;
};

export default function SessionsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = React.useState<"sessions" | "rota">(
    "sessions",
  );
  const [sessions, setSessions] = React.useState<AdminSessionRow[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(true);
  const [sessionsError, setSessionsError] = React.useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "not_started" | "in_progress" | "completed"
  >("all");

  const [weekStart, setWeekStart] = React.useState<Date>(
    () => startOfWeek(new Date()),
  );
  const [rotaDays, setRotaDays] = React.useState<AdminRotaDay[]>([]);
  const [rotaLoading, setRotaLoading] = React.useState(false);
  const [rotaError, setRotaError] = React.useState<string | null>(null);

  const loadSessions = React.useCallback(async () => {
    setIsLoadingSessions(true);
    setSessionsError(null);
    try {
      const result = await fetchSessions();
      setSessions(result);
    } catch (err) {
      setSessionsError(
        err instanceof Error ? err.message : "Failed to load sessions",
      );
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const loadRota = React.useCallback(
    async (start: Date) => {
      setRotaLoading(true);
      setRotaError(null);
      const dateFrom = start.toISOString().slice(0, 10);
      const dateTo = addDays(start, 6).toISOString().slice(0, 10);
      try {
        const assignments = await fetchAssignmentsForOrg({
          dateFrom,
          dateTo,
        });
        const grouped = mapApiAssignmentsToRotaDays(assignments);
        setRotaDays(grouped);
      } catch (err) {
        setRotaError(
          err instanceof Error ? err.message : "Failed to load rota",
        );
      } finally {
        setRotaLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    // Only load data when session is authenticated
    if (sessionStatus === "authenticated" && session) {
      void loadSessions();
    }
  }, [sessionStatus, session, loadSessions]);

  React.useEffect(() => {
    // Only load data when session is authenticated
    if (sessionStatus === "authenticated" && session && activeTab === "rota") {
      void loadRota(weekStart);
    }
  }, [sessionStatus, session, activeTab, loadRota, weekStart]);

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
          <span className="text-sm font-medium text-text-primary">
            {row.attendanceMarked} / {row.attendanceTotal} marked
          </span>
        ),
        align: "right",
        width: "160px",
      },
    ],
    [],
  );

  const filteredSessions = React.useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    return sessions.filter((s) => {
      const matchesQuery = query
        ? s.title.toLowerCase().includes(query)
        : true;
      const matchesStatus = statusFilter === "all" ? true : s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [sessions, sessionSearch, statusFilter]);

  const weekDates = React.useMemo(
    () => Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx)),
    [weekStart],
  );

  const rotaMap = React.useMemo(
    () => new Map(rotaDays.map((day) => [day.date, day.assignments])),
    [rotaDays],
  );

  const renderSessionsTab = () => (
    <Card
      title="Upcoming Sessions"
      description="Live data uses tenant scoping; mock data shown when API base URL is not set."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadSessions}>
            Refresh
          </Button>
          <Button asChild size="sm">
            <a href="/sessions/new">New session</a>
          </Button>
        </div>
      }
    >
      {sessionsError ? (
        <div className="flex flex-col gap-2 rounded-md bg-status-danger/5 p-4 text-sm text-status-danger">
          <span className="font-semibold">Unable to load sessions</span>
          <span>{sessionsError}</span>
          <div>
            <Button size="sm" variant="secondary" onClick={loadSessions}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Input
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Search sessions…"
              className="md:max-w-xs"
              aria-label="Search sessions"
            />
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
                className="md:w-44"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="not_started">Upcoming</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </div>
          <DataTable
            data={filteredSessions}
            columns={columns}
            isLoading={isLoadingSessions}
            emptyMessage="No sessions have been scheduled yet."
            onRowClick={(row) => {
              router.push(`/sessions/${row.id}`);
            }}
          />
        </>
      )}
    </Card>
  );

  const renderRotaTab = () => (
    <div className="flex flex-col gap-3">
      <Card
        title="Staff Rota"
        description="Weekly view of who is scheduled on each session."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            >
              Previous
            </Button>
            <div className="rounded-md border border-border-subtle bg-surface px-3 py-1 text-sm text-text-primary">
              {formatWeekRange(weekStart)}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            >
              Next
            </Button>
          </div>
        }
      >
        {rotaError ? (
          <div className="flex flex-col gap-2 rounded-md bg-status-danger/5 p-4 text-sm text-status-danger">
            <span className="font-semibold">Unable to load rota</span>
            <span>{rotaError}</span>
            <div>
              <Button size="sm" variant="secondary" onClick={() => loadRota(weekStart)}>
                Retry
              </Button>
            </div>
          </div>
        ) : rotaLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            {weekDates.map((date) => (
              <div
                key={date.toISOString()}
                className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-alt p-4"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            {weekDates.map((date) => {
              const dateKey = date.toISOString().slice(0, 10);
              const assignments = rotaMap.get(dateKey) ?? [];
              const dayLabel = date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={dateKey}
                  className="flex min-h-[180px] flex-col gap-3 rounded-lg border border-border-subtle bg-surface-alt p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-text-primary">
                      {dayLabel}
                    </div>
                    <span className="text-xs text-text-muted">
                      {assignments.length
                        ? `${assignments.length} staff`
                        : "No staff"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {assignments.length === 0 ? (
                      <p className="text-sm text-text-muted">
                        No staff are scheduled.
                      </p>
                    ) : (
                      assignments.map((assignment) => {
                        const { range } = formatTimeRange(
                          assignment.startsAt,
                          assignment.endsAt,
                        );
                        return (
                          <button
                            key={assignment.id}
                            type="button"
                            onClick={() =>
                              router.push(`/sessions/${assignment.sessionId}`)
                            }
                            className="group flex w-full flex-col gap-1 rounded-md border border-border-subtle bg-white px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-text-primary">
                                {assignment.sessionTitle ?? "Session"}
                              </span>
                              <Badge variant={assignmentStatusTone[assignment.status]}>
                                {assignment.status === "pending"
                                  ? "Pending"
                                  : assignment.status === "declined"
                                    ? "Declined"
                                    : "Confirmed"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-text-muted">
                              <span>{range}</span>
                              <span className="font-medium text-text-primary">
                                {assignment.staffName} · {assignment.roleLabel}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!rotaLoading && !rotaError && rotaDays.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            No staff are scheduled in this week yet.
          </p>
        ) : null}
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            Sessions & Rota
          </h1>
          <p className="text-sm text-text-muted">
            Manage sessions and see who is scheduled on the rota.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-alt p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "sessions"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted"
            }`}
            onClick={() => setActiveTab("sessions")}
          >
            Sessions
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === "rota"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted"
            }`}
            onClick={() => setActiveTab("rota")}
          >
            Rota
          </button>
        </div>
      </div>

      {activeTab === "sessions" ? renderSessionsTab() : renderRotaTab()}
    </div>
  );
}
