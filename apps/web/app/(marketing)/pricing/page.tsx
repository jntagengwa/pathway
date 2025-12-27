import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the right Nexsteps plan for your organisation. Transparent pricing with flexible options for schools, clubs, churches, and charities.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold text-pw-text">Pricing</h1>
        <p className="text-lg text-pw-text-muted">
          Choose the right plan for your organisation. All plans include secure, GDPR-compliant
          data handling and multi-tenant support.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/buy"
            className="rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            View plans & checkout
          </Link>
          <Link
            href="/demo"
            className="rounded-md border border-pw-border bg-white px-6 py-3 text-base font-medium text-pw-text transition hover:bg-pw-surface"
          >
            Book a demo
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Pricing Plans</h2>
        <p className="mb-4 text-pw-text-muted">
          Nexsteps offers flexible pricing based on your organisation's needs. Plans are
          available for single-site organisations and multi-site academies or trusts.
        </p>
        <p className="text-sm text-pw-text-muted">
          For detailed pricing and to complete your purchase, visit our secure checkout page.
        </p>
      </section>
    </div>
  );
}

