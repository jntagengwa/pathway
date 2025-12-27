import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Nexsteps Cookie Policy. Learn how we use cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Cookie Policy</h1>
        <p className="text-sm text-pw-text-muted">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="prose prose-sm max-w-none">
        <div className="rounded-xl border border-pw-border bg-white p-6">
          <p className="text-pw-text-muted">
            Cookie policy content coming soon. Nexsteps uses cookies and similar technologies
            to provide and improve our services.
          </p>
        </div>
      </section>
    </div>
  );
}

