/**
 * Seed script for Victorious Kids org/tenant.
 * Creates test staff, parents, and children.
 *
 * Run: pnpm --filter @pathway/db run seed:victorious-kids
 *
 * Override IDs via env (optional):
 *   ORG_ID=xxx TENANT_ID=yyy pnpm run seed:victorious-kids
 */
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

// From your DB: Victorious Kids. Override with ORG_ID / TENANT_ID env vars.
const ORG_ID = process.env.ORG_ID ?? "0fa4786a-1296-499f-a394-adcb249d5015";
const TENANT_ID =
  process.env.TENANT_ID ?? "56888142-b48f-403e-ae63-652b131ecd72";

async function main() {
  console.log("Seeding Victorious Kids test data…");
  console.log(`  Org: ${ORG_ID}, Tenant: ${TENANT_ID}`);

  const tenant = await prisma.tenant.findUnique({
    where: { id: TENANT_ID },
    include: { org: true },
  });
  if (!tenant) throw new Error(`Tenant ${TENANT_ID} not found`);
  const org = tenant.org;
  if (!org || org.id !== ORG_ID) {
    console.warn("  Tenant belongs to different org, using tenant.orgId");
  }
  const orgId = org?.id ?? tenant.orgId;

  const groups = await prisma.group.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (groups.length === 0) throw new Error(`No groups found for tenant ${TENANT_ID}`);

  console.log(`  Found ${groups.length} groups: ${groups.map((g) => g.name).join(", ")}`);

  // --- Staff ---
  const siteAdmin = await prisma.user.upsert({
    where: { email: "admin@victorious-kids.test" },
    update: {},
    create: {
      email: "admin@victorious-kids.test",
      name: "Sarah Admin",
      displayName: "Sarah Admin",
      firstName: "Sarah",
      lastName: "Admin",
      tenantId: TENANT_ID,
      hasFamilyAccess: false,
      hasServeAccess: true,
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: "staff1@victorious-kids.test" },
    update: {},
    create: {
      email: "staff1@victorious-kids.test",
      name: "Mike Teacher",
      displayName: "Mike Teacher",
      firstName: "Mike",
      lastName: "Teacher",
      tenantId: TENANT_ID,
      hasFamilyAccess: false,
      hasServeAccess: true,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: "staff2@victorious-kids.test" },
    update: {},
    create: {
      email: "staff2@victorious-kids.test",
      name: "Emma Helper",
      displayName: "Emma Helper",
      firstName: "Emma",
      lastName: "Helper",
      tenantId: TENANT_ID,
      hasFamilyAccess: false,
      hasServeAccess: true,
    },
  });

  await prisma.siteMembership.createMany({
    data: [
      { userId: siteAdmin.id, tenantId: TENANT_ID, role: "SITE_ADMIN" },
      { userId: staff1.id, tenantId: TENANT_ID, role: "STAFF" },
      { userId: staff2.id, tenantId: TENANT_ID, role: "STAFF" },
    ],
    skipDuplicates: true,
  });

  await prisma.orgMembership.createMany({
    data: [{ userId: siteAdmin.id, orgId, role: "ORG_ADMIN" }],
    skipDuplicates: true,
  });

  console.log("  Staff: Sarah Admin (SITE_ADMIN), Mike Teacher, Emma Helper");

  // --- Parents ---
  const parent1 = await prisma.user.upsert({
    where: { email: "parent1@victorious-kids.test" },
    update: {},
    create: {
      email: "parent1@victorious-kids.test",
      name: "James Chen",
      displayName: "James Chen",
      firstName: "James",
      lastName: "Chen",
      tenantId: TENANT_ID,
      hasFamilyAccess: true,
      hasServeAccess: false,
    },
  });

  const parent2 = await prisma.user.upsert({
    where: { email: "parent2@victorious-kids.test" },
    update: {},
    create: {
      email: "parent2@victorious-kids.test",
      name: "Priya Patel",
      displayName: "Priya Patel",
      firstName: "Priya",
      lastName: "Patel",
      tenantId: TENANT_ID,
      hasFamilyAccess: true,
      hasServeAccess: false,
    },
  });

  const parent3 = await prisma.user.upsert({
    where: { email: "parent3@victorious-kids.test" },
    update: {},
    create: {
      email: "parent3@victorious-kids.test",
      name: "David Williams",
      displayName: "David Williams",
      firstName: "David",
      lastName: "Williams",
      tenantId: TENANT_ID,
      hasFamilyAccess: true,
      hasServeAccess: false,
    },
  });

  await prisma.siteMembership.createMany({
    data: [
      { userId: parent1.id, tenantId: TENANT_ID, role: "VIEWER" },
      { userId: parent2.id, tenantId: TENANT_ID, role: "VIEWER" },
      { userId: parent3.id, tenantId: TENANT_ID, role: "VIEWER" },
    ],
    skipDuplicates: true,
  });

  console.log("  Parents: James Chen, Priya Patel, David Williams");

  // --- Children (assigned to groups by age) ---
  const beginnings = groups.find((g) => g.name === "Beginnings") ?? groups[0];
  const foundations = groups.find((g) => g.name === "Foundations") ?? groups[1];
  const discovery = groups.find((g) => g.name === "Discovery") ?? groups[2];
  const insight = groups.find((g) => g.name === "Insight") ?? groups[3];
  const becoming = groups.find((g) => g.name === "Becoming") ?? groups[4] ?? groups[0];

  const childData = [
    { firstName: "Lily", lastName: "Chen", preferredName: "Lily", groupId: beginnings.id, guardians: [parent1] },
    { firstName: "Arjun", lastName: "Patel", preferredName: "Arjun", groupId: foundations.id, guardians: [parent2] },
    { firstName: "Sophie", lastName: "Patel", preferredName: "Sophie", groupId: discovery.id, guardians: [parent2] },
    { firstName: "Noah", lastName: "Williams", preferredName: "Noah", groupId: insight.id, guardians: [parent3] },
    { firstName: "Mia", lastName: "Williams", preferredName: "Mia", groupId: becoming.id, guardians: [parent3] },
    { firstName: "Ethan", lastName: "Chen", preferredName: "Ethan", groupId: discovery.id, guardians: [parent1] },
  ];

  const existingChildren = await prisma.child.findMany({
    where: { tenantId: TENANT_ID },
    select: { firstName: true, lastName: true },
  });
  const existingKeys = new Set(existingChildren.map((c) => `${c.firstName}|${c.lastName}`));

  for (const { firstName, lastName, preferredName, groupId, guardians } of childData) {
    if (existingKeys.has(`${firstName}|${lastName}`)) {
      console.log(`  Child ${firstName} ${lastName} already exists, skipping`);
      continue;
    }
    await prisma.child.create({
      data: {
        firstName,
        lastName,
        preferredName,
        tenantId: TENANT_ID,
        groupId,
        guardians: { connect: guardians.map((p) => ({ id: p.id })) },
        allergies: "none",
        disabilities: [],
        photoConsent: false,
      },
    });
    console.log(`  Child: ${firstName} ${lastName} -> ${groups.find((g) => g.id === groupId)?.name ?? "group"}`);
  }

  console.log("✅ Victorious Kids seed complete.");
  console.log("\nTest accounts (for admin UI / API testing):");
  console.log("  Staff: admin@victorious-kids.test, staff1@victorious-kids.test, staff2@victorious-kids.test");
  console.log("  Parents: parent1@victorious-kids.test, parent2@victorious-kids.test, parent3@victorious-kids.test");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
