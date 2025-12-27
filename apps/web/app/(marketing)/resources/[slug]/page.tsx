import type { Metadata } from "next";
import Link from "next/link";
import { getAllResources, getResourceBySlug } from "../../../../lib/resources";
import MDXContent from "./mdx-content";

export async function generateStaticParams() {
  const resources = getAllResources();
  return resources.map((resource) => ({
    slug: resource.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    return {
      title: "Resource Not Found",
    };
  }

  return {
    title: resource.title,
    description: resource.description,
    openGraph: {
      title: resource.title,
      description: resource.description,
      type: "article",
      publishedTime: resource.publishedAt,
      tags: resource.tags,
      url: `https://nexsteps.dev/resources/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description: resource.description,
    },
  };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-pw-text">Resource Not Found</h1>
          <p className="mb-6 text-pw-text-muted">
            The resource you're looking for doesn't exist.
          </p>
          <Link
            href="/resources"
            className="rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
      {/* Back link */}
      <Link
        href="/resources"
        className="inline-flex items-center gap-2 text-sm text-pw-text-muted transition hover:text-pw-text"
      >
        ← Back to Resources
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {resource.sectors.map((sector) => (
            <span
              key={sector}
              className="rounded-full bg-pw-primary/10 px-3 py-1 text-xs font-medium text-pw-primary capitalize"
            >
              {sector}
            </span>
          ))}
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-pw-surface px-3 py-1 text-xs font-medium text-pw-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-4xl font-bold text-pw-text md:text-5xl">{resource.title}</h1>
        <p className="text-lg text-pw-text-muted">{resource.description}</p>

        <div className="flex items-center gap-4 text-sm text-pw-text-muted">
          <span>Published {formatDate(resource.publishedAt)}</span>
          {resource.readingTimeMinutes && (
            <>
              <span>•</span>
              <span>{resource.readingTimeMinutes} min read</span>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <article className="prose prose-lg max-w-none">
        <MDXContent source={resource.serializedContent} />
      </article>

      {/* CTA */}
      <div className="rounded-xl border border-pw-border bg-white p-6">
        <h2 className="mb-2 text-xl font-semibold text-pw-text">Ready to get started?</h2>
        <p className="mb-4 text-pw-text-muted">
          See how Nexsteps can help your organisation manage attendance, rotas, and safeguarding.
        </p>
        <Link
          href="/demo"
          className="inline-block rounded-md bg-pw-primary px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-blue-600"
        >
          Book a demo
        </Link>
      </div>
    </div>
  );
}

