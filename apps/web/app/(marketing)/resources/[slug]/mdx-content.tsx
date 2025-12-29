"use client";

import React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

const mdxComponents: Record<string, React.ComponentType<React.HTMLAttributes<HTMLElement>>> = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-4 text-3xl font-bold text-pw-text" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-3 mt-8 text-2xl font-semibold text-pw-text" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-2 mt-6 text-xl font-semibold text-pw-text" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 text-pw-text-muted leading-relaxed" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-pw-text-muted" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-pw-text-muted" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-pw-text-muted" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-pw-primary underline hover:text-blue-600"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-pw-text" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-pw-surface px-1 py-0.5 text-sm font-mono text-pw-text" {...props} />
  ),
};

interface MDXContentProps {
  source: MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>;
}

export default function MDXContent({ source }: MDXContentProps) {
  return <MDXRemote {...source} components={mdxComponents} />;
}

