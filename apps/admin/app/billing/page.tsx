"use client";

// Billing page shows plan and usage metadata only.
// Do NOT render card details, billing addresses, or raw provider payloads here.

import React from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@pathway/ui";
import { AdminBillingOverview, fetchBillingOverview } from "../../lib/api-client";

const statusTone: Record<
  AdminBillingOverview["subscriptionStatus"],
  "default" | "accent" | "success" | "warning"
> = {
  ACTIVE: "success",
  TRIALING: "accent",
  PAST_DUE: "warning",
  CANCELED: "default",
  NONE: "default",
};

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start || !end) return "Not available";
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "Not available";
  return `${s.toLocaleDateString()} → ${e.toLocaleDateString()}`;
}

const ratioLabel = (current?: number | null, cap?: number | null) => {
  if (cap === null || cap === undefined || cap <= 0) return "Usage not capped";
  if (current === null || current === undefined) return "Usage not available";
  const ratio = current / cap;
  if (ratio <= 1) return "Within plan";
  if (ratio <= 1.2) return "Over included AV30";
  return "Over hard cap";
};

const ratioPercent = (current?: number | null, cap?: number | null) => {
  if (!cap || cap <= 0 || current === null || current === undefined) return 0;
  return Math.min((current / cap) * 100, 120);
};

export default function BillingPage() {
  const [data, setData] = React.useState<AdminBillingOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchBillingOverview();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load billing overview",
      );
      setData(null);
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

  const planCard = (
    <Card title="Plan & Subscription">
      {isLoading ? (
        loadingBlock
      ) : error ? (
        <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-4 text-sm text-status-danger">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Couldn’t load billing info.</span>
            <Button size="sm" variant="secondary" onClick={load}>
              Retry
            </Button>
          </div>
          <p className="text-xs text-text-muted">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {data.planCode ?? "Unknown plan"}
            </p>
            <Badge variant={statusTone[data.subscriptionStatus] ?? "default"}>
              {data.subscriptionStatus || "Unknown"}
            </Badge>
          </div>
          <p className="text-sm text-text-muted">
            Period: {formatDateRange(data.periodStart, data.periodEnd)}
          </p>
          {data.cancelAtPeriodEnd ? (
            <p className="text-xs text-warning-strong">
              Cancels at the end of this period.
            </p>
          ) : (
            <p className="text-xs text-text-muted">Renews automatically at period end.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Billing doesn’t appear to be configured yet for this organisation.
        </p>
      )}
    </Card>
  );

  const av30Card = (
    <Card title="AV30 Usage">
      {isLoading ? (
        loadingBlock
      ) : error ? (
        <p className="text-sm text-status-danger">Unable to load AV30 usage.</p>
      ) : data ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Current</span>
            <span className="font-semibold text-text-primary">
              {data.currentAv30 ?? "—"}
              {data.av30Cap ? ` / ${data.av30Cap}` : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${ratioPercent(data.currentAv30, data.av30Cap)}%` }}
            />
          </div>
          <p className="text-xs text-text-muted">
            {ratioLabel(data.currentAv30, data.av30Cap)}
          </p>
          <p className="text-xs text-text-muted">
            {/* TODO: keep AV30 thresholds visually in sync with backend enforcement (soft/grace/hard caps). */}
            TODO: keep AV30 thresholds visually in sync with backend enforcement (soft/grace/hard caps).
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-muted">No AV30 data available.</p>
      )}
    </Card>
  );

  const limitsCard = (
    <Card title="Usage Limits">
      {isLoading ? (
        loadingBlock
      ) : error ? (
        <p className="text-sm text-status-danger">
          Unable to load usage limits.
        </p>
      ) : data ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border-subtle bg-surface px-3 py-2">
            <p className="text-xs text-text-muted">Storage</p>
            <p className="text-sm font-semibold text-text-primary">
              {data.storageGbUsage ?? "—"} / {data.storageGbCap ?? "—"} GB
            </p>
          </div>
          <div className="rounded-md border border-border-subtle bg-surface px-3 py-2">
            <p className="text-xs text-text-muted">SMS (month)</p>
            <p className="text-sm font-semibold text-text-primary">
              {data.smsMonthUsage ?? "—"} / {data.smsMessagesCap ?? "—"}
            </p>
          </div>
          <div className="rounded-md border border-border-subtle bg-surface px-3 py-2">
            <p className="text-xs text-text-muted">Leader seats included</p>
            <p className="text-sm font-semibold text-text-primary">
              {data.leaderSeatsIncluded ?? "—"}
            </p>
          </div>
          <div className="rounded-md border border-border-subtle bg-surface px-3 py-2">
            <p className="text-xs text-text-muted">Max sites</p>
            <p className="text-sm font-semibold text-text-primary">
              {data.maxSites ?? "—"}
            </p>
          </div>
          <p className="col-span-full text-xs text-text-muted">
            Some limits may be unset; contact support if these look incomplete.
          </p>
        </div>
      ) : (
        <p className="text-sm text-text-muted">No limits available.</p>
      )}
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            Billing & Usage
          </h1>
          <p className="text-sm text-text-muted">
            Plan and usage overview for this organisation. Payment details stay in your billing provider.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>
      {/* UI intentionally avoids showing any payment method PII; this is a usage/plan summary only. */}
      <div className="grid gap-4 md:grid-cols-2">
        {planCard}
        {av30Card}
        {limitsCard}
      </div>
      <div className="text-sm text-text-muted">
        <Link
          href="/reports"
          className="text-xs font-semibold text-accent-strong underline-offset-2 hover:underline"
        >
          View detailed reports
        </Link>
      </div>
    </div>
  );
}
