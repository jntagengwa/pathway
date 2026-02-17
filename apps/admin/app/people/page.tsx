"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  type ColumnDef,
} from "@pathway/ui";
import {
  fetchActiveSiteState,
  fetchPeopleForOrg,
  fetchInvitesForOrg,
  resendInvite,
  revokeInvite,
  type PersonRow,
  type InviteRow,
} from "../../lib/api-client";
import { getSafeDisplayName } from "../../lib/names";
import { useAdminAccess } from "../../lib/use-admin-access";
import { canPerform } from "../../lib/permissions";

const resolveOrgId = (activeSiteId: string | null, sites: Array<{ id: string; orgId: string }>) => {
  const activeSite = sites.find((site) => site.id === activeSiteId) ?? sites[0];
  return activeSite?.orgId ?? null;
};

export default function PeoplePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { role, userId: apiUserId, isLoading: isLoadingAccess } = useAdminAccess();
  const [people, setPeople] = React.useState<PersonRow[]>([]);
  const [invites, setInvites] = React.useState<InviteRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [orgId, setOrgId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"people" | "invites">("people");

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!orgId) {
        throw new Error("Active organisation not found.");
      }
      const [peopleData, invitesData] = await Promise.all([
        fetchPeopleForOrg(orgId),
        fetchInvitesForOrg(orgId, "pending"),
      ]);
      setPeople(peopleData);
      setInvites(invitesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  React.useEffect(() => {
    // Only load data when session is authenticated
    if (sessionStatus !== "authenticated" || !session) return;
    const loadOrg = async () => {
      try {
        const state = await fetchActiveSiteState();
        const resolvedOrgId = resolveOrgId(state.activeSiteId, state.sites);
        setOrgId(resolvedOrgId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load active site");
      }
    };
    void loadOrg();
  }, [sessionStatus, session]);

  React.useEffect(() => {
    if (!orgId) return;
    void load();
  }, [orgId, load]);

  const handleResendInvite = React.useCallback(async (inviteId: string) => {
    try {
      if (!orgId) {
        throw new Error("Active organisation not found.");
      }
      await resendInvite(orgId, inviteId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invite");
    }
  }, [orgId, load]);

  const handleRevokeInvite = React.useCallback(async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invite?")) return;
    try {
      if (!orgId) {
        throw new Error("Active organisation not found.");
      }
      await revokeInvite(orgId, inviteId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invite");
    }
  }, [orgId, load]);

  const filteredPeople = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return people;
    return people.filter(
      (p) => {
        const displayName = getSafeDisplayName({ displayName: p.displayName, name: p.name, email: p.email });
        return (
          displayName.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query)
        );
      },
    );
  }, [people, searchQuery]);

  const filteredInvites = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return invites;
    return invites.filter((inv) => inv.email.toLowerCase().includes(query));
  }, [invites, searchQuery]);

  const canEditPeople = canPerform("people:edit", role);
  const sessionUserId = (session?.user as { id?: string })?.id ?? null;
  const currentUserId = sessionUserId || apiUserId || null;

  const peopleColumns = React.useMemo<ColumnDef<PersonRow>[]>(
    () => {
      const cols: ColumnDef<PersonRow>[] = [
        {
          id: "name",
          header: "Name",
          cell: (row) => (
            <div className="flex flex-col">
              <span className="font-semibold text-text-primary">
                {getSafeDisplayName({ displayName: row.displayName, name: row.name, email: row.email })}
              </span>
              <span className="text-sm text-text-muted">{row.email}</span>
            </div>
          ),
        },
        {
          id: "orgRole",
          header: "Org role",
          cell: (row) => (
            <Badge variant="default">{row.orgRole}</Badge>
          ),
          width: "140px",
        },
        {
          id: "siteAccess",
          header: "Site access",
          cell: (row) => (
            <span className="text-sm text-text-secondary">
              {row.siteAccessSummary.allSites
                ? "All sites"
                : `${row.siteAccessSummary.siteCount} site(s)`}
            </span>
          ),
          width: "140px",
        },
      ];
      if (canEditPeople) {
        cols.push({
          id: "actions",
          header: "",
          cell: (row) => {
            const isCurrentUser =
              !!currentUserId && currentUserId === row.id;
            const href = isCurrentUser ? "/staff/profile" : `/people/${row.id}`;
            return (
              <Button asChild variant="secondary" size="sm">
                <Link href={href}>Profile</Link>
              </Button>
            );
          },
          width: "100px",
        });
      }
      return cols;
    },
    [canEditPeople, currentUserId],
  );

  const inviteColumns = React.useMemo<ColumnDef<InviteRow>[]>(
    () => [
      {
        id: "email",
        header: "Email",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-text-primary">{row.email}</span>
            {row.siteAccessMode && (
              <span className="text-xs text-text-muted">
                {row.siteAccessMode === "ALL_SITES"
                  ? "All sites"
                  : `${row.siteCount} site(s)`}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "role",
        header: "Roles",
        cell: (row) => (
          <div className="flex flex-col gap-1">
            {row.orgRole && <Badge variant="default">{row.orgRole}</Badge>}
            {row.siteRole && <Badge variant="accent">{row.siteRole}</Badge>}
          </div>
        ),
        width: "160px",
      },
      {
        id: "expires",
        header: "Expires",
        cell: (row) => (
          <span className="text-sm text-text-secondary">
            {new Date(row.expiresAt).toLocaleDateString()}
          </span>
        ),
        width: "120px",
      },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleResendInvite(row.id)}
            >
              Resend
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRevokeInvite(row.id)}
            >
              Revoke
            </Button>
          </div>
        ),
        width: "180px",
      },
    ],
    [handleResendInvite, handleRevokeInvite],
  );

  if (isLoadingAccess) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const canInvite = canPerform("people:invite", role);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            People
          </h1>
          <p className="text-sm text-text-muted">
            Manage org members and site access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          {canInvite && (
            <Button size="sm" onClick={() => router.push("/people/invite")}>
              + Invite person
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab("people")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "people"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          People ({people.length})
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "invites"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Pending invites ({invites.length})
        </button>
      </div>

      {/* Data Card */}
      <Card
        title={activeTab === "people" ? "Organisation members" : "Pending invitations"}
        description={
          activeTab === "people"
            ? "Users with access to this organisation and its sites"
            : "Invitations sent but not yet accepted"
        }
        actions={
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        }
      >
        {isLoading ? (
          <div className="py-8 text-center text-sm text-text-muted">
            Loading...
          </div>
        ) : activeTab === "people" ? (
          <DataTable
            columns={peopleColumns}
            data={filteredPeople}
            emptyMessage="No people found. Invite someone to get started."
          />
        ) : (
          <DataTable
            columns={inviteColumns}
            data={filteredInvites}
            emptyMessage="No pending invites."
          />
        )}
      </Card>
    </div>
  );
}
