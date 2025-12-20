"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 md:py-20">
      <div className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-wide text-pw-primary">Nexsteps</p>
        <h1 className="text-3xl font-semibold text-pw-text">Plans & Pricing</h1>
        <p className="max-w-3xl text-lg text-pw-text-muted">
          Choose a plan, add capacity if you need it, and complete your purchase on our
          secure Stripe checkout. Billing is handled by Nexsteps via Stripe Snapshot
          webhooks to keep your subscription and entitlements in sync.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/buy"
            className="rounded-md bg-pw-primary px-4 py-2 text-white shadow-sm transition hover:bg-blue-600"
          >
            Start Buy Now
          </Link>
          <a
            href="https://dimly-cot-53065711.figma.site"
            className="rounded-md border border-pw-border px-4 py-2 text-pw-text transition hover:bg-white"
          >
            View product design
          </a>
        </div>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Multi-tenant and secure", body: "Tenant isolation with RLS and GDPR-first data handling." },
          { title: "Built for busy schools", body: "Fast flows for attendance, rotas, safeguarding, and announcements." },
          { title: "Checkout via Stripe", body: "Stripe-hosted checkout with snapshot webhooks as the source of truth." },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-pw-border bg-white p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-sm text-pw-text-muted">{item.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

