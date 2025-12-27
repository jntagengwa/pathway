"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge, Button, Card } from "@pathway/ui";
import {
  AdminAnnouncementRow,
  AdminSessionRow,
  // fetchAnnouncements,
  fetchRecentAnnouncements,
  fetchSessions,
} from "../lib/api-client";

type StatusTone = "default" | "accent" | "warning" | "success";

const statusTone: Record<AdminSessionRow["status"], StatusTone> = {
  not_started: "default",
  in_progress: "accent",
  completed: "success",
};

const formatTimeRange = (startsAt?: string, endsAt?: string) => {
  if (!startsAt || !endsAt) return null;
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
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
  return { date, range: `${startTime} – ${endTime}`, sameDay };
};

const isTodayLocal = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-3"
      >
        <div className="flex flex-col gap-2">
          <span className="h-3 w-32 animate-pulse rounded bg-muted" />
          <span className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <span className="h-5 w-16 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [sessions, setSessions] = React.useState<AdminSessionRow[]>([]);
  const [announcements, setAnnouncements] = React.useState<
    AdminAnnouncementRow[]
  >([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] =
    React.useState(true);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const [announcementError, setAnnouncementError] = React.useState<
    string | null
  >(null);

  const loadSessions = React.useCallback(async () => {
    setIsLoadingSessions(true);
    setSessionError(null);
    try {
      const result = await fetchSessions();
      setSessions(result);
    } catch (err) {
      setSessionError(
        err instanceof Error ? err.message : "Failed to load sessions",
      );
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const loadAnnouncements = React.useCallback(async () => {
    setIsLoadingAnnouncements(true);
    setAnnouncementError(null);
    try {
      const result = await fetchRecentAnnouncements(4);
      setAnnouncements(result);
    } catch (err) {
      setAnnouncementError(
        err instanceof Error ? err.message : "Failed to load announcements",
      );
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  React.useEffect(() => {
    // Only load data when session is authenticated
    if (sessionStatus === "authenticated" && session) {
      void loadSessions();
      void loadAnnouncements();
    }
  }, [sessionStatus, session, loadSessions, loadAnnouncements]);

  const todaysSessions = React.useMemo(() => {
    return sessions
      .filter((s) => isTodayLocal(s.startsAt) || isTodayLocal(s.endsAt))
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
      .slice(0, 4);
  }, [sessions]);

  const pendingAttendance = React.useMemo(() => {
    return todaysSessions.filter(
      (s) =>
        (s.status === "not_started" || s.status === "in_progress") &&
        typeof s.attendanceMarked === "number" &&
        typeof s.attendanceTotal === "number" &&
        s.attendanceTotal > 0 &&
        s.attendanceMarked < s.attendanceTotal,
    );
  }, [todaysSessions]);

  const formatAnnouncementMeta = (a: AdminAnnouncementRow) => {
    if (a.scheduledAt) {
      return `Scheduled for ${new Date(a.scheduledAt).toLocaleString()}`;
    }
    return `Created ${new Date(a.createdAt).toLocaleString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-text-primary font-heading">
          Dashboard
        </h1>
        <p className="text-sm text-text-muted">
          A quick overview of today’s sessions, attendance, notices, and
          safeguarding metadata.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Today’s Sessions">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm text-text-muted">
              Sessions happening today for this organisation.
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sessions" className="focus-visible:outline-none">
                View all
              </Link>
            </Button>
          </div>
          {isLoadingSessions ? (
            <SkeletonRows />
          ) : sessionError ? (
            <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-3 text-sm text-status-danger">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Unable to load today’s sessions
                </span>
                <Button size="sm" variant="secondary" onClick={loadSessions}>
                  Retry
                </Button>
              </div>
              <p className="text-xs text-text-muted">{sessionError}</p>
            </div>
          ) : todaysSessions.length === 0 ? (
            <p className="text-sm text-text-muted">
              No sessions scheduled for today.
            </p>
          ) : (
            <div className="space-y-3">
              {todaysSessions.map((session) => {
                const time = formatTimeRange(session.startsAt, session.endsAt);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary">
                        {session.title}
                      </span>
                      <span className="text-xs text-text-muted">
                        {time ? `${time.range}` : "Time TBC"} ·{" "}
                        {session.room || "Room TBC"} ·{" "}
                        {session.ageGroup || "Group TBC"}
                      </span>
                    </div>
                    <Badge
                      variant={statusTone[session.status]}
                      className="px-2 py-1 text-[11px]"
                    >
                      {session.status === "not_started"
                        ? "Scheduled"
                        : session.status === "in_progress"
                          ? "In progress"
                          : "Completed"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Pending Attendance">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm text-text-muted">
              Sessions where attendance still needs review.
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/attendance" className="focus-visible:outline-none">
                Open attendance
              </Link>
            </Button>
          </div>
          {isLoadingSessions ? (
            <SkeletonRows rows={2} />
          ) : sessionError ? (
            <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-3 text-sm text-status-danger">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Unable to load attendance</span>
                <Button size="sm" variant="secondary" onClick={loadSessions}>
                  Retry
                </Button>
              </div>
              <p className="text-xs text-text-muted">{sessionError}</p>
            </div>
          ) : pendingAttendance.length === 0 ? (
            <p className="text-sm text-text-muted">
              No attendance tasks pending for today.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendingAttendance.map((item) => {
                const time = formatTimeRange(item.startsAt, item.endsAt);
                return (
                  <li
                    key={item.id}
                    className="list-none rounded-md border border-border-subtle bg-surface px-3 py-2"
                  >
                    <p className="text-base font-semibold text-text-primary font-heading leading-6">
                      {item.title}
                    </p>
                    <p className="text-sm text-text-muted">
                      {time ? `${time.range}` : "Time TBC"} ·{" "}
                      {item.room || "Room TBC"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {item.attendanceMarked} of {item.attendanceTotal} marked
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Open Concerns">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm text-text-muted">
              Safeguarding overview (metadata only).
            </p>
            <Link
              href="/safeguarding"
              className="text-xs font-semibold text-accent-strong underline-offset-2 hover:underline"
            >
              View in Safeguarding
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-text-muted">
              Open concerns count will come from the safeguarding service
              (aggregate only; no child-level detail).
            </p>
            <p className="text-xs text-text-muted">
              TODO: pull aggregate open concerns count from safeguarding
              endpoint.
            </p>
          </div>
        </Card>

        <Card title="Recent Announcements">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm text-text-muted">
              Latest notices sent to parents and staff.
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/notices" className="focus-visible:outline-none">
                View all
              </Link>
            </Button>
          </div>
          {isLoadingAnnouncements ? (
            <SkeletonRows />
          ) : announcementError ? (
            <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-3 text-sm text-status-danger">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Unable to load announcements
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadAnnouncements}
                >
                  Retry
                </Button>
              </div>
              <p className="text-xs text-text-muted">{announcementError}</p>
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-text-muted">
              No announcements yet. They’ll appear here once published.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {announcements.map((item) => (
                <li
                  key={item.id}
                  className="list-none rounded-md border border-border-subtle bg-surface px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-semibold text-text-primary font-heading leading-6">
                      {item.title}
                    </p>
                    <Badge variant="default">{item.statusLabel}</Badge>
                  </div>
                  <p className="text-sm text-text-muted">
                    {item.audienceLabel} · {formatAnnouncementMeta(item)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
