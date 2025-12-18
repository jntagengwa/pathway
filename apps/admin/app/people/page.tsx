"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Select,
  type ColumnDef,
} from "@pathway/ui";
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<
    "all" | "teacher" | "staff" | "admin" | "coordinator"
  >("all");

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

  const filteredData = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matchesRole = (row: AdminStaffRow) => {
      if (roleFilter === "all") return true;
      const rolesText = row.rolesLabel?.toLowerCase() ?? "";
      switch (roleFilter) {
        case "teacher":
          return rolesText.includes("teacher");
        case "staff":
          return rolesText.includes("staff");
        case "admin":
          return rolesText.includes("admin");
        case "coordinator":
          return rolesText.includes("coordinator");
        default:
          return true;
      }
    };

    return data.filter((row) => {
      const matchesQuery = query
        ? (row.fullName?.toLowerCase() ?? "").includes(query)
        : true;
      return matchesQuery && matchesRole(row);
    });
  }, [data, searchQuery, roleFilter]);

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
          <>
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff…"
                className="md:max-w-xs"
                aria-label="Search staff"
              />
              <Select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value as typeof roleFilter)
                }
                className="md:w-48"
                aria-label="Filter by role"
              >
                <option value="all">All roles</option>
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="coordinator">Coordinator</option>
              </Select>
            </div>
            <DataTable
              data={filteredData}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="No staff or volunteers found for this organisation yet."
              onRowClick={(row) => router.push(`/people/${row.id}`)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
