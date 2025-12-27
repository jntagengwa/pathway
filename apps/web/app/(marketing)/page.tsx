import type { Metadata } from "next";
import Link from "next/link";
import { sectors } from "../../content/sectors";
import CtaButton from "../../components/cta-button";

export const metadata: Metadata = {
  title: "Nexsteps — Safeguarding & attendance for schools, clubs, churches & charities",
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
          <CtaButton href="/demo" location="home_hero">
            Book a demo
          </CtaButton>
          <Link
            href="/trial"
            className="rounded-md border border-pw-border bg-white px-6 py-3 text-base font-medium text-pw-text transition hover:bg-pw-surface"
          >
            Join waitlist
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold text-pw-text">
          Choose your sector
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {sectors.map((sector) => (
            <Link
              key={sector.id}
              href={`/${sector.slug}`}
              className="rounded-xl border border-pw-border bg-white p-6 shadow-sm transition hover:border-pw-primary/60"
            >
              <h3 className="mb-2 text-lg font-semibold text-pw-text">
                For {sector.name}
              </h3>
              <p className="text-sm text-pw-text-muted">{sector.heroSubtitle}</p>
            </Link>
          ))}
        </div>
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
