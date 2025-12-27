import Link from "next/link";
import type { SectorDefinition } from "../../content/sectors";

interface SectorLandingPageProps {
  sector: SectorDefinition;
}

export default function SectorLandingPage({ sector }: SectorLandingPageProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-pw-text">{sector.heroTitle}</h1>
        <p className="text-lg text-pw-text-muted">{sector.heroSubtitle}</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href={sector.primaryCtaHref}
            className="rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            {sector.primaryCtaLabel}
          </Link>
          <Link
            href={sector.secondaryCtaHref}
            className="rounded-md border border-pw-border bg-white px-6 py-3 text-base font-medium text-pw-text transition hover:bg-pw-surface"
          >
            {sector.secondaryCtaLabel}
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-pw-text">
          {sector.benefitsSectionTitle || "Key Benefits"}
        </h2>
        <ul className="flex flex-col gap-3 text-pw-text-muted">
          {sector.keyBenefits.map((benefit, index) => (
            <li key={index}>• {benefit}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

