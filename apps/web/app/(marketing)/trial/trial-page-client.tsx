"use client";

import { useState, useEffect } from "react";
import { createTrialLead } from "../../../lib/leads-client";
import type { CreateTrialLeadPayload } from "../../../lib/leads-client";
import { getFirstTouchAttribution } from "../../../lib/attribution";

const sectors = ["schools", "clubs", "churches", "charities", "other"] as const;
const approximateSizes = [
  { value: "1-50", label: "1-50 people" },
  { value: "51-200", label: "51-200 people" },
  { value: "201-500", label: "201-500 people" },
  { value: "500+", label: "500+ people" },
] as const;

/**
 * Trial waitlist page (v1).
 * 
 * TODO (v2 - Self-serve): Replace this single-form page with a multi-step wizard:
 * - Step 1: About you (name, email, role)
 * - Step 2: Your organisation (org name, sector, size)
 * - Step 3: Confirm & create tenant (self-serve tenant creation API call)
 * 
 * The URL should remain `/trial` for SEO continuity.
 */
export default function TrialPageClient() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [sector, setSector] = useState("");
  const [approximateSize, setApproximateSize] = useState("");
  const [consent, setConsent] = useState(false);
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

    if (!consent) {
      setSubmitStatus("error");
      setErrorMessage("Please agree to be contacted about trial access");
      return;
    }

    setIsSubmitting(true);

    try {
      const attribution = getFirstTouchAttribution();
      const payload: CreateTrialLeadPayload = {
        email,
        name: name || undefined,
        organisation: organisation || undefined,
        sector: sector || undefined,
        utm: attribution?.utm,
      };

      await createTrialLead(payload);

      // TODO: Track trial submission - add "trial_submit" event type to AnalyticsEvent union in lib/analytics.ts
      // track({
      //   type: "trial_submit",
      //   sector: sector || null,
      //   utm: attribution?.utm,
      // });

      setSubmitStatus("success");
      // Reset form
      setEmail("");
      setName("");
      setOrganisation("");
      setSector("");
      setApproximateSize("");
      setConsent(false);
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
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-16 md:py-24">
      {/* Hero Section */}
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold text-pw-text md:text-5xl">
          Join the Trial Waitlist
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-pw-text-muted">
          Be the first to try Nexsteps. Join our waitlist and we&apos;ll contact you to set up your
          Nexsteps site when trial access becomes available.
        </p>
      </section>

      {/* TODO (v2 - Self-serve): Replace this single-form card with a multi-step wizard component
          that guides users through: Step 1 (About you) → Step 2 (Your organisation) → Step 3 (Confirm & create).
          The wizard should call a self-serve tenant creation API endpoint.
      */}
      <section className="rounded-xl border border-pw-border bg-white p-6 md:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-pw-text">
          Step 1: About You
        </h2>

        {submitStatus === "success" ? (
          <div className="rounded-md bg-pw-success/10 border border-pw-success/20 p-6 text-pw-success">
            <p className="font-medium text-lg mb-2">You&apos;re on the waitlist!</p>
            <p className="text-sm">
              We&apos;ll contact you soon to set up your Nexsteps site. In the meantime, feel free
              to{" "}
              <a href="/demo" className="underline hover:text-pw-primary">
                book a demo
              </a>{" "}
              to see how Nexsteps can help your organisation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-pw-text">
                Your Name <span className="text-pw-primary">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
                placeholder="John Smith"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-pw-text">
                Email Address <span className="text-pw-primary">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
                placeholder="john@example.org"
              />
            </div>

            {/* TODO (v2 - Self-serve): Move this section to Step 2: Your Organisation */}
            <div className="border-t border-pw-border pt-6">
              <h3 className="mb-4 text-lg font-semibold text-pw-text">
                Your Organisation
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="organisation"
                    className="text-sm font-medium text-pw-text"
                  >
                    Organisation Name <span className="text-pw-primary">*</span>
                  </label>
                  <input
                    id="organisation"
                    type="text"
                    required
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
                    placeholder="Riverford Primary School"
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

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="approximateSize"
                    className="text-sm font-medium text-pw-text"
                  >
                    Approximate Size
                  </label>
                  <select
                    id="approximateSize"
                    value={approximateSize}
                    onChange={(e) => setApproximateSize(e.target.value)}
                    className="rounded-md border border-pw-border px-3 py-2 text-sm text-pw-text focus:border-pw-primary focus:outline-none"
                  >
                    <option value="">Select size</option>
                    {approximateSizes.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* TODO (v2 - Self-serve): Move this to Step 3: Confirm & Create */}
            <div className="border-t border-pw-border pt-6">
              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-pw-border text-pw-primary focus:ring-pw-primary"
                />
                <label htmlFor="consent" className="text-sm text-pw-text-muted">
                  I agree to be contacted by Nexsteps about trial access and to receive information
                  about setting up my Nexsteps site.{" "}
                  <a href="/privacy" className="text-pw-primary underline hover:text-blue-600">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            {submitStatus === "error" && (
              <div className="rounded-md bg-pw-danger/10 border border-pw-danger/20 p-3 text-sm text-pw-danger">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Joining waitlist..." : "Join Waitlist"}
            </button>
          </form>
        )}
      </section>

      {/* TODO (v2 - Self-serve): Add Step 2 and Step 3 sections here as wizard steps.
          Step 2 should collect organisation details (currently above).
          Step 3 should show a confirmation screen and call the tenant creation API.
      */}
    </div>
  );
}

