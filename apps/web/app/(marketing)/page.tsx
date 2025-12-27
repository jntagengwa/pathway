import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nexsteps – School Management Platform",
  description:
    "Nexsteps helps schools, clubs, churches, and charities manage attendance, rotas, safeguarding, and parent communication.",
};

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 md:py-24">
      <section className="flex flex-col gap-6 text-center">
        <h1 className="text-4xl font-bold text-pw-text md:text-5xl">
          School Management Made Simple
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-pw-text-muted">
          Nexsteps helps schools, clubs, churches, and charities manage attendance, rotas,
          safeguarding, and parent communication—all in one secure platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/demo"
            className="rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            Book a demo
          </Link>
          <Link
            href="/trial"
            className="rounded-md border border-pw-border bg-white px-6 py-3 text-base font-medium text-pw-text transition hover:bg-pw-surface"
          >
            Join waitlist
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "For Schools",
            description:
              "Manage classes, attendance, rotas, and safeguarding workflows designed for busy school staff.",
            link: "/schools",
          },
          {
            title: "For Clubs",
            description:
              "Perfect for youth clubs, sports clubs, and after-school programmes managing multiple groups.",
            link: "/clubs",
          },
          {
            title: "For Churches & Charities",
            description:
              "Support faith-based groups and charities with secure, GDPR-compliant management tools.",
            link: "/churches",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.link}
            className="rounded-xl border border-pw-border bg-white p-6 shadow-sm transition hover:border-pw-primary/60"
          >
            <h3 className="mb-2 text-lg font-semibold text-pw-text">{item.title}</h3>
            <p className="text-sm text-pw-text-muted">{item.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-pw-border bg-white p-8">
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Why Nexsteps?</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Built for busy schools",
              description:
                "Fast flows for attendance, rotas, safeguarding, and announcements. Minimise clicks, maximise efficiency.",
            },
            {
              title: "Multi-tenant and secure",
              description:
                "Tenant isolation with Row-Level Security and GDPR-first data handling. Your data stays private.",
            },
            {
              title: "Offline-first mobile app",
              description:
                "Staff can capture attendance and notes offline, then sync when connected. Perfect for busy classrooms.",
            },
            {
              title: "Parent communication",
              description:
                "Send announcements, share attendance history, and keep families informed—all from one platform.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="mb-2 text-lg font-semibold text-pw-text">{item.title}</h3>
              <p className="text-sm text-pw-text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

