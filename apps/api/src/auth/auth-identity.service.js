var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { prisma } from "@pathway/db";
/**
 * Check if a string looks like an email address.
 */
function isEmail(value) {
    if (!value || typeof value !== "string")
        return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
}
let AuthIdentityService = class AuthIdentityService {
    /**
     * Upsert a user + identity given Auth0 profile data.
     * This is called from NextAuth (admin app) via the internal endpoint and also
     * by API guards when handling Auth0 access tokens directly.
     */
    async upsertFromAuth0(payload) {
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
            const updates = {};
            if (normalizedEmail && identity.user.email !== normalizedEmail) {
                updates.email = normalizedEmail;
            }
            // Track first login if not already set
            if (!identity.user.firstLoginAt) {
                updates.firstLoginAt = new Date();
            }
            // Only update displayName if name is provided and is NOT an email
            // Don't overwrite a good displayName with an email
            const safeName = name?.trim() && !isEmail(name) ? name.trim() : null;
            if (safeName) {
                const currentDisplayName = identity.user.displayName?.trim();
                // Only update if displayName is missing, empty, or equals email (auto-generated)
                if (!currentDisplayName || currentDisplayName === identity.user.email) {
                    updates.displayName = safeName;
                }
                // Also update name field if it's missing
                if (!identity.user.name?.trim()) {
                    updates.name = safeName;
                }
            }
            if (Object.keys(updates).length > 0) {
                await prisma.user.update({
                    where: { id: identity.userId },
                    data: updates,
                });
            }
            // Return safe display name using fallback logic
            const safeDisplayName = safeName ??
                (identity.user.displayName && !isEmail(identity.user.displayName)
                    ? identity.user.displayName
                    : identity.user.name && !isEmail(identity.user.name)
                        ? identity.user.name
                        : null);
            return {
                userId: identity.userId,
                email: normalizedEmail ?? identity.user.email,
                displayName: safeDisplayName,
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
        // Only use name if it's not an email
        const safeName = name?.trim() && !isEmail(name) ? name.trim() : null;
        const user = existingUser ??
            (await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: safeName ?? null,
                    displayName: safeName ?? null,
                    firstLoginAt: new Date(), // Mark first login for new users
                },
            }));
        await prisma.userIdentity.create({
            data: {
                userId: user.id,
                provider,
                providerSubject: subject,
                email: normalizedEmail,
                displayName: safeName ?? null,
            },
        });
        // If this is a new user (not existingUser), check for pending invites and mark them as used
        if (!existingUser && normalizedEmail) {
            await this.markPendingInvitesAsUsed(normalizedEmail, user.id);
        }
        // Auto-provision site membership for new users
        await this.ensureUserHasSiteAccess(user.id);
        // Return safe display name using fallback logic
        const safeDisplayName = safeName ??
            (user.displayName && !isEmail(user.displayName)
                ? user.displayName
                : user.name && !isEmail(user.name)
                    ? user.name
                    : null);
        return {
            userId: user.id,
            email: normalizedEmail ?? user.email,
            displayName: safeDisplayName,
        };
    }
    /**
     * Marks pending invites as used when a user signs up with an email that matches an invite.
     * This handles the case where users sign up via Auth0 before explicitly accepting the invite.
     */
    async markPendingInvitesAsUsed(email, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId) {
        if (!email)
            return;
        try {
            const now = new Date();
            const pendingInvites = await prisma.invite.findMany({
                where: {
                    email: email.toLowerCase().trim(),
                    usedAt: null,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
            });
            if (pendingInvites.length > 0) {
                // Mark all pending invites for this email as used
                await prisma.invite.updateMany({
                    where: {
                        id: { in: pendingInvites.map((inv) => inv.id) },
                    },
                    data: {
                        usedAt: new Date(),
                    },
                });
            }
        }
        catch (error) {
            // Don't fail user creation if invite marking fails
            console.error("[AUTH] Failed to mark pending invites as used:", error);
        }
    }
    /**
     * Ensures a user has at least one site membership.
     * If they don't, assign them to the first available site or create a default.
     */
    async ensureUserHasSiteAccess(userId) {
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
    async resolveUserFromClaims(claims) {
        const provider = claims.iss?.includes("auth0") ? "auth0" : "debug";
        const subject = claims.sub;
        if (!subject) {
            throw new UnauthorizedException("Missing sub in token");
        }
        const userClaims = claims["https://pathway.app/user"];
        const email = claims.email ?? userClaims?.email;
        const name = claims.name ??
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
};
AuthIdentityService = __decorate([
    Injectable()
], AuthIdentityService);
export { AuthIdentityService };
