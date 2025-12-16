"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, DataTable, type ColumnDef } from "@pathway/ui";
import { AdminStaffRow, fetchStaff } from "../../lib/api-client";

const statusTone: Record<AdminStaffRow["status"], "success" | "default" | "warning"> = {
  active: "success",
  inactive: "default",
  unknown: "warning",
};

export default function PeoplePage() {
  const router = useRouter();
  const [data, setData] = React.useState<AdminStaffRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchStaff();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load people");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns = React.useMemo<ColumnDef<AdminStaffRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary">{row.fullName}</span>
            <span className="text-xs text-text-muted">{row.rolesLabel}</span>
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (row) =>
          row.email ? (
            <a
              href={`mailto:${row.email}`}
              className="text-sm text-accent-strong underline-offset-2 hover:underline"
            >
              {row.email}
            </a>
          ) : (
            <span className="text-sm text-text-muted">—</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={statusTone[row.status]}>{row.status}</Badge>
        ),
        align: "center",
        width: "120px",
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-heading">
            People & Staff
          </h1>
          <p className="text-sm text-text-muted">
            Staff and volunteers with access to PathWay in this organisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button size="sm" disabled>
            Add person
          </Button>
        </div>
      </div>
      <Card title="People & Staff">
        {error ? (
          <div className="rounded-md border border-status-danger/20 bg-status-danger/5 p-4 text-sm text-status-danger">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">Couldn’t load people yet.</span>
              <Button size="sm" variant="secondary" onClick={load}>
                Retry
              </Button>
            </div>
            <p className="text-xs text-text-muted">{error}</p>
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No staff or volunteers found for this organisation yet."
            onRowClick={(row) => router.push(`/people/${row.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
