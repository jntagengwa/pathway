"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { TopBarActions } from "@/components/topbar-actions";
import {
  SidebarNav,
  TopBar,
  type SidebarNavItem,
  defaultSidebarItems,
} from "@pathway/ui";
import { useAdminAccess } from "@/lib/use-admin-access";
import { meetsAccessRequirement, type AccessRequirement } from "@/lib/access";
import { OnboardingModal } from "@/components/onboarding-modal";
import { getSafeDisplayName } from "@/lib/names";
import { cn } from "@pathway/ui";

const getDevRuntimeState = () => {
  // Check if we have any API URL configured (supports both old and new env var names)
  const hasApiUrl = Boolean(
    process.env.NEXT_PUBLIC_API_URL || 
    process.env.NEXT_PUBLIC_API_BASE_URL
  );
  const isMockApi = !hasApiUrl;
  const hasDevToken = Boolean(process.env.NEXT_PUBLIC_DEV_BEARER_TOKEN);
  return { isMockApi, hasDevToken };
};

// Define access requirements for each nav item
const navItemsWithAccess: (SidebarNavItem & { access?: AccessRequirement })[] = [
  { ...defaultSidebarItems[0], access: "staff-or-admin" }, // Dashboard
  { ...defaultSidebarItems[1], access: "admin-only" }, // People
  { ...defaultSidebarItems[2], access: "staff-or-admin" }, // Children
  { ...defaultSidebarItems[3], access: "staff-or-admin" }, // Parents & Guardians
  { ...defaultSidebarItems[4], access: "staff-or-admin" }, // Lessons
  { ...defaultSidebarItems[5], access: "staff-or-admin" }, // Sessions & Rota
  { ...defaultSidebarItems[6], access: "staff-or-admin" }, // Attendance
  { ...defaultSidebarItems[7], access: "staff-or-admin" }, // Notices & Announcements
  { ...defaultSidebarItems[8], access: "safeguarding-admin" }, // Safeguarding
  { ...defaultSidebarItems[9], access: "billing" }, // Billing
  { ...defaultSidebarItems[10], access: "admin-only" }, // Reports
  { ...defaultSidebarItems[11], access: "admin-only" }, // Settings
];

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/people": "People",
  "/users": "People",
  "/children": "Children",
  "/parents": "Parents & Guardians",
  "/lessons": "Lessons",
  "/sessions": "Sessions & Rota",
  "/attendance": "Attendance",
  "/notices": "Notices & Announcements",
  "/safeguarding": "Safeguarding & Wellbeing",
  "/billing": "Billing & Usage",
  "/billing/buy-now": "Buy Now",
  "/reports": "Reports & Insights",
  "/settings": "Settings & Organisation",
};

const resolveTitle = (path: string): string => {
  if (titleMap[path]) return titleMap[path];
  const topSegment = `/${path.split("/").filter(Boolean)[0] ?? ""}`;
  return titleMap[topSegment] ?? "Admin";
};

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname() || "/";
  const isAuthRoute = pathname === "/login";
  const title = resolveTitle(pathname);
  const { isMockApi, hasDevToken } = getDevRuntimeState();
  const { data: session } = useSession();
  
  // Only show mock banner if truly in mock mode
  const showMockBanner = isMockApi;
  
  // Only show missing token banner in development when:
  // - Not in mock mode
  // - No dev token configured
  // - No active session (would indicate NextAuth is working)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const showMissingTokenBanner = isDevelopment && !isMockApi && !hasDevToken && !session;

  // Get role information for access control
  const { role, currentOrgIsMasterOrg } = useAdminAccess();

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Check if user needs onboarding (first login)
  // Show onboarding if user just logged in (firstLoginAt is recent, within last 5 minutes)
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const onboardingChecked = React.useRef(false);

  React.useEffect(() => {
    if (onboardingChecked.current || !session?.user) return;
    onboardingChecked.current = true;

    // Check if this is a first-time login
    // We'll check the session for a flag or check if name/displayName are missing
    const user = session.user as any;
    const needsOnboarding =
      !user.name?.trim() ||
      (!user.displayName?.trim() && user.email === user.displayName);

    if (needsOnboarding && !isAuthRoute) {
      setShowOnboarding(true);
    }
  }, [session, isAuthRoute]);

  // Filter nav items based on user's role (hide billing for master orgs)
  const visibleNavItems = React.useMemo(
    () =>
      navItemsWithAccess.filter((item) =>
        meetsAccessRequirement(role, item.access, {
          currentOrgIsMasterOrg,
        }),
      ),
    [role, currentOrgIsMasterOrg],
  );

  if (isAuthRoute) {
    return <div className="min-h-screen bg-shell text-text-primary">{children}</div>;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            setShowOnboarding(false);
            // Refresh the page to get updated session data
            window.location.reload();
          }}
        />
      )}
      <div className="flex h-screen overflow-hidden bg-shell text-text-primary">
        <SidebarNav
          items={visibleNavItems}
          currentPath={pathname}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          header={
            <Link
              href="/"
              className={cn(
                "group flex items-center gap-3 transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:ring-offset-2 focus-visible:ring-status-info",
                isSidebarCollapsed && "justify-center",
              )}
            >
              {isSidebarCollapsed ? (
                <Image
                  src="/NSLogo.svg"
                  alt="Nexsteps"
                  width={32}
                  height={32}
                  className="rounded-md shadow-sm"
                  priority
                />
              ) : (
                <>
                  <Image
                    src="/NSLogo.svg"
                    alt="Nexsteps Admin"
                    width={32}
                    height={32}
                    className="rounded-md shadow-sm"
                    priority
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold tracking-tight text-text-primary">
                      Nexsteps
                    </span>
                    <span className="text-xs text-text-muted">Admin</span>
                  </div>
                </>
              )}
            </Link>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-shell">
          <TopBar
            title={title}
            rightSlot={
              <div className="flex items-center gap-3">
                {session?.user && (
                  <span className="hidden text-sm text-text-muted sm:inline">
                    Welcome, {getSafeDisplayName(session.user)}
                  </span>
                )}
                <TopBarActions />
              </div>
            }
          />
          <main className="flex-1 overflow-y-auto px-8 py-6">
            <div className="mx-auto w-full max-w-5xl space-y-4">
              {showMockBanner && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                  Running in mock API mode - some data is sample only.
                </div>
              )}
              {showMissingTokenBanner && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                  No dev auth token configured - some API calls may fail.
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
