import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Nexsteps Terms of Service. Read our terms and conditions.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Terms of Service</h1>
        <p className="text-sm text-pw-text-muted">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="prose prose-sm max-w-none">
        <div className="rounded-xl border border-pw-border bg-white p-6">
          <p className="text-pw-text-muted">
            Terms of service content coming soon. By using Nexsteps, you agree to our terms
            and conditions.
          </p>
        </div>
      </section>
    </div>
  );
}

