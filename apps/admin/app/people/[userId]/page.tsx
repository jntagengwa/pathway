"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { Badge, Button, Card } from "@pathway/ui";
import {
  AdminStaffDetail,
  fetchStaffById,
} from "../../../lib/api-client";

const statusTone: Record<AdminStaffDetail["status"], "success" | "default" | "warning"> = {
  active: "success",
  inactive: "default",
  unknown: "warning",
};

export default function StaffDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const userId = params.userId;

  const [staff, setStaff] = React.useState<AdminStaffDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchStaffById(userId);
      if (!result) {
        setNotFound(true);
        setStaff(null);
      } else {
        setStaff(result);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load profile",
      );
      setStaff(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="secondary" size="sm">
          <Link href="/people" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to people
          </Link>
        </Button>
        <Button variant="secondary" size="sm" onClick={load}>
          Refresh
        </Button>
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
        <Card title="Staff Member Not Found">
          <p className="text-sm text-text-muted">
            We couldn’t find a staff profile for id <strong>{userId}</strong>.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push("/people")}>
              Back to people
            </Button>
          </div>
        </Card>
      ) : error ? (
        <Card title="Something Went Wrong">
          <p className="text-sm text-text-muted">{error}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/people")}>
              Back
            </Button>
            <Button onClick={load}>Retry</Button>
          </div>
        </Card>
      ) : staff ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-text-primary font-heading">
                  {staff.fullName}
                </h1>
                <Badge variant={statusTone[staff.status]}>
                  {staff.status === "active"
                    ? "Active"
                    : staff.status === "inactive"
                      ? "Inactive"
                      : "Unknown"}
                </Badge>
              </div>
              {staff.primaryRoleLabel ? (
                <p className="text-sm text-text-muted">{staff.primaryRoleLabel}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {staff.email ? (
                    <a
                      href={`mailto:${staff.email}`}
                      className="text-accent-strong underline-offset-2 hover:underline"
                    >
                      {staff.email}
                    </a>
                  ) : (
                    <span className="text-text-muted">No email</span>
                  )}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Roles">
            <div className="flex flex-wrap gap-2 text-sm">
              {staff.roles.length === 0 ? (
                <span className="text-text-muted">No roles recorded.</span>
              ) : (
                staff.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-text-muted">
              {/* PEOPLE: profile metadata only. No auth tokens or audit logs. */}
              PEOPLE: profile metadata only. No auth tokens or audit logs.
            </p>
          </Card>

          <Card title="Groups & Assignments">
            {staff.groups && staff.groups.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {staff.groups.map((g) => (
                  <li key={g.id} className="text-text-primary">
                    {g.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">No groups recorded.</p>
            )}
            {typeof staff.sessionsCount === "number" ? (
              <p className="mt-2 text-xs text-text-muted">
                Active on {staff.sessionsCount} sessions recently.
              </p>
            ) : null}
            <p className="mt-3 text-xs text-text-muted">
              {/* TODO: populate groups/assignments once API exposes links. */}
              TODO: populate groups/assignments once API exposes links.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

