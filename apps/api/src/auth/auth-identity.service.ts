import { Injectable, UnauthorizedException } from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { DecodedAuthToken } from "./auth-token.util";
import type { UpsertIdentityDto } from "./dto/upsert-identity.dto";

type UpsertResult = {
  userId: string;
  email?: string | null;
  displayName?: string | null;
};

@Injectable()
export class AuthIdentityService {
  /**
   * Upsert a user + identity given Auth0 profile data.
   * This is called from NextAuth (admin app) via the internal endpoint and also
   * by API guards when handling Auth0 access tokens directly.
   */
  async upsertFromAuth0(payload: UpsertIdentityDto): Promise<UpsertResult> {
    const { provider, subject, email, name } = payload;
    if (!provider || !subject) {
      throw new UnauthorizedException("Missing provider or subject");
    }

    const normalizedEmail = email?.trim().toLowerCase();

    const identity = await prisma.userIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider,
          providerSubject: subject,
        },
      },
      include: { user: true },
    });

    if (identity?.user) {
      const updates: {
        email?: string | null;
        displayName?: string | null;
        name?: string | null;
      } = {};
      if (normalizedEmail && identity.user.email !== normalizedEmail) {
        updates.email = normalizedEmail;
      }
      if (name && identity.user.displayName !== name) {
        updates.displayName = name;
        if (!identity.user.name) {
          updates.name = name; // best-effort backfill for legacy name field
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: identity.userId },
          data: updates,
        });
      }

      return {
        userId: identity.userId,
        email: normalizedEmail ?? identity.user.email,
        displayName: name ?? identity.user.displayName ?? identity.user.name,
      };
    }

    // Attempt to link by verified email when possible.
    const existingUser = normalizedEmail
      ? await prisma.user.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
          },
        })
      : null;

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          displayName: name,
        },
      }));

    await prisma.userIdentity.create({
      data: {
        userId: user.id,
        provider,
        providerSubject: subject,
        email: normalizedEmail,
        displayName: name,
      },
    });

    // Auto-provision site membership for new users
    await this.ensureUserHasSiteAccess(user.id);

    return {
      userId: user.id,
      email: normalizedEmail ?? user.email,
      displayName: name ?? user.displayName ?? user.name,
    };
  }

  /**
   * Ensures a user has at least one site membership.
   * If they don't, assign them to the first available site or create a default.
   */
  private async ensureUserHasSiteAccess(userId: string): Promise<void> {
    const existingMembership = await prisma.siteMembership.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      return; // User already has access
    }

    // Find the first available site (prefer demo site)
    const site = await prisma.tenant.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (site) {
      // Assign as STAFF by default
      await prisma.siteMembership.create({
        data: {
          userId,
          tenantId: site.id,
          role: "STAFF",
        },
      });
    }
  }

  async resolveUserFromClaims(
    claims: DecodedAuthToken,
  ): Promise<UpsertResult & { provider: string; subject: string }> {
    const provider = claims.iss?.includes("auth0") ? "auth0" : "debug";
    const subject = claims.sub;
    if (!subject) {
      throw new UnauthorizedException("Missing sub in token");
    }
    const userClaims = claims["https://pathway.app/user"] as
      | {
          email?: string;
          name?: string;
          givenName?: string;
          familyName?: string;
        }
      | undefined;
    const email = claims.email ?? userClaims?.email;
    const name =
      claims.name ??
      userClaims?.givenName ??
      userClaims?.name ??
      [claims.given_name, claims.family_name, userClaims?.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();

    const result = await this.upsertFromAuth0({
      provider,
      subject,
      email: email ?? undefined,
      name: name || undefined,
    });

    return { ...result, provider, subject };
  }
}


