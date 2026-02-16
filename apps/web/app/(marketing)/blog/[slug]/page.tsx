/**
 * Blog post page - renders published post from DB.
 * Clean layout with generous spacing, featured image, author block, related articles.
 * ISR with revalidate 60s; on-demand revalidation on publish.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  fetchBlogPostBySlug,
  fetchBlogPosts,
  fetchRelatedPosts,
} from "../../../../lib/blog-client";

const baseUrl = "https://nexsteps.dev";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) {
    return { title: "Post Not Found" };
  }

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  const canonical = `${baseUrl}/blog/${slug}`;
  const ogImage = post.thumbnailImageId ?? post.headerImageId
    ? `${baseUrl}/media/${post.thumbnailImageId ?? post.headerImageId}`
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { posts } = await fetchBlogPosts(undefined, 100);
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) notFound();

  const [relatedPosts] = await Promise.all([
    fetchRelatedPosts(slug, 4),
  ]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.seoDescription ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.authorName ?? "Nexsteps",
    },
    publisher: {
      "@type": "Organization",
      name: "Nexsteps",
      logo: { "@type": "ImageObject", url: `${baseUrl}/NSLogo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}/blog/${slug}` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition hover:text-text-primary"
        >
          ← Back to Resources
        </Link>

        <article className="mt-10">
          {/* Featured / Header Image */}
          {(post.headerImageId ?? post.thumbnailImageId) && (
            <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-xl bg-muted">
              <Image
                src={`/media/${post.headerImageId ?? post.thumbnailImageId}`}
                alt=""
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          )}

          {/* Tags */}
          <div className="mb-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent-strong"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-text-primary md:text-5xl">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-4 text-lg text-text-muted">{post.excerpt}</p>
          )}

          {/* Author / Meta */}
          <div className="mt-8 flex flex-wrap items-center gap-12 border-b border-border-subtle pb-8">
            <div className="flex items-center gap-3">
              {post.authorAvatarId ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={`/media/${post.authorAvatarId}`}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
              )}
              <div>
                <p className="font-medium text-text-primary">
                  {post.authorName ?? "Nexsteps"}
                </p>
                <p className="text-sm text-text-muted">
                  {post.readTimeMinutes ?? 5}min read
                </p>
              </div>
            </div>
            <time
              dateTime={post.publishedAt ?? undefined}
              className="ml-auto text-sm text-text-muted"
            >
              Published {formatDate(post.publishedAt)}
            </time>
          </div>

          {/* Content with generous spacing */}
          <div
            className="prose prose-lg mt-10 max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-p:leading-relaxed prose-a:text-accent-strong prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-accent-secondary prose-blockquote:bg-accent-subtle/30 prose-blockquote:py-2 prose-blockquote:pl-6 prose-img:rounded-xl prose-img:my-8"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <aside className="mt-16 border-t border-border-subtle pt-12">
              <h2 className="mb-6 text-2xl font-semibold text-text-primary">
                Related Articles
              </h2>
              <ul className="grid gap-6 sm:grid-cols-2">
                {relatedPosts.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/blog/${r.slug}`}
                      className="block rounded-xl border border-border-subtle p-5 transition hover:border-accent-primary/30 hover:shadow-soft"
                    >
                      <h3 className="font-semibold text-text-primary">
                        {r.title}
                      </h3>
                      {r.excerpt && (
                        <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                          {r.excerpt}
                        </p>
                      )}
                      <time className="mt-3 block text-xs text-text-muted">
                        {formatDate(r.publishedAt)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-xl border border-border-subtle bg-surface p-8">
            <h2 className="text-xl font-semibold text-text-primary">
              Ready to get started?
            </h2>
            <p className="mt-2 text-text-muted">
              See how Nexsteps can help your organisation manage attendance,
              rotas, and safeguarding.
            </p>
            <Link
              href="/demo"
              className="mt-4 inline-block rounded-lg bg-accent-primary px-6 py-3 text-base font-medium text-white transition hover:bg-accent-strong"
            >
              Book a demo
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
