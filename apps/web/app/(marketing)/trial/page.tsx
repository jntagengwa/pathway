"use client";

import { useState, useEffect } from "react";
import { createTrialLead } from "../../../lib/leads-client";
import type { CreateTrialLeadPayload } from "../../../lib/leads-client";

const sectors = ["schools", "clubs", "churches", "charities"] as const;

export default function TrialPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [sector, setSector] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Prefill sector from query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectorParam = params.get("sector");
    if (sectorParam && (sectors as readonly string[]).includes(sectorParam)) {
      setSector(sectorParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");
    setErrorMessage("");

    setIsSubmitting(true);

    try {
      const payload: CreateTrialLeadPayload = {
        email,
        name: name || undefined,
        organisation: organisation || undefined,
        sector: sector || undefined,
      };

      await createTrialLead(payload);
      setSubmitStatus("success");
      // Reset form
      setEmail("");
      setName("");
      setOrganisation("");
      setSector("");
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {submitStatus === "success" ? (
          <div className="rounded-md bg-pw-success/10 border border-pw-success/20 p-4 text-pw-success">
            <p className="font-medium">You&apos;re on the list!</p>
            <p className="text-sm mt-1">
              We&apos;ll notify you when trial access becomes available.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-pw-text">
                Email <span className="text-pw-primary">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-pw-text">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="organisation"
                className="text-sm font-medium text-pw-text"
              >
                Organisation
              </label>
              <input
                id="organisation"
                type="text"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="sector" className="text-sm font-medium text-pw-text">
                Sector
              </label>
              <select
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
              >
                <option value="">Select a sector</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {submitStatus === "error" && (
              <div className="rounded-md bg-pw-danger/10 border border-pw-danger/20 p-3 text-sm text-pw-danger">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
