"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label } from "@pathway/ui";
import { createBlogPost } from "../../../../lib/api-client";
import { BlogEditor } from "../../../../components/blog/BlogEditor";
import { BlogImagePicker } from "../../../../components/blog/BlogImagePicker";

const defaultContentJson = { type: "doc", content: [] };

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentJson, setContentJson] = useState<Record<string, unknown>>(defaultContentJson);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailImageId, setThumbnailImageId] = useState<string | null>(null);
  const [headerImageId, setHeaderImageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deriveSlug = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleTitleChange = (t: string) => {
    setTitle(t);
    if (!slug || slug === deriveSlug(title)) setSlug(deriveSlug(t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const post = await createBlogPost({
        title: title.trim(),
        slug: slug.trim() || deriveSlug(title),
        excerpt: excerpt.trim() || undefined,
        contentJson,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        thumbnailImageId,
        headerImageId,
        tags,
      });
      router.push(`/admin/blog/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Link
        href="/admin/blog"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <h1 className="mb-6 text-2xl font-semibold text-text-primary">New post</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-status-error/50 bg-status-error/10 p-4 text-status-error">
            {error}
          </div>
        )}

        <Card className="mb-6 space-y-4 p-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-slug"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary"
              rows={2}
              className="mt-1 w-full rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
          </div>
          <div>
            <BlogImagePicker
              label="Thumbnail image"
              value={thumbnailImageId}
              onChange={setThumbnailImageId}
              helpText="Shown on the blog index and cards. Recommended 1200×630px."
            />
          </div>
          <div>
            <BlogImagePicker
              label="Header image"
              value={headerImageId}
              onChange={setHeaderImageId}
              helpText="Large image at top of post. Recommended 1200×630px."
            />
          </div>
          <div>
            <Label htmlFor="tags">Categories</Label>
            <Input
              id="tags"
              value={tags.join(", ")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
              placeholder="e.g. Safeguarding, Attendance, Schools"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-text-muted">
              Comma-separated. Used for filtering on the blog index.
            </p>
          </div>
          <div>
            <Label>Content</Label>
            <BlogEditor
              content={contentJson}
              onChange={setContentJson}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <textarea
              id="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Optional"
              rows={2}
              className="mt-1 w-full rounded-md border border-border-subtle px-3 py-2 text-sm"
            />
          </div>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create draft"}
          </Button>
          <Link href="/admin/blog">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
