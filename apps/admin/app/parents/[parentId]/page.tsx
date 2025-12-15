"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, User } from "lucide-react";
import { Badge, Button, Card } from "@pathway/ui";
import { AdminParentDetail, fetchParentById } from "../../../lib/api-client";

const statusTone: Record<AdminParentDetail["status"], "success" | "default"> = {
  active: "success",
  inactive: "default",
};

export default function ParentDetailPage() {
  const params = useParams<{ parentId: string }>();
  const router = useRouter();
  const parentId = params.parentId;

  const [parent, setParent] = React.useState<AdminParentDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await fetchParentById(parentId);
      setParent(result);
      if (!result) {
        setNotFound(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load parent";
      if (message.includes("404")) {
        setNotFound(true);
      } else {
        setError(message);
      }
      setParent(null);
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="secondary" size="sm">
          <Link href="/parents" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to parents
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button size="sm">Edit parent</Button>
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
        <Card title="Parent not found">
          <p className="text-sm text-text-muted">
            We couldn’t find a parent matching id <strong>{parentId}</strong>.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push("/parents")}>
              Back to parents
            </Button>
          </div>
        </Card>
      ) : error ? (
        <Card title="Error loading parent">
          <p className="text-sm text-text-muted">{error}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/parents")}>
              Back to parents
            </Button>
            <Button onClick={load}>Retry</Button>
          </div>
        </Card>
      ) : parent ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-text-primary font-heading">
                  {parent.fullName}
                </h1>
                <Badge variant={statusTone[parent.status]}>
                  {parent.status === "active" ? "Active" : "Inactive"}
                </Badge>
                {parent.isPrimaryContact ? (
                  <Badge variant="accent">Primary contact</Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${parent.email}`}
                    className="text-accent-strong underline-offset-2 hover:underline"
                  >
                    {parent.email}
                  </a>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {parent.phone ? (
                    <a
                      href={`tel:${parent.phone}`}
                      className="text-text-primary underline-offset-2 hover:underline"
                    >
                      {parent.phone}
                    </a>
                  ) : (
                    <span className="text-text-muted">No phone</span>
                  )}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Linked children">
            {parent.children.length === 0 ? (
              <p className="text-sm text-text-muted">No linked children.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {parent.children.map((child) => (
                  <li
                    key={child.id}
                    className="flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <User className="h-4 w-4 text-text-muted" />
                      {child.fullName}
                    </span>
                    <Link
                      href={`/children/${child.id}`}
                      className="text-accent-strong underline-offset-2 hover:underline"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-text-muted">
              TODO: ensure child links respect role/tenant access.
            </p>
          </Card>

          <Card title="Safeguarding">
            <p className="text-sm text-text-muted">
              {/* TODO (Epic 5.3): link to safeguarding view for authorised roles only; do not surface safeguarding detail here. */}
              TODO (Epic 5.3): link to safeguarding view for authorised roles
              only; do not surface safeguarding detail here.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
