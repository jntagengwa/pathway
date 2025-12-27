"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ResourceMeta } from "../../../lib/resources";

interface ResourcesClientProps {
  initialResources: ResourceMeta[];
  initialSectors: string[];
}

export default function ResourcesClient({
  initialResources,
  initialSectors,
}: ResourcesClientProps) {
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter resources
  const filteredResources = useMemo(() => {
    return initialResources.filter((resource) => {
      // Sector filter
      if (selectedSector !== "all" && !resource.sectors.includes(selectedSector)) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = resource.title.toLowerCase().includes(query);
        const matchesDescription = resource.description.toLowerCase().includes(query);
        const matchesTags = resource.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [initialResources, selectedSector, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 md:py-24">
      {/* Hero */}
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold text-pw-text md:text-5xl">Resources & Guides</h1>
        <p className="text-lg text-pw-text-muted md:text-xl">
          Practical guides for schools, clubs, churches, and charities using Nexsteps.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSector("all")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              selectedSector === "all"
                ? "bg-pw-primary text-white"
                : "bg-white text-pw-text border border-pw-border hover:bg-pw-surface"
            }`}
          >
            All
          </button>
          {initialSectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition capitalize ${
                selectedSector === sector
                  ? "bg-pw-primary text-white"
                  : "bg-white text-pw-text border border-pw-border hover:bg-pw-surface"
              }`}
            >
              {sector}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-md border border-pw-border bg-white px-4 py-2 text-sm text-pw-text placeholder:text-pw-text-muted focus:outline-none focus:ring-2 focus:ring-pw-primary"
        />
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="rounded-xl border border-pw-border bg-white p-8 text-center">
          <p className="text-pw-text-muted">No resources found matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <Link
              key={resource.slug}
              href={`/resources/${resource.slug}`}
              className="flex flex-col rounded-xl border border-pw-border bg-white p-6 shadow-sm transition hover:border-pw-primary/60 hover:shadow-md"
            >
              {resource.featured && (
                <span className="mb-2 inline-block w-fit rounded-full bg-pw-primary/10 px-3 py-1 text-xs font-medium text-pw-primary">
                  Featured
                </span>
              )}
              <h3 className="mb-2 text-xl font-semibold text-pw-text">{resource.title}</h3>
              <p className="mb-4 flex-1 text-sm text-pw-text-muted">{resource.description}</p>

              <div className="mb-4 flex flex-wrap gap-2">
                {resource.sectors.map((sector) => (
                  <span
                    key={sector}
                    className="rounded-full bg-pw-surface px-2 py-1 text-xs font-medium text-pw-text capitalize"
                  >
                    {sector}
                  </span>
                ))}
                {resource.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-pw-surface px-2 py-1 text-xs font-medium text-pw-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-pw-text-muted">
                <span>Published {formatDate(resource.publishedAt)}</span>
                {resource.readingTimeMinutes && (
                  <span>{resource.readingTimeMinutes} min read</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

