import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nexsteps for Churches",
  description:
    "Support faith-based groups and churches with secure, GDPR-compliant management tools for children and youth programmes.",
};

export default function ChurchesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Nexsteps for Churches</h1>
        <p className="text-lg text-pw-text-muted">
          Support faith-based groups and churches with secure, GDPR-compliant management tools
          for children and youth programmes. Manage attendance, volunteers, and parent
          communication with confidence.
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
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Built for Faith-Based Groups</h2>
        <ul className="flex flex-col gap-3 text-pw-text-muted">
          <li>• Manage children and youth programmes</li>
          <li>• Track attendance and participation</li>
          <li>• Coordinate volunteers and leaders</li>
          <li>• Secure safeguarding workflows</li>
          <li>• GDPR-compliant data handling</li>
          <li>• Parent communication and announcements</li>
        </ul>
      </section>
    </div>
  );
}

