"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Users } from "lucide-react";
import { Badge, Button, Card } from "@pathway/ui";
import { AdminChildDetail, fetchChildById } from "../../../lib/api-client";

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

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchChildById(childId);
      setChild(result);
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
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button size="sm">Edit child</Button>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {child.fullName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
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

          <Card title="Safeguarding">
            <p className="text-sm text-text-muted">
              Safeguarding view is available to authorised roles from the Safeguarding section.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
