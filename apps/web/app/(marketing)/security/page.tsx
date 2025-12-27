import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Learn about Nexsteps' security practices, GDPR compliance, data handling, and safeguarding measures.",
};

export default function SecurityPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Security & Compliance</h1>
        <p className="text-lg text-pw-text-muted">
          Nexsteps is built with security and compliance at its core. We use industry-standard
          practices to protect your data and ensure GDPR compliance.
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
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Security Features</h2>
        <ul className="flex flex-col gap-3 text-pw-text-muted">
          <li>• Row-Level Security (RLS) for tenant isolation</li>
          <li>• GDPR-compliant data handling and storage</li>
          <li>• Secure authentication and authorisation</li>
          <li>• Encrypted data in transit and at rest</li>
          <li>• Regular security audits and updates</li>
          <li>• Safeguarding workflows with strict access controls</li>
        </ul>
      </section>
    </div>
  );
}

