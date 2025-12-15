"use client";

import React from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@pathway/ui";
import {
  AdminOrgOverview,
  AdminRetentionOverview,
  fetchOrgOverview,
  fetchRetentionOverview,
} from "../../lib/api-client";

// This page is a human-friendly summary; avoid rendering raw config JSON, secrets, or debug dumps.

export default function SettingsPage() {
  const [org, setOrg] = React.useState<AdminOrgOverview | null>(null);
  const [retention, setRetention] = React.useState<AdminRetentionOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [orgData, retentionData] = await Promise.all([
        fetchOrgOverview(),
        fetchRetentionOverview(),
      ]);
      setOrg(orgData);
      setRetention(retentionData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load settings overview",
      );
      setOrg(null);
      setRetention(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const loadingBlock = (
    <div className="space-y-2">
      <span className="block h-3 w-32 animate-pulse rounded bg-muted" />
      <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
      <span className="block h-3 w-20 animate-pulse rounded bg-muted" />
    </div>
  );

  const orgCard = (
    <Card title="Organisation Profile">
      {isLoading ? (
        loadingBlock
      ) : error ? (
        <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-4 text-sm text-status-danger">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">
              Couldn’t load organisation information.
            </span>
            <Button size="sm" variant="secondary" onClick={load}>
              Retry
            </Button>
          </div>
          <p className="text-xs text-text-muted">{error}</p>
        </div>
      ) : org ? (
        <div className="space-y-2">
          <p className="text-lg font-semibold text-text-primary">{org.name}</p>
          <p className="text-sm text-text-muted">
            Slug: {org.slug || "Not configured"}
          </p>
          <p className="text-sm text-text-muted">
            {org.isMultiSite ? "Multi-site organisation" : "Single-site organisation"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Organisation information is not available.
        </p>
      )}
    </Card>
  );

  const planCard = (
    <Card title="Sites & Plan">
      {isLoading ? (
        loadingBlock
      ) : error ? (
        <p className="text-sm text-status-danger">
          Unable to load plan information.
        </p>
      ) : org ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Plan</span>
            {org.planTier ? (
              <Badge variant="secondary">{org.planTier}</Badge>
            ) : (
              <span className="text-sm text-text-muted">Not set</span>
            )}
          </div>
          <p className="text-sm text-text-muted">
            {org.siteCount ? `${org.siteCount} sites on this plan.` : "Site count not available."}
          </p>
          <Link
            href="/billing"
            className="text-xs font-semibold text-accent-strong underline-offset-2 hover:underline"
          >
            See full billing and usage details.
          </Link>
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Plan tier and site count will appear here once available.
        </p>
      )}
    </Card>
  );

  const retentionCard = (
    <Card title="Data Retention">
      {isLoading ? (
        loadingBlock
      ) : error ? (
        <p className="text-sm text-status-danger">
          Unable to load retention information.
        </p>
      ) : retention &&
        (retention.attendanceRetentionYears ||
          retention.safeguardingRetentionYears ||
          retention.notesRetentionYears) ? (
        <ul className="space-y-2 text-sm text-text-primary">
          {retention.attendanceRetentionYears ? (
            <li>
              Attendance retained for {retention.attendanceRetentionYears} years.
            </li>
          ) : null}
          {retention.safeguardingRetentionYears ? (
            <li>
              Safeguarding concerns retained for {retention.safeguardingRetentionYears} years.
            </li>
          ) : null}
          {retention.notesRetentionYears ? (
            <li>Notes retained for {retention.notesRetentionYears} years.</li>
          ) : null}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">
          Retention policies are configured per organisation. Key retention periods will appear here
          once available.
        </p>
      )}
      <p className="mt-3 text-xs text-text-muted">
        {/* SETTINGS: high-level retention config only; detailed policy text belongs in docs, not raw JSON here. */}
        SETTINGS: high-level retention config only; detailed policy text belongs in docs, not raw JSON
        here.
      </p>
    </Card>
  );

  const linksCard = (
    <Card title="Safeguarding & Billing Locations">
      <div className="space-y-2 text-sm text-text-muted">
        <p>
          Safeguarding information is available under{" "}
          <Link
            href="/safeguarding"
            className="text-accent-strong underline-offset-2 hover:underline"
          >
            Safeguarding
          </Link>
          .
        </p>
        <p>
          Plan, AV30 usage, and limits are summarised on the{" "}
          <Link
            href="/billing"
            className="text-accent-strong underline-offset-2 hover:underline"
          >
            Billing
          </Link>{" "}
          page.
        </p>
        <p>
          DSAR exports are accessed through internal safeguarding/admin workflows.
        </p>
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            Settings & Organisation
          </h1>
          <p className="text-sm text-text-muted">
            Organisation details, plan tier, and key data policies for this PathWay account.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {orgCard}
        {planCard}
        {retentionCard}
        {linksCard}
      </div>
    </div>
  );
}
