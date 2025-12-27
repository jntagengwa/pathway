import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Resources, guides, and tools to help you get the most out of Nexsteps. Coming soon.",
};

export default function ResourcesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Resources</h1>
        <p className="text-lg text-pw-text-muted">
          Resources, guides, and tools to help you get the most out of Nexsteps. More content
          coming soon.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/demo"
            className="rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            Book a demo
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Coming Soon</h2>
        <p className="text-pw-text-muted">
          We're building a library of resources, guides, and tools to help you get started with
          Nexsteps. Check back soon for updates.
        </p>
      </section>
    </div>
  );
}

