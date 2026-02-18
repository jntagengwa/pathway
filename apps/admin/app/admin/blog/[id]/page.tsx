"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label } from "@pathway/ui";
import { Checkbox } from "../../../../components/ui/checkbox";
import {
  fetchBlogPostAdmin,
  updateBlogPost,
  publishBlogPost,
  deleteBlogPost,
  type AdminBlogPost,
} from "../../../../lib/api-client";
import { NoAccessCard } from "../../../../components/no-access-card";
import { BlogEditor } from "../../../../components/blog/BlogEditor";
import { BlogImagePicker } from "../../../../components/blog/BlogImagePicker";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<AdminBlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({ type: "doc", content: [] });
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailImageId, setThumbnailImageId] = useState<string | null>(null);
  const [headerImageId, setHeaderImageId] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchBlogPostAdmin(id)
      .then((p: AdminBlogPost | null) => {
        if (!cancelled && p) {
          setPost(p);
          setTitle(p.title);
          setSlug(p.slug);
          setExcerpt(p.excerpt ?? "");
          setContentJson((p.contentJson as Record<string, unknown>) ?? { type: "doc", content: [] });
          setSeoTitle(p.seoTitle ?? "");
          setSeoDescription(p.seoDescription ?? "");
          setTags(p.tags ?? []);
          setThumbnailImageId(p.thumbnailImageId);
          setHeaderImageId(p.headerImageId);
          setIsFeatured(p.isFeatured ?? false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateBlogPost(post.id, {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        contentJson,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        thumbnailImageId,
        headerImageId,
        tags,
        isFeatured,
      });
      setPost(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    setError(null);
    setPublishing(true);
    try {
      await publishBlogPost(post.id);
      const updated = await fetchBlogPostAdmin(post.id);
      if (updated) setPost(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!post || !scheduledAt) return;
    setError(null);
    setPublishing(true);
    try {
      await publishBlogPost(post.id, { scheduledAt: new Date(scheduledAt).toISOString() });
      const updated = await fetchBlogPostAdmin(post.id);
      if (updated) setPost(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setPublishing(false);
    }
  };

  const handleFeaturedChange = (checked: boolean) => {
    setIsFeatured(checked);
    if (post?.status === "PUBLISHED") {
      updateBlogPost(post.id, { isFeatured: checked })
        .then((updated) => setPost(updated))
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to update featured");
          setIsFeatured(!checked);
        });
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteBlogPost(post.id);
      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6">
        <p className="text-text-muted">Post not found.</p>
        <Link href="/admin/blog" className="mt-4 inline-block">
          <Button variant="outline">Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link
        href="/admin/blog"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Edit: {post.title}</h1>
        {post.status !== "PUBLISHED" && post.status !== "SCHEDULED" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="rounded-md border border-border-subtle px-3 py-2 text-sm"
              />
              <Button
                onClick={handleSchedule}
                disabled={publishing || !scheduledAt}
                variant="outline"
              >
                {publishing ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing..." : "Publish now"}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        {error && (
          <div className="mb-4 rounded-md border border-status-error/50 bg-status-error/10 p-4 text-status-error">
            {error}
          </div>
        )}

        <Card className="mb-6 space-y-3 p-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => handleFeaturedChange(e.target.checked)}
              />
              <Label htmlFor="isFeatured">Featured (shown in featured slot on blog index)</Label>
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

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <Link href="/admin/blog">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <div className="ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="border-status-danger text-status-danger hover:bg-status-danger/10"
            >
              {deleting ? "Deleting..." : "Delete post"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
