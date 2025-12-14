import React from "react";
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
            <ul className="flex flex-col gap-3">
              {todaysSessions.map((session) => (
                <li
                  key={session.title}
                  className="list-none rounded-md border border-border-subtle bg-surface px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-text-primary font-heading leading-6">
                        {session.title}
                      </p>
                      <p className="text-sm text-text-muted">
                        {session.time} · {session.room}
                      </p>
                    </div>
                    <Badge variant="accent">Scheduled</Badge>
                  </div>
                </li>
              ))}
            </ul>
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
