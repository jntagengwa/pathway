import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description:
    "Join the Nexsteps waitlist to be notified when trial access becomes available.",
};

export default function TrialPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">Join the Waitlist</h1>
        <p className="text-lg text-pw-text-muted">
          Be the first to know when trial access becomes available. Join our waitlist to get
          notified.
        </p>
      </div>

      <section className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-pw-text">Waitlist Form</h2>
        <p className="mb-4 text-pw-text-muted">
          Waitlist form coming soon. For now, please contact us at{" "}
          <a
            href="mailto:hello@nexsteps.dev"
            className="text-pw-primary underline transition hover:text-blue-600"
          >
            hello@nexsteps.dev
          </a>
          .
        </p>
      </section>
    </div>
  );
}

