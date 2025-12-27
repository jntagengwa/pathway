"use client";

import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Building2,
  Check,
  ChevronDown,
  LogOut,
  User,
  Loader2,
} from "lucide-react";
import {
  SiteOption,
  fetchActiveSiteState,
  setActiveSite,
} from "@/lib/api-client";
import { getSafeDisplayName } from "@/lib/names";

type SiteState = {
  activeSiteId: string | null;
  sites: SiteOption[];
};

function groupSitesByOrg(sites: SiteOption[]) {
  const groups = new Map<
    string,
    { orgName: string; orgId: string; sites: SiteOption[] }
  >();
  sites.forEach((site) => {
    const key = site.orgId ?? site.id;
    if (!groups.has(key)) {
      groups.set(key, {
        orgName: site.orgName ?? "Site",
        orgId: site.orgId,
        sites: [],
      });
    }
    groups.get(key)!.sites.push(site);
  });
  return Array.from(groups.values());
}

export function TopBarActions() {
  const { data: session, status } = useSession();
  const [siteState, setSiteState] = React.useState<SiteState>({
    activeSiteId: null,
    sites: [],
  });
  const [loadingSites, setLoadingSites] = React.useState(false);
  const [savingSiteId, setSavingSiteId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const siteMenuRef = React.useRef<HTMLDivElement | null>(null);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);
  const userMenuDropdownRef = React.useRef<HTMLDivElement | null>(null);

  const [siteOpen, setSiteOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);

  const userDisplayName = session?.user
    ? getSafeDisplayName(session.user)
    : null;
  const userEmail = session?.user?.email ?? null;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const inSiteMenu = siteMenuRef.current?.contains(target) ?? false;
      const inUserMenu = userMenuRef.current?.contains(target) ?? false;
      if (!inSiteMenu && !inUserMenu) {
        setSiteOpen(false);
        setUserOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSiteOpen(false);
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

  const loadActiveSite = React.useCallback(async () => {
    if (status !== "authenticated") return;
    setLoadingSites(true);
    setError(null);
    try {
      const result = await fetchActiveSiteState();
      setSiteState(result);
    } catch (err) {
      console.error(err);
      setError("Unable to load sites");
    } finally {
      setLoadingSites(false);
    }
  }, [status]);

  React.useEffect(() => {
    void loadActiveSite();
  }, [loadActiveSite]);

  // Auto-select when only one site is available.
  React.useEffect(() => {
    if (
      status === "authenticated" &&
      !loadingSites &&
      siteState.activeSiteId === null &&
      siteState.sites.length === 1
    ) {
      const onlySite = siteState.sites[0];
      if (onlySite?.id) {
        void handleSelectSite(onlySite.id);
      }
    }
  }, [status, loadingSites, siteState.activeSiteId, siteState.sites]);

  const handleSelectSite = async (siteId: string) => {
    setSavingSiteId(siteId);
    setError(null);
    try {
      const result = await setActiveSite(siteId);
      setSiteState(result);
      setSiteOpen(false);
    } catch (err) {
      console.error(err);
      setError("Unable to switch site");
    } finally {
      setSavingSiteId(null);
    }
  };

  const currentSite =
    siteState.sites.find((site) => site.id === siteState.activeSiteId) ?? null;

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => signIn("auth0")}
          className="rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Site selector */}
      <div className="relative" ref={siteMenuRef}>
        <button
          type="button"
          onClick={() => {
            setSiteOpen((open) => !open);
            setUserOpen(false);
          }}
          className="flex items-center gap-2 rounded-full border border-accent-subtle bg-accent-subtle/60 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-accent-strong shadow-sm transition hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
        >
          <span className="hidden sm:inline">
            {currentSite ? currentSite.name : "Select Site"}
          </span>
          <span className="inline sm:hidden">SITE</span>
          {loadingSites ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {siteOpen && (
          <div
            className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-border-subtle bg-surface shadow-lg"
            role="menu"
          >
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              <Building2 className="h-4 w-4" />
              <span>Site</span>
            </div>
            <ul className="max-h-80 overflow-y-auto px-1 pb-2">
              {siteState.sites.length === 0 && (
                <li className="px-3 py-2 text-sm text-text-muted">
                  No sites available for your account yet.
                </li>
              )}
              {groupSitesByOrg(siteState.sites).map((group) => (
                <li key={group.orgId ?? group.orgName}>
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase text-text-muted">
                    {group.orgName}
                  </div>
                  <ul className="space-y-1 px-1 pb-2">
                    {group.sites.map((site) => {
                      const isActive = site.id === siteState.activeSiteId;
                      return (
                        <li key={site.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSite(site.id)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{site.name}</span>
                              {site.role && (
                                <span className="text-xs text-text-muted">
                                  {site.role.toLowerCase()}
                                </span>
                              )}
                            </div>
                            {savingSiteId === site.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-accent-strong" />
                            ) : (
                              isActive && (
                                <Check className="h-4 w-4 text-accent-strong" />
                              )
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
            {error && (
              <div className="border-t border-border-subtle px-3 py-2 text-xs text-status-danger">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => {
            setUserOpen((open) => !open);
            setSiteOpen(false);
          }}
          className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:ring-accent-primary"
        >
          <span className="hidden sm:inline">
            {userDisplayName ?? "Account"}
          </span>
          <span className="inline sm:hidden">
            <User className="h-4 w-4" />
          </span>
          <ChevronDown className="h-3 w-3 text-text-muted" />
        </button>

        {userOpen && (
          <div
            ref={userMenuDropdownRef}
            className="absolute right-0 top-full z-50 mt-2 w-64 -translate-x-0 rounded-xl border border-border-subtle bg-surface shadow-lg"
            style={{ right: 0, transform: "translateX(0)" }}
            role="menu"
          >
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent-strong">
                {(userDisplayName ?? userEmail ?? "U")
                  .toString()
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-primary">
                  {userDisplayName ?? "Signed-in user"}
                </span>
                {userEmail && (
                  <span className="text-xs text-text-muted">{userEmail}</span>
                )}
              </div>
            </div>

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
