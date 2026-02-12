import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import https from "node:https";
import http from "node:http";
import { ToolkitPdfDocument } from "../../../lib/toolkit-pdf-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Use API_INTERNAL_URL for server-side fetches. When API uses HTTPS with self-signed cert (dev),
// we use an agent that accepts it.
const API_BASE_URL =
  process.env.API_INTERNAL_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("https://")
    ? `https://localhost:${process.env.API_PORT ?? "3003"}`
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003");

/** HTTPS agent that accepts self-signed certs. Use only in dev. */
const insecureAgent =
  process.env.NODE_ENV !== "production"
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

async function fetchRedeemToken(token: string): Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<{ orgName: string | null; name: string | null }>;
}> {
  const url = new URL(`${API_BASE_URL}/leads/toolkit/redeem-token`);
  const body = JSON.stringify({ token });

  const isHttps = url.protocol === "https:";
  const protocol = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      ...(isHttps && insecureAgent ? { agent: insecureAgent } : {}),
    };

    const req = protocol.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const data = Buffer.concat(chunks).toString("utf8");
        resolve({
          ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode ?? 500,
          json: () => Promise.resolve(JSON.parse(data || "{}")),
        });
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetchRedeemToken(token);

    if (!res.ok) {
      if (res.status === 401) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Unable to validate token" },
        { status: 502 }
      );
    }

    const { orgName: apiOrgName } = (await res.json()) as {
      orgName: string | null;
      name: string | null;
    };
    const orgNameFromQuery = request.nextUrl.searchParams.get("orgName");
    const orgName = apiOrgName ?? orgNameFromQuery ?? null;

    const doc = React.createElement(ToolkitPdfDocument, { orgName });
    const pdfBuffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="nexsteps-toolkit-v2.pdf"',
      },
    });
  } catch (err) {
    console.error("[toolkit.pdf] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
