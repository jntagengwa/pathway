"use client";

import { usePathname } from "next/navigation";
import { useAdminAccess } from "@/lib/use-admin-access";
import { canAccessRoute } from "@/lib/permissions";
import { NoAccessCard } from "@/components/no-access-card";

export default function NoticesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/notices";
  const { role, isLoading } = useAdminAccess();
  const canAccess = canAccessRoute(pathname, role);

  if (isLoading) return null;
  if (!canAccess) {
    return (
      <NoAccessCard
        title="Notices & Announcements"
        message="This section is only available to site and organisation administrators."
      />
    );
  }
  return <>{children}</>;
}
