import type { Metadata } from "next";
import SectorLandingPage from "../../../components/sector/SectorLandingPage";
import { getSectorById } from "../../../content/sectors";

const sector = getSectorById("churches");

if (!sector) {
  throw new Error("Sector 'churches' not found");
}

export const metadata: Metadata = {
  title: `Nexsteps for ${sector.name}`,
  description: sector.heroSubtitle,
};

export default function ChurchesPage() {
  return <SectorLandingPage sector={sector} />;
}

