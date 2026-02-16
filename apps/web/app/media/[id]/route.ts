/**
 * Proxies /media/:id to the API to serve blog images from nexsteps.dev.
 * Enables correct cache headers and same-origin image URLs for SEO.
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3003";

/** In dev with HTTPS API, accept self-signed certs. */
function getFetchOptions(): RequestInit | undefined {
  if (
    process.env.NODE_ENV !== "production" &&
    API_BASE_URL.startsWith("https://")
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- undici for dev TLS
    const { Agent } = require("undici");
    return {
      dispatcher: new Agent({ connect: { rejectUnauthorized: false } }),
    } as RequestInit;
  }
  return undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/media/${id}`, {
      headers: request.headers.get("if-none-match")
        ? { "If-None-Match": request.headers.get("if-none-match")! }
        : {},
      ...getFetchOptions(),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch media" },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[media] Error fetching asset:", err);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 502 },
    );
  }
}
