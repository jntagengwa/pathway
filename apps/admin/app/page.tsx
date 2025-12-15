import React from "react";
import Link from "next/link";
import { Badge, Card } from "@pathway/ui";

type Session = { title: string; time: string; room: string };
type Item = { title: string; meta: string };

const todaysSessions: Session[] = [
  { title: "Year 3 Maths", time: "09:00 - 09:50", room: "Room 12" },
  { title: "Year 5 Science", time: "11:00 - 11:50", room: "Lab 2" },
];

const pendingAttendance: Item[] = [
  { title: "After-school Coding", meta: "12 children pending" },
  { title: "Year 4 English", meta: "Attendance due in 20m" },
];

const openConcerns: Item[] = [
  { title: "Follow-up: playground incident", meta: "Owner: Safeguarding Lead" },
];

const recentAnnouncements: Item[] = [
  { title: "Staff inset day reminder", meta: "Sent 1h ago" },
  { title: "Parents evening signup", meta: "Starts next week" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Today’s Sessions">
          {todaysSessions.length === 0 ? (
            <p className="text-sm text-text-muted">No sessions today yet.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm text-text-muted">What’s on today.</p>
                <Link
                  href="/sessions"
                  className="text-xs font-semibold text-accent-strong underline-offset-2 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {todaysSessions.map((session) => (
                  <div
                    key={session.title}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary">
                        {session.title}
                      </span>
                      <span className="text-xs text-text-muted">
                        {session.time} · {session.room}
                      </span>
                    </div>
                    <Badge variant="accent" className="px-2 py-1 text-[11px]">
                      Scheduled
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Pending Attendance">
          {pendingAttendance.length === 0 ? (
            <p className="text-sm text-text-muted">
              No attendance tasks pending.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendingAttendance.map((item) => (
                <li
                  key={item.title}
                  className="list-none rounded-md border border-border-subtle bg-surface px-3 py-2"
                >
                  <p className="text-base font-semibold text-text-primary font-heading leading-6">
                    {item.title}
                  </p>
                  <p className="text-sm text-text-muted">{item.meta}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Open Concerns">
          {openConcerns.length === 0 ? (
            <p className="text-sm text-text-muted">
              No open concerns right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {openConcerns.map((item) => (
                <li
                  key={item.title}
                  className="list-none rounded-md border border-border-subtle bg-surface px-3 py-2"
                >
                  <p className="text-base font-semibold text-text-primary font-heading leading-6">
                    {item.title}
                  </p>
                  <p className="text-sm text-text-muted">{item.meta}</p>
                  <Badge variant="warning">Restricted</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent Announcements">
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-text-muted">No announcements yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentAnnouncements.map((item) => (
                <li
                  key={item.title}
                  className="list-none rounded-md border border-border-subtle bg-surface px-3 py-2"
                >
                  <p className="text-base font-semibold text-text-primary font-heading leading-6">
                    {item.title}
                  </p>
                  <p className="text-sm text-text-muted">{item.meta}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card
        title="What’s next"
        description="Static placeholders for now. Wire real data once API integration lands."
      >
        <p className="text-sm text-text-muted">
          TODO: hook into attendance, safeguarding, announcements, and AV30
          billing context when available.
        </p>
      </Card>
    </div>
  );
}
