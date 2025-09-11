import { PrismaClient, Role } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../../../.env") }); // prisma/ → db → packages → repo root

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PathWay demo data…");

  // 1) Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-church" },
    update: {},
    create: { name: "Demo Church", slug: "demo-church" },
  });

  // 2) Age Groups (Group)
  await prisma.group.createMany({
    data: [
      { name: "0-3", minAge: 0, maxAge: 3, tenantId: tenant.id },
      { name: "4-5", minAge: 4, maxAge: 5, tenantId: tenant.id },
      { name: "6-7", minAge: 6, maxAge: 7, tenantId: tenant.id },
      { name: "8-11", minAge: 8, maxAge: 11, tenantId: tenant.id },
    ],
    skipDuplicates: true,
  });

  const group45 = await prisma.group.findFirstOrThrow({
    where: { tenantId: tenant.id, name: "4-5" },
  });

  // 3) Users (Admin, Parent, Volunteer, Both)
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.church" },
    update: {},
    create: {
      email: "admin@demo.church",
      name: "Demo Admin",
      tenantId: tenant.id,
      hasFamilyAccess: true,
      hasServeAccess: true,
    },
  });

  const parentOnly = await prisma.user.upsert({
    where: { email: "parent@demo.church" },
    update: {},
    create: {
      email: "parent@demo.church",
      name: "Paula Parent",
      tenantId: tenant.id,
      hasFamilyAccess: true,
      hasServeAccess: false,
    },
  });

  const volunteerOnly = await prisma.user.upsert({
    where: { email: "volunteer@demo.church" },
    update: {},
    create: {
      email: "volunteer@demo.church",
      name: "Victor Volunteer",
      tenantId: tenant.id,
      hasFamilyAccess: false,
      hasServeAccess: true,
    },
  });

  const bothSpaces = await prisma.user.upsert({
    where: { email: "both@demo.church" },
    update: {},
    create: {
      email: "both@demo.church",
      name: "Casey Both",
      tenantId: tenant.id,
      hasFamilyAccess: true,
      hasServeAccess: true,
    },
  });

  // 4) Roles per tenant
  await prisma.userTenantRole.createMany({
    data: [
      { userId: admin.id, tenantId: tenant.id, role: Role.ADMIN },
      { userId: volunteerOnly.id, tenantId: tenant.id, role: Role.TEACHER },
      { userId: bothSpaces.id, tenantId: tenant.id, role: Role.TEACHER },
      { userId: parentOnly.id, tenantId: tenant.id, role: Role.PARENT },
    ],
    skipDuplicates: true,
  });

  // 5) Child + guardianship (many-to-many)
  const child = await prisma.child.create({
    data: {
      firstName: "Avery",
      lastName: "Parent",
      tenantId: tenant.id,
      groupId: group45.id,
      guardians: {
        connect: [{ id: parentOnly.id }, { id: bothSpaces.id }],
      },
    },
  });

  // 6) Attendance (simple demo record)
  await prisma.attendance.create({
    data: {
      childId: child.id,
      groupId: group45.id,
      present: true,
    },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
