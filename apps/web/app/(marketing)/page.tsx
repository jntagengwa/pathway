import type { Metadata } from "next";
import { sectors } from "../../content/sectors";
import FeatureCards from "../../components/feature-cards";
import HeroSection from "../../components/hero-section";
import SectorGrid from "../../components/sector-grid";
import WhyNexsteps from "../../components/why-nexsteps";

export const metadata: Metadata = {
  title: "Nexsteps - Safeguarding & attendance for schools, clubs, churches & charities",
  description:
    "Nexsteps helps schools, clubs, churches, and charities manage attendance, rotas, safeguarding, and parent communication.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Feature Cards Section */}
      <FeatureCards />

      {/* Sector Selection Section */}
      <SectorGrid sectors={sectors} />

      {/* Why Nexsteps Section */}
      <WhyNexsteps />
    </div>
  );
}