"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { setApiClientToken } from "@/lib/api-client";

function ApiTokenSync() {
  const { data } = useSession();

  useEffect(() => {
    console.log("[Auth] User identity in session state:", {
      user: data?.user ?? null,
      hasRoles: !!(data as any)?.roles,
      rolesSummary: (data as any)?.roles
        ? {
            orgRoles: (data as any).roles.orgRoles?.length ?? 0,
            siteRoles: (data as any).roles.siteRoles?.length ?? 0,
          }
        : undefined,
    });
    const token = (data as any)?.accessToken ?? null;
    setApiClientToken(token);
  }, [data]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiTokenSync />
      {children}
    </SessionProvider>
  );
}

