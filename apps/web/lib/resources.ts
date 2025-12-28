/**
 * Resources loader for MDX content.
 * Reads MDX files from content/resources and provides typed access.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export type ResourceMeta = {
  slug: string;
  title: string;
  description: string;
  sectors: string[];
  tags: string[];
  publishedAt: string;
  featured: boolean;
  readingTimeMinutes?: number;
};

export type Resource = ResourceMeta & {
  content: string;
  serializedContent: MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>;
};

const resourcesDirectory = path.join(process.cwd(), "content/resources");

/**
 * Get all resource metadata (sorted by publishedAt, newest first).
 */
export function getAllResources(): ResourceMeta[] {
  if (!fs.existsSync(resourcesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(resourcesDirectory);
  const resources: ResourceMeta[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".mdx") && !fileName.endsWith(".md")) {
      continue;
    }

    const fullPath = path.join(resourcesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    // Validate required fields
    if (!data.slug || !data.title || !data.description || !data.publishedAt) {
      console.warn(`Skipping resource ${fileName}: missing required frontmatter`);
      continue;
    }

    resources.push({
      slug: data.slug,
      title: data.title,
      description: data.description,
      sectors: Array.isArray(data.sectors) ? data.sectors : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      publishedAt: data.publishedAt,
      featured: Boolean(data.featured),
      readingTimeMinutes: data.readingTimeMinutes,
    });
  }

  // Sort by publishedAt (newest first)
  return resources.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });
}

/**
 * Get a single resource by slug.
 */
export async function getResourceBySlug(slug: string): Promise<Resource | null> {
  if (!fs.existsSync(resourcesDirectory)) {
    return null;
  }

  const fileNames = fs.readdirSync(resourcesDirectory);

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".mdx") && !fileName.endsWith(".md")) {
      continue;
    }

    const fullPath = path.join(resourcesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    if (data.slug === slug) {
      const serializedContent = await serialize(content, {
        parseFrontmatter: false,
      }) as MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>;

      return {
        slug: data.slug,
        title: data.title,
        description: data.description,
        sectors: Array.isArray(data.sectors) ? data.sectors : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        publishedAt: data.publishedAt,
        featured: Boolean(data.featured),
        readingTimeMinutes: data.readingTimeMinutes,
        content,
        serializedContent,
      };
    }
  }

  return null;
}

/**
 * Get all unique sectors from resources.
 */
export function getAllSectors(): string[] {
  const resources = getAllResources();
  const sectors = new Set<string>();
  resources.forEach((resource) => {
    resource.sectors.forEach((sector) => sectors.add(sector));
  });
  return Array.from(sectors).sort();
}

/**
 * Get all unique tags from resources.
 */
export function getAllTags(): string[] {
  const resources = getAllResources();
  const tags = new Set<string>();
  resources.forEach((resource) => {
    resource.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

