"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Textarea,
} from "@pathway/ui";
import {
  AdminPlanPreview,
  createBuyNowCheckout,
  previewPlanSelection,
} from "../../../lib/api-client";

const planOptions = [
  {
    code: "STARTER_MONTHLY",
    label: "Starter",
    description: "For single-site organisations getting started.",
    baseAv30: 50,
    baseSites: 1,
    tier: "starter",
  },
  {
    code: "GROWTH_MONTHLY",
    label: "Growth",
    description: "For growing orgs with multiple groups/sites.",
    baseAv30: 200,
    baseSites: 3,
    tier: "growth",
  },
  {
    code: "ENTERPRISE_CONTACT",
    label: "Enterprise (contact us)",
    description: "Custom plan and onboarding – we’ll be in touch.",
    baseAv30: null,
    baseSites: null,
    tier: "enterprise",
  },
] as const;

type PlanCode = (typeof planOptions)[number]["code"];

const clampNonNegative = (value: number | null | undefined) =>
  Math.max(0, Number.isFinite(value as number) ? Math.trunc(value as number) : 0);

const warningCopy: Record<string, string> = {
  price_not_included: "Pricing shows in checkout, not in this page.",
  mock_mode: "Running against mock data; for development only.",
  unknown_plan_code: "Plan code not recognised; caps may be incomplete.",
};

