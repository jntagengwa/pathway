"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Users } from "lucide-react";
import { Badge, Button, Card } from "@pathway/ui";
import { AdminSessionRow, fetchSessionById } from "../../../lib/api-client";

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

  const [session, setSession] = React.useState<AdminSessionRow | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSessionById(sessionId);
      setSession(result);
      if (!result) {
        setError("Session not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const time = formatTimeRange(session?.startsAt, session?.endsAt);

  const attendanceBreakdown =
    session?.presentCount !== undefined &&
    session?.absentCount !== undefined &&
    session?.lateCount !== undefined;

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
      ) : error ? (
        <Card title="Session not found">
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

          <Card title="Staff assignments">
            <div className="space-y-2 text-sm text-text-primary">
              <div className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-text-muted" />
                <div>
                  <div className="font-semibold">Lead</div>
                  <div className="text-text-muted">
                    {session.leadStaff ?? "Unassigned"}
                  </div>
                </div>
              </div>
              <div className="text-text-muted">
                Support: {session.supportStaff?.join(", ") || "Unassigned"}
              </div>
            </div>
          </Card>

          <Card title="Notes & safeguarding">
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
