"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { setApiClientToken } from "@/lib/api-client";

function ApiTokenSync() {
  const { data } = useSession();

  useEffect(() => {
    setApiClientToken((data as any)?.accessToken ?? null);
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

