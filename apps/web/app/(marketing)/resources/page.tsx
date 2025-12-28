/**
 * Resources index page - resources engine (Milestone 5).
 * Lists all published MDX resources from apps/web/content/resources/.
 */

import type { Metadata } from "next";
import ResourcesClient from "./resources-client";
import { getAllResources, getAllSectors } from "../../../lib/resources";

export const metadata: Metadata = {
  title: "Resources & Guides",
  description:
    "Practical guides for schools, clubs, churches, and charities using Nexsteps. Find resources on safeguarding, attendance, rotas, and parent communication.",
};

export default function ResourcesPage() {
  const resources = getAllResources();
  const sectors = getAllSectors();

  return <ResourcesClient initialResources={resources} initialSectors={sectors} />;
}
