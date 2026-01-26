export type SectorId = "schools" | "clubs" | "churches" | "charities";

export interface SectorDefinition {
  id: SectorId;
  name: string;
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaHref: string;
  keyBenefits: string[];
  benefitsSectionTitle?: string;
}

export const sectors: SectorDefinition[] = [
  {
    id: "schools",
    name: "Schools",
    slug: "schools",
    heroTitle: "Nexsteps for Schools",
    heroSubtitle:
      "A comprehensive school management platform designed for busy school staff. Manage attendance, rotas, safeguarding workflows, and parent communication-all in one secure, GDPR-compliant system.",
    primaryCtaLabel: "Book a demo",
    secondaryCtaLabel: "View pricing",
    primaryCtaHref: "/demo?sector=schools",
    secondaryCtaHref: "/pricing",
    keyBenefits: [
      "Attendance tracking with offline capture and sync",
      "Rota and timetable management",
      "Safeguarding notes and concerns workflow",
      "Parent communication and announcements",
      "Multi-site support for academies and MATs",
      "GDPR-compliant data handling",
    ],
    benefitsSectionTitle: "Key Features",
  },
  {
    id: "clubs",
    name: "Clubs",
    slug: "clubs",
    heroTitle: "Nexsteps for Clubs",
    heroSubtitle:
      "Perfect for youth clubs, sports clubs, and after-school programmes. Manage multiple groups, track attendance, coordinate volunteers, and keep parents informed-all from one platform.",
    primaryCtaLabel: "Book a demo",
    secondaryCtaLabel: "View pricing",
    primaryCtaHref: "/demo?sector=clubs",
    secondaryCtaHref: "/pricing",
    keyBenefits: [
      "Manage multiple age groups and classes",
      "Track attendance across sessions",
      "Coordinate volunteers and staff rotas",
      "Send announcements to parents",
      "Offline-first mobile app for on-the-go capture",
      "Secure, GDPR-compliant data handling",
    ],
    benefitsSectionTitle: "Perfect for Clubs",
  },
  {
    id: "churches",
    name: "Churches",
    slug: "churches",
    heroTitle: "Nexsteps for Churches",
    heroSubtitle:
      "Support faith-based groups and churches with secure, GDPR-compliant management tools for children and youth programmes. Manage attendance, volunteers, and parent communication with confidence.",
    primaryCtaLabel: "Book a demo",
    secondaryCtaLabel: "View pricing",
    primaryCtaHref: "/demo?sector=churches",
    secondaryCtaHref: "/pricing",
    keyBenefits: [
      "Manage children and youth programmes",
      "Track attendance and participation",
      "Coordinate volunteers and leaders",
      "Secure safeguarding workflows",
      "GDPR-compliant data handling",
      "Parent communication and announcements",
    ],
    benefitsSectionTitle: "Built for Faith-Based Groups",
  },
  {
    id: "charities",
    name: "Charities",
    slug: "charities",
    heroTitle: "Nexsteps for Charities",
    heroSubtitle:
      "Support charities and non-profit organisations with secure, GDPR-compliant management tools for children and youth programmes. Manage attendance, volunteers, and parent communication efficiently.",
    primaryCtaLabel: "Book a demo",
    secondaryCtaLabel: "View pricing",
    primaryCtaHref: "/demo?sector=charities",
    secondaryCtaHref: "/pricing",
    keyBenefits: [
      "Manage children and youth programmes",
      "Track attendance and participation",
      "Coordinate volunteers and staff",
      "Secure safeguarding workflows",
      "GDPR-compliant data handling",
      "Parent and guardian communication",
    ],
    benefitsSectionTitle: "Perfect for Charities",
  },
];

export function getSectorById(id: SectorId): SectorDefinition | undefined {
  return sectors.find((s) => s.id === id);
}

export function getSectorBySlug(slug: string): SectorDefinition | undefined {
  return sectors.find((s) => s.slug === slug);
}

