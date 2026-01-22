"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import Link from "next/link";
import type { SectorDefinition } from "../../content/sectors";
import { track } from "../../lib/analytics";
import { getFirstTouchAttribution } from "../../lib/attribution";
import CtaButton from "../cta-button";
import PageWrapper from "../page-wrapper";

interface SectorLandingPageProps {
  sector: SectorDefinition;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function SectorLandingPage({ sector }: SectorLandingPageProps) {
  useEffect(() => {
    // Track sector page view
    const attribution = getFirstTouchAttribution();
    const sectorId = sector.id as "schools" | "clubs" | "churches" | "charities";

    track({
      type: "sector_page_view",
      sector: sectorId,
      utm: attribution?.utm,
    });
  }, [sector.id]);

  return (
    <PageWrapper>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-pw-text">{sector.heroTitle}</h1>
          <p className="text-lg text-pw-text-muted">{sector.heroSubtitle}</p>
          <div className="flex flex-wrap gap-4">
            <CtaButton
              href={sector.primaryCtaHref}
              location={`sector_${sector.id}_hero`}
              sector={sector.id}
            >
              {sector.primaryCtaLabel}
            </CtaButton>
            <Link
              href={sector.secondaryCtaHref}
              className="rounded-md border border-pw-border bg-white px-6 py-3 text-base font-medium text-pw-text transition hover:bg-pw-surface"
            >
              {sector.secondaryCtaLabel}
            </Link>
          </div>
        </motion.div>

        <motion.section
          className="rounded-xl border border-pw-border bg-white p-6 shadow-soft"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="mb-4 text-2xl font-semibold text-pw-text">
            {sector.benefitsSectionTitle || "Key Benefits"}
          </h2>
          <motion.ul
            className="flex flex-col gap-3 text-pw-text-muted"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {sector.keyBenefits.map((benefit, index) => (
              <motion.li key={index} variants={itemVariants}>
                • {benefit}
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      </div>
    </PageWrapper>
  );
}