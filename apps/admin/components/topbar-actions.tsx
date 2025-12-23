"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { Building2, Check, ChevronDown, LogOut, User } from "lucide-react";

type OrgOption = {
  id: string;
  name: string;
  roleLabel?: string;
};

const MOCK_ORGS: OrgOption[] = [
  { id: "org-1", name: "Hope Primary School", roleLabel: "Org admin" },
  { id: "org-2", name: "City Youth Hub", roleLabel: "Staff" },
];

// TODO (multi-org):
// - Replace MOCK_ORGS with orgs from API or session claims.
// - Persist the selected orgId and/or request a tenant-scoped token.

type TopBarActionsProps = {
  initialOrgId?: string | null;
};

export function TopBarActions({ initialOrgId }: TopBarActionsProps) {
  const { data: session } = useSession();

  const [orgId, setOrgId] = React.useState<string>(
    initialOrgId ?? (MOCK_ORGS[0]?.id ?? ""),
  );
  const [orgOpen, setOrgOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);

  const orgMenuRef = React.useRef<HTMLDivElement | null>(null);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);

  const currentOrg =
    MOCK_ORGS.find((o) => o.id === orgId) ?? MOCK_ORGS[0] ?? null;

  const userName = session?.user?.name ?? null;
  const userEmail = session?.user?.email ?? null;

  // Multi-org integration:
  // - Replace MOCK_ORGS with a real org list from API or session.
  // - Persist selected orgId (e.g. localStorage) so refresh keeps context.
  // - Use orgId when calling the backend (query/header) OR request an org-scoped token.
  // - Backend should treat orgId as the source of truth for tenant scoping.

  React.useEffect(() => {
    // Basic outside/escape handling; TODO: extend with richer menu a11y patterns.
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const inOrgMenu = orgMenuRef.current?.contains(target) ?? false;
      const inUserMenu = userMenuRef.current?.contains(target) ?? false;

      if (!inOrgMenu && !inUserMenu) {
        setOrgOpen(false);
        setUserOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOrgOpen(false);
        setUserOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Org switcher */}
      <div className="relative" ref={orgMenuRef}>
        <button
          type="button"
          onClick={() => {
            setOrgOpen((open) => !open);
            setUserOpen(false);
          }}
          className="flex items-center gap-2 rounded-full border border-accent-subtle bg-accent-subtle/60 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-accent-strong shadow-sm transition hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
        >
          <span className="hidden sm:inline">ORG SWITCHER</span>
          <span className="inline sm:hidden">ORG</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {orgOpen && (
          <div
            className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border-subtle bg-surface shadow-lg"
            role="menu"
          >
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <Building2 className="h-4 w-4" />
              <span>Organisation</span>
            </div>
            <ul className="max-h-72 overflow-y-auto px-1 pb-2">
              {MOCK_ORGS.map((org) => {
                const isActive = org.id === currentOrg?.id;
                return (
                  <li key={org.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOrgId(org.id);
                        setOrgOpen(false);
                        // TODO (multi-org): persist + trigger org-scoped API/token.
                      }}
                      className="flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        {org.roleLabel && (
                          <span className="text-xs text-text-muted">
                            {org.roleLabel}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <Check className="mt-1 h-4 w-4 text-accent-strong" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border-subtle px-3 py-2 text-xs text-text-muted">
              TODO: Load orgs from API/session and pass active org to the
              backend.
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => {
            setUserOpen((open) => !open);
            setOrgOpen(false);
          }}
          className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
        >
          <span className="hidden sm:inline">{userName ?? "User Menu"}</span>
          <span className="inline sm:hidden">
            <User className="h-4 w-4" />
          </span>
          <ChevronDown className="h-3 w-3 text-text-muted" />
        </button>

        {userOpen && (
          <div
            className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border-subtle bg-surface shadow-lg"
            role="menu"
          >
            {/* User summary */}
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent-strong">
                {(userName ?? userEmail ?? "U").toString().slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-primary">
                  {userName ?? "Signed-in user"}
                </span>
                {userEmail && (
                  <span className="text-xs text-text-muted">{userEmail}</span>
                )}
              </div>
            </div>

            {/* Placeholder links */}
            <div className="border-t border-border-subtle py-1 text-sm">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
              >
                <User className="h-4 w-4 text-text-muted" />
                <span>Profile & settings (coming soon)</span>
              </button>
            </div>

            {/* Sign out */}
            <div className="border-t border-border-subtle py-1 text-sm">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-status-danger hover:bg-status-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-status-danger"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

