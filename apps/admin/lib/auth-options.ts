import type { NextAuthOptions } from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

const apiBaseUrl =
  process.env.ADMIN_INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://api.localhost:3001"; // Match the API HTTPS endpoint

const INTERNAL_AUTH_SECRET = process.env.INTERNAL_AUTH_SECRET;

/**
 * Check if a string looks like an email address.
 */
function isEmail(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

async function upsertIdentityToApi(payload: {
  provider: string;
  subject: string;
  email?: string | null;
  name?: string | null;
}): Promise<{ userId?: string; email?: string | null; displayName?: string | null }> {
  console.log("[🔐 AUTH] Starting identity upsert to API:");
  console.log({
    provider: payload.provider,
    subject: payload.subject,
    email: payload.email,
    name: payload.name,
    apiBaseUrl,
    hasSecret: !!INTERNAL_AUTH_SECRET,
  });

  if (!INTERNAL_AUTH_SECRET) {
    console.error("❌ [AUTH] INTERNAL_AUTH_SECRET not set! Cannot create user in DB!");
    return {};
  }

  try {
    console.log(`[🔐 AUTH] Calling ${apiBaseUrl}/internal/auth/identity/upsert...`);
    const response = await fetch(`${apiBaseUrl}/internal/auth/identity/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pathway-internal-secret": INTERNAL_AUTH_SECRET,
      },
      body: JSON.stringify(payload),
    });

    console.log(`[🔐 AUTH] API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ [AUTH] Identity upsert FAILED - Status: ${response.status}, Body: ${errorText}`,
      );
      return {};
    }

    const result = (await response.json()) as {
      userId?: string;
      email?: string | null;
      displayName?: string | null;
    };

    console.log("✅ [AUTH] Identity upsert SUCCESS:");
    console.log({
      userId: result.userId,
      email: result.email,
      displayName: result.displayName,
    });

    return result;
  } catch (error) {
    console.error("❌ [AUTH] Identity upsert exception:", error);
    return {};
  }
}

// Admin-only NextAuth configuration.
// We treat the access token as the bearer token expected by the Nest API.
// In future, map roles/org/tenant from the ID token or profile into the session.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Auth0Provider({
      issuer: process.env.AUTH0_ISSUER,
      clientId: process.env.AUTH0_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH0_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          audience: process.env.AUTH0_AUDIENCE,
          prompt: "login", // Always show login/signup screen
          screen_hint: "signup", // Show signup tab by default (users can still switch to login)
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      try {
        console.log("[🔐 AUTH] JWT callback triggered");
        console.log("[🔐 AUTH] Profile:", {
          sub: token.sub,
          email: (profile as any)?.email ?? (token as any).email,
          name: (profile as any)?.name,
          hasAccount: !!account,
        });

        // On first login, persist tokens into the JWT
        if (account?.access_token) {
          (token as any).accessToken = account.access_token;
        }
        if (account?.id_token) {
          (token as any).idToken = account.id_token;
        }

        // Upsert identity in DB whenever we have a new Auth0 session
        // Auth0 handles email verification - if user is here, they're verified
        if (account?.provider === "auth0" && token.sub) {
          console.log("[🔐 AUTH] Upserting user identity to DB...");
          const profileEmail = (profile as any)?.email ?? (token as any).email;
          const profileName =
            (profile as any)?.name ??
            (profile as any)?.given_name ??
            (token as any).name;

          // Only pass name if it exists and is NOT an email
          const safeName = profileName && !isEmail(profileName) ? profileName : undefined;

          const identity = await upsertIdentityToApi({
            provider: "auth0",
            subject: token.sub,
            email: profileEmail,
            name: safeName,
          });
          if (identity.userId) {
            (token as any).userId = identity.userId;
          }
          if (identity.email) {
            (token as any).email = identity.email;
          }
          if (identity.displayName) {
            (token as any).displayName = identity.displayName;
          }
        }

        return token;
      } catch (err) {
        // Never throw: log and return token so NextAuth does not redirect with error=auth0
        console.error("[🔐 AUTH] JWT callback error (returning token so login completes):", err);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if ((token as any).accessToken) {
          (session as any).accessToken = (token as any).accessToken;
        }
        if ((token as any).userId) {
          (session.user as any).id = (token as any).userId;
        }
        if ((token as any).displayName) {
          session.user!.name = (token as any).displayName;
        }
        return session;
      } catch (err) {
        console.error("[🔐 AUTH] Session callback error:", err);
        return session;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
};

