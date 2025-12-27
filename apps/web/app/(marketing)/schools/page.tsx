import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nexsteps for Schools",
  description:
    "School management platform designed for busy school staff. Manage attendance, rotas, safeguarding, and parent communication.",
};

export default function SchoolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Nexsteps for Schools</h1>
        <p className="text-lg text-pw-text-muted">
          A comprehensive school management platform designed for busy school staff. Manage
          attendance, rotas, safeguarding workflows, and parent communication—all in one
          secure, GDPR-compliant system.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/demo"
            className="rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            Book a demo
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-pw-border bg-white px-6 py-3 text-base font-medium text-pw-text transition hover:bg-pw-surface"
          >
            View pricing
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Key Features</h2>
        <ul className="flex flex-col gap-3 text-pw-text-muted">
          <li>• Attendance tracking with offline capture and sync</li>
          <li>• Rota and timetable management</li>
          <li>• Safeguarding notes and concerns workflow</li>
          <li>• Parent communication and announcements</li>
          <li>• Multi-site support for academies and MATs</li>
          <li>• GDPR-compliant data handling</li>
        </ul>
      </section>
    </div>
  );
}

