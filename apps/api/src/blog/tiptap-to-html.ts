/**
 * Renders TipTap/ProseMirror JSON to safe HTML.
 * Used on publish to generate contentHtml for SSR.
 */

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c] ?? c);
}

function renderMarks(text: string, marks?: TipTapNode["marks"]): string {
  if (!marks?.length) return escapeHtml(text);
  let out = escapeHtml(text);
  for (const m of marks) {
    switch (m.type) {
      case "bold":
        out = `<strong>${out}</strong>`;
        break;
      case "italic":
        out = `<em>${out}</em>`;
        break;
      case "link":
        {
          const href = (m.attrs?.href as string) ?? "#";
          const target = m.attrs?.target === "_blank" ? ' target="_blank" rel="noopener noreferrer"' : "";
          out = `<a href="${escapeHtml(href)}"${target}>${out}</a>`;
        }
        break;
      case "code":
        out = `<code>${out}</code>`;
        break;
      default:
        break;
    }
  }
  return out;
}

function renderNode(node: TipTapNode, baseUrl: string): string {
  switch (node.type) {
    case "text":
      return renderMarks(node.text ?? "", node.marks);

    case "paragraph":
      return `<p>${(node.content ?? []).map((c) => renderNode(c, baseUrl)).join("")}</p>`;

    case "heading": {
      const level = Math.min(6, Math.max(1, (node.attrs?.level as number) ?? 1));
      const inner = (node.content ?? []).map((c) => renderNode(c, baseUrl)).join("");
      return `<h${level}>${inner}</h${level}>`;
    }

    case "bulletList":
      return `<ul>${(node.content ?? []).map((c) => renderNode(c, baseUrl)).join("")}</ul>`;

    case "orderedList":
      return `<ol>${(node.content ?? []).map((c) => renderNode(c, baseUrl)).join("")}</ol>`;

    case "listItem":
      return `<li>${(node.content ?? []).map((c) => renderNode(c, baseUrl)).join("")}</li>`;

    case "blockquote":
      return `<blockquote>${(node.content ?? []).map((c) => renderNode(c, baseUrl)).join("")}</blockquote>`;

    case "codeBlock":
      return `<pre><code>${escapeHtml((node.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join(""))}</code></pre>`;

    case "horizontalRule":
      return "<hr />";

    case "image": {
      const src = node.attrs?.src as string | undefined;
      const alt = (node.attrs?.alt as string) ?? "";
      const title = node.attrs?.title as string | undefined;
      if (!src) return "";
      // Use relative /media/:id so images load from same origin (works in dev and prod)
      const url = src.startsWith("/media/") ? src : src.replace(/^https?:\/\/[^/]+/, "") || src;
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy" />`;
    }

    case "hardBreak":
      return "<br />";

    case "doc":
      return (node.content ?? []).map((c) => renderNode(c, baseUrl)).join("");

    default:
      return (node.content ?? []).map((c) => renderNode(c, baseUrl)).join("");
  }
}

/**
 * Convert TipTap JSON document to HTML.
 * @param contentJson - TipTap/ProseMirror doc JSON
 * @param baseUrl - Base URL for resolving /media/:id (e.g. https://nexsteps.dev)
 */
export function tiptapJsonToHtml(
  contentJson: unknown,
  baseUrl: string,
): string {
  if (!contentJson || typeof contentJson !== "object") return "";
  const doc = contentJson as TipTapNode;
  if (doc.type !== "doc") return "";
  return renderNode(doc, baseUrl);
}
