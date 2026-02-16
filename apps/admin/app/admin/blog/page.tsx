"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card } from "@pathway/ui";
import {
  fetchBlogPostsAdmin,
  deleteBlogPost,
  type AdminBlogPost,
} from "../../../lib/api-client";

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBlogPostsAdmin()
      .then((res) => {
        if (!cancelled) setPosts(res.posts);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (e: React.MouseEvent, post: AdminBlogPost) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post.id);
    setError(null);
    try {
      await deleteBlogPost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Blog</h1>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New post
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-status-error/50 bg-status-error/10 p-4 text-status-error">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-text-muted">No posts yet.</p>
          <Link href="/admin/blog/new" className="mt-4 inline-block">
            <Button>Create your first post</Button>
          </Link>
        </Card>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/admin/blog/${post.id}`}>
                <Card className="flex items-center justify-between p-4 transition hover:border-accent-primary/50">
                  <div>
                    <h2 className="font-medium text-text-primary">{post.title}</h2>
                    <p className="text-sm text-text-muted">
                      {post.slug} · {post.status}
                      {post.isFeatured && " · Featured"}
                      {post.publishedAt &&
                        ` · ${post.status === "SCHEDULED" ? "Goes live" : "Published"} ${new Date(post.publishedAt).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Edit →</span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, post)}
                      disabled={deletingId === post.id}
                      className="rounded p-2 text-status-danger transition hover:bg-status-danger/10 disabled:opacity-50"
                      aria-label={`Delete ${post.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
