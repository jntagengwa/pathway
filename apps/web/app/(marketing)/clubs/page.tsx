import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nexsteps for Clubs",
  description:
    "Perfect for youth clubs, sports clubs, and after-school programmes. Manage multiple groups, attendance, and parent communication.",
};

export default function ClubsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Nexsteps for Clubs</h1>
        <p className="text-lg text-pw-text-muted">
          Perfect for youth clubs, sports clubs, and after-school programmes. Manage multiple
          groups, track attendance, coordinate volunteers, and keep parents informed—all from
          one platform.
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
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Perfect for Clubs</h2>
        <ul className="flex flex-col gap-3 text-pw-text-muted">
          <li>• Manage multiple age groups and classes</li>
          <li>• Track attendance across sessions</li>
          <li>• Coordinate volunteers and staff rotas</li>
          <li>• Send announcements to parents</li>
          <li>• Offline-first mobile app for on-the-go capture</li>
          <li>• Secure, GDPR-compliant data handling</li>
        </ul>
      </section>
    </div>
  );
}

