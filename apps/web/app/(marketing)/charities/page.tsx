import type { Metadata } from "next";
import SectorLandingPage from "../../../components/sector/SectorLandingPage";
import { getSectorById } from "../../../content/sectors";
import type { SectorDefinition } from "../../../content/sectors";

const sectorResult = getSectorById("charities");

if (!sectorResult) {
  throw new Error("Sector 'charities' not found");
}

const sector: SectorDefinition = sectorResult;

export const metadata: Metadata = {
  title: `Nexsteps for ${sector.name}`,
  description: sector.heroSubtitle,
};

export default function CharitiesPage() {
  return <SectorLandingPage sector={sector} />;
}