export default function BuyNowPage() {
  const router = useRouter();
  const [planCode, setPlanCode] = React.useState<PlanCode>("STARTER_MONTHLY");
  const [extraAv30Blocks, setExtraAv30Blocks] = React.useState(0);
  const [extraSites, setExtraSites] = React.useState(0);
  const [extraStorageGb, setExtraStorageGb] = React.useState(0);
  const [extraSmsMessages, setExtraSmsMessages] = React.useState(0);
  const [extraLeaderSeats, setExtraLeaderSeats] = React.useState(0);

  const [orgName, setOrgName] = React.useState("");
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [preview, setPreview] = React.useState<AdminPlanPreview | null>(null);
  const [previewWarnings, setPreviewWarnings] = React.useState<string[]>([]);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);

  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = React.useState(false);

  const loadPreview = React.useCallback(async () => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await previewPlanSelection({
        planCode,
        extraAv30Blocks,
        extraSites,
        extraStorageGb,
        extraSmsMessages,
        extraLeaderSeats,
      });
      setPreview(result);
      setPreviewWarnings(result.warnings ?? []);
    } catch (err) {
      setPreview(null);
      setPreviewWarnings([]);
      setPreviewError(
        err instanceof Error
          ? err.message
          : "We couldn’t load a plan preview just now.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }, [
    planCode,
    extraAv30Blocks,
    extraSites,
    extraStorageGb,
    extraSmsMessages,
    extraLeaderSeats,
  ]);

  // Debounce preview calls
  React.useEffect(() => {
    const handle = setTimeout(() => {
      void loadPreview();
    }, 300);
    return () => clearTimeout(handle);
  }, [
    loadPreview,
    planCode,
    extraAv30Blocks,
    extraSites,
    extraStorageGb,
    extraSmsMessages,
    extraLeaderSeats,
  ]);

  const handleCheckout = async () => {
    setCheckoutError(null);
    if (!planCode || !orgName || !contactName || !contactEmail) {
      setCheckoutError("Please complete required fields before continuing.");
      return;
    }
    setIsCheckoutLoading(true);
    try {
      const origin =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : "";
      const successUrl = origin ? `${origin}/billing/buy-now?status=success` : undefined;
      const cancelUrl = origin ? `${origin}/billing/buy-now?status=cancel` : undefined;
      const response = await createBuyNowCheckout({
        planCode,
        extraAv30Blocks,
        extraSites,
        extraStorageGb,
        extraSmsMessages,
        extraLeaderSeats,
        successUrl,
        cancelUrl,
        org: {
          orgName,
          contactName,
          contactEmail,
          notes: notes || null,
        },
      });
      const warnings = response.warnings ?? [];
      setPreviewWarnings((prev) => Array.from(new Set([...prev, ...warnings])));
      window.location.href = response.sessionUrl;
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : "We couldn’t start checkout. Please try again.",
      );
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const renderWarnings = (warnings: string[]) => {
    if (!warnings?.length) return null;
    return (
      <div className="flex flex-wrap gap-2 text-xs">
        {warnings.map((w) => (
          <Badge key={w} variant="secondary">
            {warningCopy[w] ?? "Please review your selection."}
          </Badge>
        ))}
      </div>
    );
  };

  const selectedPlan = planOptions.find((p) => p.code === planCode);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            Buy Now
          </h1>
          <p className="text-sm text-text-muted">
            Choose a plan and capacity for your organisation. Pricing is shown in checkout.
          </p>
        </div>
        <Link
          href="/billing"
          className="text-sm font-semibold text-accent-strong underline-offset-2 hover:underline"
        >
          ← Back to billing
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card title="Plan selection">
            <div className="grid gap-3">
              {planOptions.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => {
                    setPlanCode(plan.code);
                    if (plan.code === "ENTERPRISE_CONTACT") {
                      setExtraAv30Blocks(0);
                    }
                  }}
                  className={`flex w-full items-start justify-between rounded-lg border px-4 py-3 text-left transition ${
                    plan.code === planCode
                      ? "border-accent ring-2 ring-accent/40"
                      : "border-border-subtle hover:border-accent/60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {plan.label}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {plan.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted">{plan.description}</p>
                    <p className="text-xs text-text-muted">
                      AV30 included: {plan.baseAv30 ?? "Custom"} · Sites:{" "}
                      {plan.baseSites ?? "Custom"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Add-ons">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="extraAv30Blocks">Extra AV30 blocks</Label>
                <Input
                  id="extraAv30Blocks"
                  type="number"
                  min={0}
                  value={extraAv30Blocks}
                  onChange={(e) =>
                    setExtraAv30Blocks(clampNonNegative(Number(e.target.value)))
                  }
                />
                <p className="text-xs text-text-muted">
                  Each block adds 25 Active People capacity.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="extraSites">Additional sites</Label>
                <Input
                  id="extraSites"
                  type="number"
                  min={0}
                  value={extraSites}
                  onChange={(e) =>
                    setExtraSites(clampNonNegative(Number(e.target.value)))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="extraStorageGb">Extra storage (GB)</Label>
                <Input
                  id="extraStorageGb"
                  type="number"
                  min={0}
                  value={extraStorageGb}
                  onChange={(e) =>
                    setExtraStorageGb(clampNonNegative(Number(e.target.value)))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="extraSmsMessages">Extra SMS (messages)</Label>
                <Input
                  id="extraSmsMessages"
                  type="number"
                  min={0}
                  value={extraSmsMessages}
                  onChange={(e) =>
                    setExtraSmsMessages(clampNonNegative(Number(e.target.value)))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="extraLeaderSeats">Extra leader seats</Label>
                <Input
                  id="extraLeaderSeats"
                  type="number"
                  min={0}
                  value={extraLeaderSeats}
                  onChange={(e) =>
                    setExtraLeaderSeats(clampNonNegative(Number(e.target.value)))
                  }
                />
              </div>
            </div>
          </Card>

          <Card title="Organisation contact">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="orgName">Organisation name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactName">Contact name</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any context for our team (kept internal)."
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Preview & summary">
            <div className="space-y-3">
              {isPreviewLoading ? (
                <p className="text-sm text-text-muted">Loading preview…</p>
              ) : previewError ? (
                <div className="space-y-2 text-sm text-status-danger">
                  <p>{previewError}</p>
                  <Button size="sm" variant="secondary" onClick={() => void loadPreview()}>
                    Retry preview
                  </Button>
                </div>
              ) : preview ? (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-text-primary">
                    {selectedPlan?.label ?? preview.planCode ?? "Selected plan"}
                  </p>
                  <p className="text-text-muted">
                    AV30 cap: {preview.effectiveAv30Cap ?? "Custom / pending"}
                  </p>
                  <p className="text-text-muted">
                    Sites: {preview.effectiveSitesCap ?? "Custom / pending"}
                  </p>
                  <p className="text-text-muted">
                    Storage: {preview.effectiveStorageGbCap ?? "Not specified"}
                  </p>
                  <p className="text-text-muted">
                    SMS: {preview.effectiveSmsMessagesCap ?? "Not specified"}
                  </p>
                  <p className="text-text-muted">
                    Leader seats: {preview.effectiveLeaderSeatsIncluded ?? "Not specified"}
                  </p>
                  {renderWarnings(previewWarnings)}
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  Select a plan to see the included caps.
                </p>
              )}
            </div>
          </Card>

          <Card title="Checkout">
            <div className="space-y-3 text-sm">
              <p className="text-text-muted">
                Continuing will open the checkout session with the current selection. No card
                details are collected in this app.
              </p>
              {checkoutError && (
                <div className="rounded-md border border-status-danger/30 bg-status-danger/5 px-3 py-2 text-xs text-status-danger">
                  {checkoutError}
                </div>
              )}
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? "Starting checkout..." : "Continue to checkout"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

