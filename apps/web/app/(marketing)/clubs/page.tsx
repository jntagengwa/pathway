import type { Metadata } from "next";
import SectorLandingPage from "../../../components/sector/SectorLandingPage";
import { getSectorById } from "../../../content/sectors";
import type { SectorDefinition } from "../../../content/sectors";

const sectorResult = getSectorById("clubs");

if (!sectorResult) {
  throw new Error("Sector 'clubs' not found");
}

const sector: SectorDefinition = sectorResult;

export const metadata: Metadata = {
  title: `Nexsteps for ${sector.name}`,
  description: sector.heroSubtitle,
};

export default function ClubsPage() {
  return <SectorLandingPage sector={sector} />;
}

