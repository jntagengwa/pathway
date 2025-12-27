import type { Metadata } from "next";
import SectorLandingPage from "../../../components/sector/SectorLandingPage";
import { getSectorById } from "../../../content/sectors";

const sector = getSectorById("charities");

if (!sector) {
  throw new Error("Sector 'charities' not found");
}

export const metadata: Metadata = {
  title: `Nexsteps for ${sector.name}`,
  description: sector.heroSubtitle,
};

export default function CharitiesPage() {
  return <SectorLandingPage sector={sector} />;
}

