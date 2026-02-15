"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Download, User, Users } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@pathway/ui";
import { canAccessAdminSection, canAccessSafeguardingAdmin } from "../../../lib/access";
import { useAdminAccess } from "../../../lib/use-admin-access";
import {
  AdminChildDetail,
  exportAttendanceCsv,
  fetchChildById,
} from "../../../lib/api-client";

const statusTone: Record<AdminChildDetail["status"], "success" | "default"> = {
  active: "success",
  inactive: "default",
};

export default function ChildDetailPage() {
  const params = useParams<{ childId: string }>();
  const router = useRouter();
  const childId = params.childId;

  const [child, setChild] = React.useState<AdminChildDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [photoLoadError, setPhotoLoadError] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [exportFrom, setExportFrom] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [exportTo, setExportTo] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const { role, isLoading: isLoadingAccess } = useAdminAccess();
  const isAdmin = canAccessAdminSection(role);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchChildById(childId);
      setChild(result);
      setPhotoLoadError(false);
      if (!result) {
        setNotFound(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load child";
      if (message.includes("404")) {
        setNotFound(true);
      } else {
        setError(message);
      }
      setChild(null);
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const renderFlag = (
    condition: boolean,
    label: string,
    positiveVariant: "success" | "warning" | "accent" | "default" = "success",
  ) => (
    <Badge variant={condition ? positiveVariant : "default"}>
      {condition ? label : `No ${label.toLowerCase()}`}
    </Badge>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="secondary" size="sm">
          <Link href="/children" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to children
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {!isLoadingAccess && canAccessSafeguardingAdmin(role) ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/safeguarding">View in Safeguarding</Link>
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button asChild size="sm">
              <Link href={`/children/${childId}/edit`}>Edit child</Link>
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </div>
          </Card>
          <Card>
            <div className="flex flex-col gap-3">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </Card>
        </div>
      ) : notFound ? (
        <Card title="Child Not Found">
          <p className="text-sm text-text-muted">
            We couldn’t find a child matching id <strong>{childId}</strong>.
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => router.push("/children")}
            >
              Back to children
            </Button>
          </div>
        </Card>
      ) : error ? (
        <Card title="Error Loading Child">
          <p className="text-sm text-text-muted">{error}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/children")}
            >
              Back to children
            </Button>
            <Button onClick={load}>Retry</Button>
          </div>
        </Card>
      ) : child ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {child.hasPhotoConsent ? (
                  <div
                    className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-accent"
                    aria-hidden
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-accent-foreground">
                      {child.fullName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    {!photoLoadError && (
                      <img
                        src={`/api/children/${child.id}/photo`}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={() => setPhotoLoadError(true)}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    aria-hidden
                  >
                    <User className="h-5 w-5" />
                  </div>
                )}
                <h1 className="text-2xl font-semibold text-text-primary font-heading">
                  {child.fullName}
                </h1>
                <Badge variant={statusTone[child.status]}>
                  {child.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              {child.preferredName ? (
                <p className="text-sm text-text-muted">
                  Preferred name: {child.preferredName}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {child.ageGroupLabel ?? "Age group TBD"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4" />
                  Primary group: {child.primaryGroupLabel ?? "Unassigned"}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Flags">
            <div className="flex flex-wrap gap-2 text-sm">
              {renderFlag(child.hasAllergies, "Allergies", "warning")}
              {renderFlag(
                child.hasAdditionalNeeds,
                "Additional needs",
                "accent",
              )}
              {renderFlag(child.hasPhotoConsent, "Photo consent", "success")}
            </div>
            <p className="mt-3 text-sm text-text-muted">
              Avatars are shown only when photo consent is given.
            </p>
          </Card>

          <Card title="Groups">
            <div className="space-y-2 text-sm text-text-primary">
              <div>
                Primary group/class: {child.primaryGroupLabel ?? "Unassigned"}
              </div>
              <div>Age group: {child.ageGroupLabel ?? "Not set"}</div>
            </div>
          </Card>

          {isAdmin && (
            <Card
              title="Export attendance record"
              description="Download this child's attendance for a date range."
              className="min-w-0"
            >
              <div className="flex min-w-0 flex-col flex-wrap gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <Label htmlFor="child-export-from">From</Label>
                  <div className="max-w-[10rem] overflow-hidden">
                    <Input
                      id="child-export-from"
                      type="date"
                      value={exportFrom}
                      onChange={(e) => setExportFrom(e.target.value)}
                      className="w-full min-w-0"
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <Label htmlFor="child-export-to">To</Label>
                  <div className="max-w-[10rem] overflow-hidden">
                    <Input
                      id="child-export-to"
                      type="date"
                      value={exportTo}
                      onChange={(e) => setExportTo(e.target.value)}
                      className="w-full min-w-0"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={exporting}
                  onClick={async () => {
                    setExporting(true);
                    try {
                      await exportAttendanceCsv({
                        scope: "child",
                        id: childId,
                        from: exportFrom,
                        to: exportTo,
                      });
                    } finally {
                      setExporting(false);
                    }
                  }}
                >
                  <Download className="mr-1 h-4 w-4" />
                  {exporting ? "Exporting…" : "Export CSV"}
                </Button>
              </div>
            </Card>
          )}

          <Card title="Safeguarding">
            <p className="text-sm text-text-muted">
              Safeguarding view is available to authorised roles from the Safeguarding section. No safeguarding detail is shown here.
            </p>
            {!isLoadingAccess && canAccessSafeguardingAdmin(role) ? (
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/safeguarding">View in Safeguarding</Link>
              </Button>
            ) : null}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
