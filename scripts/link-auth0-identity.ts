/**
 * Quick script to manually link Auth0 identity to existing user
 */
import { prisma } from "@pathway/db";

async function main() {
  const userId = "831cec4a-10e4-42f1-857a-397116e75e4e";
  const auth0Sub = "auth0|69474b6d00f0447c095e8791";
  const email = "admin@demo.church";
  const displayName = "Demo Admin";

  console.log(`Linking Auth0 identity ${auth0Sub} to user ${userId}...`);

  const identity = await prisma.userIdentity.upsert({
    where: {
      provider_providerSubject: {
        provider: "auth0",
        providerSubject: auth0Sub,
      },
    },
    create: {
      userId,
      provider: "auth0",
      providerSubject: auth0Sub,
      email,
      displayName,
    },
    update: {
      userId,
      email,
      displayName,
    },
  });

  console.log("✅ Identity linked:", identity);

  // Verify
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      identities: true,
      siteMemberships: true,
      orgMemberships: true,
    },
  });

  console.log("\n✅ User with identities:");
  console.log({
    id: user?.id,
    email: user?.email,
    name: user?.name,
    identities: user?.identities.map((i) => ({
      provider: i.provider,
      subject: i.providerSubject,
    })),
    siteMemberships: user?.siteMemberships.length,
    orgMemberships: user?.orgMemberships.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

