import type { Metadata } from "next";
import SectorLandingPage from "../../../components/sector/SectorLandingPage";
import { getSectorById } from "../../../content/sectors";

const sector = getSectorById("schools");

if (!sector) {
  throw new Error("Sector 'schools' not found");
}

export const metadata: Metadata = {
  title: `Nexsteps for ${sector.name}`,
  description: sector.heroSubtitle,
};

export default function SchoolsPage() {
  return <SectorLandingPage sector={sector} />;
}

