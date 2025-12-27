import type { Metadata } from "next";
import SectorLandingPage from "../../../components/sector/SectorLandingPage";
import { getSectorById } from "../../../content/sectors";

const sector = getSectorById("clubs");

if (!sector) {
  throw new Error("Sector 'clubs' not found");
}

export const metadata: Metadata = {
  title: `Nexsteps for ${sector.name}`,
  description: sector.heroSubtitle,
};

export default function ClubsPage() {
  return <SectorLandingPage sector={sector} />;
}

