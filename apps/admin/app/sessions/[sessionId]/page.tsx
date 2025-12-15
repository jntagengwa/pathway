"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@pathway/ui";
import {
  AdminAssignmentRow,
  AdminSessionDetail,
  createAssignment,
  deleteAssignment,
  fetchAssignmentsForOrg,
  fetchSessionById,
  updateAssignment,
} from "../../../lib/api-client";

const statusCopy: Record<AdminSessionDetail["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const statusTone: Record<
  AdminSessionDetail["status"],
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

const assignmentStatusLabel: Record<AdminAssignmentRow["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
};

function formatTimeRange(startsAt?: string, endsAt?: string) {
  if (!startsAt || !endsAt) return null;
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

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [session, setSession] = React.useState<AdminSessionDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [assignments, setAssignments] = React.useState<AdminAssignmentRow[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = React.useState(false);
  const [assignmentError, setAssignmentError] = React.useState<string | null>(
    null,
  );
  const [formStaffId, setFormStaffId] = React.useState("");
  const [formRole, setFormRole] = React.useState("Lead");
  const [formStatus, setFormStatus] =
    React.useState<"pending" | "confirmed">("confirmed");
  const [formSubmitting, setFormSubmitting] = React.useState(false);
  const [rowActionId, setRowActionId] = React.useState<string | null>(null);

  const refreshAssignments = React.useCallback(
    async (sessionMeta?: AdminSessionDetail | null) => {
      const targetSession = sessionMeta ?? session;
      if (!targetSession) return;
      setAssignmentsLoading(true);
      setAssignmentError(null);
      try {
        const lookup = {
          [targetSession.id]: {
            title: targetSession.title,
            startsAt: targetSession.startsAt,
            endsAt: targetSession.endsAt,
          },
        };
        const rows = await fetchAssignmentsForOrg({
          sessionId: targetSession.id,
          sessionLookup: lookup,
        });
        setAssignments(rows);
      } catch (err) {
        setAssignmentError(
          err instanceof Error ? err.message : "Failed to load assignments",
        );
      } finally {
        setAssignmentsLoading(false);
      }
    },
    [session],
  );

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setAssignmentError(null);
    try {
      const result = await fetchSessionById(sessionId);
      setSession(result);
      if (!result) {
        setNotFound(true);
        setAssignments([]);
      } else {
        setAssignments(result.assignments ?? []);
        await refreshAssignments(result);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load session";
      if (message.includes("404")) {
        setNotFound(true);
      } else {
        setError(message);
      }
      setSession(null);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAssignments, sessionId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const time = formatTimeRange(session?.startsAt, session?.endsAt);

  const attendanceBreakdown =
    session?.presentCount !== undefined &&
    session?.absentCount !== undefined &&
    session?.lateCount !== undefined;

  const handleStatusChange = React.useCallback(
    async (assignmentId: string, status: AdminAssignmentRow["status"]) => {
      if (!session) return;
      setRowActionId(assignmentId);
      setAssignmentError(null);
      try {
        await updateAssignment(
          assignmentId,
          { status },
          {
            sessionLookup: {
              [session.id]: {
                title: session.title,
                startsAt: session.startsAt,
                endsAt: session.endsAt,
              },
            },
          },
        );
        await refreshAssignments();
      } catch (err) {
        setAssignmentError(
          err instanceof Error ? err.message : "Failed to update assignment",
        );
      } finally {
        setRowActionId(null);
      }
    },
    [refreshAssignments, session],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="secondary" size="sm">
          <Link href="/sessions" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to sessions
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button size="sm">Edit session</Button>
        </div>
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
        <Card title="Session Not Found">
          <p className="text-sm text-text-muted">
            We couldn’t find a session matching id <strong>{sessionId}</strong>.
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => router.push("/sessions")}
            >
              Back to sessions
            </Button>
          </div>
        </Card>
      ) : error ? (
        <Card title="Error Loading Session">
          <p className="text-sm text-text-muted">{error}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/sessions")}
            >
              Back to sessions
            </Button>
            <Button onClick={load}>Retry</Button>
          </div>
        </Card>
      ) : session ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-text-primary font-heading">
                  {session.title}
                </h1>
                <Badge variant={statusTone[session.status]}>
                  {statusCopy[session.status]}
                </Badge>
              </div>
              {time ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" />
                    {time.date} · {time.range}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {session.room} · {session.ageGroup}
                  </span>
                </div>
              ) : null}
              <div className="text-sm text-text-muted">
                TODO: show lesson resources / description once available.
              </div>
            </div>
          </Card>

          <Card title="Attendance">
            <div className="space-y-2 text-sm text-text-primary">
              <div className="font-semibold">
                {session.attendanceMarked} of {session.attendanceTotal} children
                marked
              </div>
              {attendanceBreakdown ? (
                <ul className="space-y-1 text-text-muted">
                  <li>Present: {session.presentCount}</li>
                  <li>Absent: {session.absentCount}</li>
                  <li>Late: {session.lateCount}</li>
                </ul>
              ) : (
                <p className="text-text-muted">
                  TODO: pull attendance breakdown from API.
                </p>
              )}
            </div>
          </Card>

          <Card
            className="md:col-span-2"
            title="Staff & rota"
            description="Schedule staff onto this session and keep statuses up to date."
          >
            {assignmentError ? (
              <div className="mb-4 rounded-md bg-status-danger/5 px-3 py-2 text-sm text-status-danger">
                {assignmentError}
              </div>
            ) : null}

            {assignmentsLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-16 w-full animate-pulse rounded bg-muted" />
              </div>
            ) : assignments.length ? (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const timeRange = formatTimeRange(
                    assignment.startsAt,
                    assignment.endsAt,
                  );
                  return (
                    <div
                      key={assignment.id}
                      className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-alt p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-text-primary">
                            {assignment.staffName}
                          </span>
                          <Badge variant="default">{assignment.roleLabel}</Badge>
                          <Badge variant={assignmentStatusTone[assignment.status]}>
                            {assignmentStatusLabel[assignment.status]}
                          </Badge>
                        </div>
                        <div className="text-xs text-text-muted">
                          {assignment.sessionTitle ?? session.title} ·{" "}
                          {timeRange
                            ? `${timeRange.date} ${timeRange.range}`
                            : "Time not set"}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs text-text-muted">
                          Status
                          <select
                            value={assignment.status}
                            onChange={(e) =>
                              handleStatusChange(
                                assignment.id,
                                e.target.value as AdminAssignmentRow["status"],
                              )
                            }
                            className="ml-2 rounded-md border border-border-subtle bg-white px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                            disabled={rowActionId === assignment.id}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="declined">Declined</option>
                          </select>
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setRowActionId(assignment.id);
                            setAssignmentError(null);
                            try {
                              await deleteAssignment(assignment.id);
                              await refreshAssignments();
                            } catch (err) {
                              setAssignmentError(
                                err instanceof Error
                                  ? err.message
                                  : "Unable to remove assignment",
                              );
                            } finally {
                              setRowActionId(null);
                            }
                          }}
                          disabled={rowActionId === assignment.id}
                          className="text-status-danger hover:text-status-danger"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                No staff are assigned yet. Add someone below.
              </p>
            )}

            <div className="mt-6 border-t border-border-subtle pt-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Add staff
              </h3>
              <p className="text-xs text-text-muted">
                Enter a staff member and role to place them on this session.
                TODO: replace staff ID input with autocomplete.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!session) return;
                  if (!formStaffId.trim()) {
                    setAssignmentError("Enter a staff member ID to add.");
                    return;
                  }
                  setFormSubmitting(true);
                  setAssignmentError(null);
                  try {
                    await createAssignment(
                      {
                        sessionId: session.id,
                        staffId: formStaffId.trim(),
                        role: formRole,
                        status: formStatus,
                      },
                      {
                        sessionLookup: {
                          [session.id]: {
                            title: session.title,
                            startsAt: session.startsAt,
                            endsAt: session.endsAt,
                          },
                        },
                      },
                    );
                    await refreshAssignments();
                    setFormStaffId("");
                    setFormRole("Lead");
                    setFormStatus("confirmed");
                  } catch (err) {
                    setAssignmentError(
                      err instanceof Error
                        ? err.message
                        : "Failed to add assignment",
                    );
                  } finally {
                    setFormSubmitting(false);
                  }
                }}
                className="mt-3 grid gap-3 md:grid-cols-4"
              >
                <label className="flex flex-col gap-1 text-sm font-medium text-text-primary md:col-span-2">
                  Staff member (ID)
                  <input
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    placeholder="e.g. user UUID"
                    className="w-full rounded-md border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
                  Role
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="rounded-md border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Support">Support</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
                  Status
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as "pending" | "confirmed")
                    }
                    className="rounded-md border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                  </select>
                </label>
                <div className="md:col-span-4 flex flex-wrap items-center gap-2">
                  <Button type="submit" size="sm" disabled={formSubmitting}>
                    {formSubmitting ? "Adding…" : "Add to session"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFormStaffId("");
                      setFormRole("Lead");
                      setFormStatus("confirmed");
                      setAssignmentError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          <Card title="Notes & Safeguarding">
            <p className="text-sm text-text-muted">
              TODO: show related notes/concerns once wired. Respect safeguarding
              RBAC.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
