import { prisma } from "../packages/db/src/index";
import "dotenv/config";

async function main() {
  console.log("🔍 Smoke test: fetching groups...");

  const groups = await prisma.group.findMany();
  console.log(
    "Groups:",
    groups.map((g) => g.name),
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Smoke test failed:", err);
  process.exit(1);
});
