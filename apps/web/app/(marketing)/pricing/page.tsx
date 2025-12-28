"use client";

/**
 * Pricing page - driven from shared pricing package (Milestone 4).
 * Plan definitions and pricing data come from @pathway/pricing.
 */

import { useEffect } from "react";
import { PLANS, PRICING_FAQS } from "@pathway/pricing";
import { track } from "../../../lib/analytics";
import { getFirstTouchAttribution } from "../../../lib/attribution";
import CtaButton from "../../../components/cta-button";

export default function PricingPage() {
  useEffect(() => {
    // Track pricing page view
    const attribution = getFirstTouchAttribution();
    track({
      type: "pricing_view",
      variant: null,
      utm: attribution?.utm,
    });
  }, []);

  const starterMonthly = PLANS.STARTER_MONTHLY;
  const starterYearly = PLANS.STARTER_YEARLY;
  const growthMonthly = PLANS.GROWTH_MONTHLY;
  const growthYearly = PLANS.GROWTH_YEARLY;
  const enterprisePlan = PLANS.ENTERPRISE_CONTACT;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 md:py-24">
      {/* Hero */}
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold text-pw-text md:text-5xl">Pricing</h1>
        <p className="text-lg text-pw-text-muted md:text-xl">
          Choose the right plan for your organisation. All plans include secure, GDPR-compliant data
          handling and multi-tenant support.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Starter Card */}
        <div className="flex flex-col rounded-xl border border-pw-border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-pw-text">{starterMonthly.displayName}</h3>
            <p className="mt-1 text-sm text-pw-text-muted">{starterMonthly.tagline}</p>
          </div>

          {/* Pricing - Monthly and Yearly */}
          <div className="mb-6 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-pw-text">
                £{starterMonthly.pricePerMonth?.toLocaleString("en-GB")}
              </span>
              <span className="text-pw-text-muted">/month</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-pw-text">
                £{starterYearly.pricePerYear?.toLocaleString("en-GB")}
              </span>
              <span className="text-pw-text-muted">/year</span>
              <span className="ml-2 text-sm text-pw-text-muted">
                (save £
                {((starterMonthly.pricePerMonth || 0) * 12 - (starterYearly.pricePerYear || 0)).toLocaleString("en-GB")}
                )
              </span>
            </div>
          </div>

          <div className="mb-6 space-y-2 text-sm text-pw-text-muted">
            {starterMonthly.av30Included && (
              <p>
                <strong className="text-pw-text">Up to {starterMonthly.av30Included} active people</strong>
              </p>
            )}
            {starterMonthly.maxSitesIncluded && (
              <p>
                <strong className="text-pw-text">
                  {starterMonthly.maxSitesIncluded === 1
                    ? "1 site included"
                    : `${starterMonthly.maxSitesIncluded} sites included`}
                </strong>
              </p>
            )}
          </div>

          <ul className="mb-6 flex-1 space-y-2 text-sm">
            {starterMonthly.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 text-pw-primary">✓</span>
                <span className="text-pw-text-muted">{feature}</span>
              </li>
            ))}
          </ul>

          {starterMonthly.bestFor && (
            <p className="mb-6 text-xs text-pw-text-muted italic">{starterMonthly.bestFor}</p>
          )}

          <CtaButton
            href={`/demo?plan=${starterMonthly.tier}`}
            location="pricing_starter"
          >
            Talk to us
          </CtaButton>
        </div>

        {/* Growth Card */}
        <div className="flex flex-col rounded-xl border border-pw-border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-pw-text">{growthMonthly.displayName}</h3>
            <p className="mt-1 text-sm text-pw-text-muted">{growthMonthly.tagline}</p>
          </div>

          {/* Pricing - Monthly and Yearly */}
          <div className="mb-6 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-pw-text">
                £{growthMonthly.pricePerMonth?.toLocaleString("en-GB")}
              </span>
              <span className="text-pw-text-muted">/month</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-pw-text">
                £{growthYearly.pricePerYear?.toLocaleString("en-GB")}
              </span>
              <span className="text-pw-text-muted">/year</span>
              <span className="ml-2 text-sm text-pw-text-muted">
                (save £
                {((growthMonthly.pricePerMonth || 0) * 12 - (growthYearly.pricePerYear || 0)).toLocaleString("en-GB")}
                )
              </span>
            </div>
          </div>

          <div className="mb-6 space-y-2 text-sm text-pw-text-muted">
            {growthMonthly.av30Included && (
              <p>
                <strong className="text-pw-text">Up to {growthMonthly.av30Included} active people</strong>
              </p>
            )}
            {growthMonthly.maxSitesIncluded && (
              <p>
                <strong className="text-pw-text">
                  {growthMonthly.maxSitesIncluded === 1
                    ? "1 site included"
                    : `${growthMonthly.maxSitesIncluded} sites included`}
                </strong>
              </p>
            )}
          </div>

          <ul className="mb-6 flex-1 space-y-2 text-sm">
            {growthMonthly.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 text-pw-primary">✓</span>
                <span className="text-pw-text-muted">{feature}</span>
              </li>
            ))}
          </ul>

          {growthMonthly.bestFor && (
            <p className="mb-6 text-xs text-pw-text-muted italic">{growthMonthly.bestFor}</p>
          )}

          <CtaButton
            href={`/demo?plan=${growthMonthly.tier}`}
            location="pricing_growth"
          >
            Talk to us
          </CtaButton>
        </div>

        {/* Enterprise Card */}
        <div className="flex flex-col rounded-xl border-2 border-pw-primary bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-pw-text">{enterprisePlan.displayName}</h3>
            <p className="mt-1 text-sm text-pw-text-muted">{enterprisePlan.tagline}</p>
          </div>

          <div className="mb-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-pw-text">Contact us</span>
          </div>

          <div className="mb-6 space-y-2 text-sm text-pw-text-muted">
            <p>
              <strong className="text-pw-text">Unlimited active people</strong>
            </p>
            <p>
              <strong className="text-pw-text">Unlimited sites</strong>
            </p>
          </div>

          <ul className="mb-6 flex-1 space-y-2 text-sm">
            {enterprisePlan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 text-pw-primary">✓</span>
                <span className="text-pw-text-muted">{feature}</span>
              </li>
            ))}
          </ul>

          {enterprisePlan.bestFor && (
            <p className="mb-6 text-xs text-pw-text-muted italic">{enterprisePlan.bestFor}</p>
          )}

          <CtaButton
            href="/demo?plan=enterprise"
            location="pricing_enterprise"
          >
            Contact sales
          </CtaButton>
        </div>
      </div>

      {/* What's Included vs Add-ons */}
      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-pw-border bg-white p-6">
          <h2 className="mb-4 text-2xl font-semibold text-pw-text">What's included</h2>
          <ul className="space-y-3 text-sm text-pw-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-pw-primary">✓</span>
              <span>Attendance tracking and offline capture</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-pw-primary">✓</span>
              <span>Rota and timetable management</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-pw-primary">✓</span>
              <span>Safeguarding notes and concerns workflow</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-pw-primary">✓</span>
              <span>Parent communication and announcements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-pw-primary">✓</span>
              <span>Mobile app for staff and parents</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-pw-primary">✓</span>
              <span>GDPR-compliant data handling and exports</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-pw-primary">✓</span>
              <span>Multi-tenant security with Row-Level Security</span>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-pw-border bg-white p-6">
          <h2 className="mb-4 text-2xl font-semibold text-pw-text">Add-ons</h2>
          <p className="mb-4 text-sm text-pw-text-muted">
            Extend your plan with optional add-ons to meet your organisation's needs.
          </p>
          <ul className="space-y-3 text-sm text-pw-text-muted">
            {starterMonthly.addons?.map((addon, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 text-pw-primary">+</span>
                <div>
                  <strong className="text-pw-text">{addon.label}</strong>
                  <p className="text-xs">{addon.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Plain-language promises */}
      <section className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">Our commitment to you</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="mb-2 font-semibold text-pw-text">No hidden fees</h3>
            <p className="text-sm text-pw-text-muted">
              The price you see is the price you pay. No setup fees, no per-user charges beyond
              your plan's included Active People, and no surprise charges.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-pw-text">Cancel any time</h3>
            <p className="text-sm text-pw-text-muted">
              Cancel your subscription at any time before your next renewal. You'll continue to
              have access until the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-pw-text">You own your data</h3>
            <p className="text-sm text-pw-text-muted">
              You keep control of your data. We support exports if you need to move away, and we
              never lock you in.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-6 text-2xl font-semibold text-pw-text">Frequently asked questions</h2>
        <div className="space-y-6">
          {PRICING_FAQS.map((faq, idx) => (
            <div key={idx}>
              <h3 className="mb-2 font-semibold text-pw-text">{faq.question}</h3>
              <p className="text-sm text-pw-text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
