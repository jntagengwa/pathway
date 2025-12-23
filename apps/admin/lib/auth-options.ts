import type { NextAuthOptions } from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

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
      authorization: { params: { audience: process.env.AUTH0_AUDIENCE } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      // On first login, persist tokens into the JWT
      if (account?.access_token) {
        (token as any).accessToken = account.access_token;
      }
      if (account?.id_token) {
        (token as any).idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose accessToken on the session for admin API calls.
      if ((token as any).accessToken) {
        (session as any).accessToken = (token as any).accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

