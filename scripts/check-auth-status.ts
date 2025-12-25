/**
 * Quick script to verify auth setup is working
 */
import { prisma } from "@pathway/db";

async function main() {
  const auth0Sub = "auth0|69474b6d00f0447c095e8791";

  console.log("🔍 Checking Auth0 identity link...\n");

  const identity = await prisma.userIdentity.findUnique({
    where: {
      provider_providerSubject: {
        provider: "auth0",
        providerSubject: auth0Sub,
      },
    },
    include: {
      user: {
        include: {
          siteMemberships: {
            include: {
              tenant: {
                include: { org: true },
              },
            },
          },
          orgMemberships: {
            include: {
              org: true,
            },
          },
        },
      },
    },
  });

  if (!identity) {
    console.log("❌ Auth0 identity not found!");
    return;
  }

  console.log("✅ Auth0 Identity Found:");
  console.log(`   Provider: ${identity.provider}`);
  console.log(`   Subject: ${identity.providerSubject}`);
  console.log(`   Email: ${identity.email}\n`);

  const user = identity.user;
  console.log("✅ Linked User:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Last Active Tenant: ${user.lastActiveTenantId || "(none)"}\n`);

  console.log("✅ Site Memberships:");
  if (user.siteMemberships.length === 0) {
    console.log("   ⚠️  No site memberships found!");
  } else {
    user.siteMemberships.forEach((m) => {
      console.log(`   - ${m.tenant.name} (${m.tenant.org.name})`);
      console.log(`     Role: ${m.role}`);
      console.log(`     Tenant ID: ${m.tenantId}`);
    });
  }

  console.log("\n✅ Org Memberships:");
  if (user.orgMemberships.length === 0) {
    console.log("   (none)");
  } else {
    user.orgMemberships.forEach((m) => {
      console.log(`   - ${m.org.name}`);
      console.log(`     Role: ${m.role}`);
    });
  }

  console.log("\n🎉 Auth setup complete!");
  console.log("\nYou should now be able to:");
  console.log("  • Log in with Auth0");
  console.log("  • See your sites in the site selector");
  console.log("  • Access API endpoints with proper tenant context");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

