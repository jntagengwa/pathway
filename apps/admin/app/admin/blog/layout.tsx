"use client";

import React from "react";
import { useAdminAccess } from "../../../lib/use-admin-access";
import { meetsAccessRequirement } from "../../../lib/access";
import { NoAccessCard } from "../../../components/no-access-card";

/**
 * Layout for /admin/blog - blocks non-super-users from accessing any blog route.
 * Protects against direct URL access (e.g. /admin/blog, /admin/blog/new, /admin/blog/[id]).
 */
export default function BlogAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading } = useAdminAccess();
  const canAccess = meetsAccessRequirement(role, "super-user");

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <NoAccessCard message="Blog access is restricted to Nexsteps staff only." />
      </div>
    );
  }

  return <>{children}</>;
}
