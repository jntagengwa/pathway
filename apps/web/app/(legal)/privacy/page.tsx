import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Nexsteps Privacy Policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Privacy Policy</h1>
        <p className="text-sm text-pw-text-muted">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="prose prose-sm max-w-none">
        <div className="rounded-xl border border-pw-border bg-white p-6">
          <p className="text-pw-text-muted">
            Privacy policy content coming soon. Nexsteps is committed to protecting your
            privacy and handling your data in accordance with GDPR and UK data protection
            regulations.
          </p>
        </div>
      </section>
    </div>
  );
}

