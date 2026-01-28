"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { setApiClientToken } from "@/lib/api-client";

function ApiTokenSync() {
  const { data } = useSession();

  useEffect(() => {
    const token = (data as any)?.accessToken ?? null;
    console.log("[ApiTokenSync] Setting access token:", {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20),
      hasSession: !!data,
    });
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

