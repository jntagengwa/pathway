"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { uploadBlogAsset } from "../../lib/api-client";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { addColumnAfter, addRowAfter, deleteTable } from "prosemirror-tables";
import {
  Fragment,
  type Node as ProseMirrorNode,
  type Schema,
} from "prosemirror-model";

type BlogEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  className?: string;
};

const toolbarBtn =
  "rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150 ease-out";

function createTableNode(
  schema: Schema,
  rows: number,
  cols: number,
  withHeaderRow: boolean,
): ProseMirrorNode | null {
  const table = schema.nodes.table;
  const tableRow = schema.nodes.tableRow;
  const tableCell = schema.nodes.tableCell;
  const tableHeader = schema.nodes.tableHeader;

  if (!table || !tableRow || !tableCell) {
    return null;
  }

  const makeCell = (isHeader: boolean) => {
    const cellType = isHeader && tableHeader ? tableHeader : tableCell;
    return cellType.createAndFill();
  };

  const rowNodes: ProseMirrorNode[] = [];
  for (let r = 0; r < rows; r++) {
    const isHeader = withHeaderRow && r === 0;
    const cellNodes: ProseMirrorNode[] = [];
    for (let c = 0; c < cols; c++) {
      const cell = makeCell(isHeader);
      if (cell) cellNodes.push(cell);
    }
    const row = tableRow.createAndFill(
      undefined,
      Fragment.fromArray(cellNodes),
    );
    if (row) rowNodes.push(row);
  }

  return table.createAndFill(undefined, Fragment.fromArray(rowNodes));
}

export function BlogEditor({ content, onChange, className }: BlogEditorProps) {
  const [, forceUpdate] = useState({});
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
        validate: (href) => /^(\/|https?:\/\/)/.test(href ?? ""),
      }),
      Image.configure({
        HTMLAttributes: { loading: "lazy" },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith("image/")) return false;
        event.preventDefault();
        void handleImageUpload(file).then((url) => {
          if (url) {
            const { schema } = view.state;
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (coordinates) {
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            }
          }
        });
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              void handleImageUpload(file).then((url) => {
                if (url) {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                }
              });
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  const handleImageUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = typeof btoa !== "undefined" ? btoa(binary) : "";
      const mimeType = file.type as "image/png" | "image/jpeg" | "image/webp";
      if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType))
        return null;
      try {
        const res = await uploadBlogAsset(base64, mimeType, "INLINE");
        return res.url;
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!editor) return;
    const json = editor.getJSON();
    if (JSON.stringify(json) !== JSON.stringify(content)) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      onChange(editor.getJSON() as Record<string, unknown>);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor, onChange]);

  // Re-render toolbar when selection changes so active states (bold, H2, list) update
  useEffect(() => {
    if (!editor) return;
    const onSelectionUpdate = () => forceUpdate({});
    const onTransaction = () => forceUpdate({});
    editor.on("selectionUpdate", onSelectionUpdate);
    editor.on("transaction", onTransaction);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
      editor.off("transaction", onTransaction);
    };
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await handleImageUpload(file);
      if (url) editor?.chain().focus().setImage({ src: url }).run();
    };
    input.click();
  }, [editor, handleImageUpload]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const href = editor.getAttributes("link").href;
    const url = window.prompt(
      "Link URL (use / for internal, e.g. /blog/post-slug, /demo):",
      href ?? "",
    );
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const hrefNorm =
      url.startsWith("/") || /^https?:\/\//.test(url) ? url : `https://${url}`;
    editor.chain().focus().setLink({ href: hrefNorm }).run();
  }, [editor]);

  const insertHtml = useCallback(() => {
    if (!editor) return;
    const html = window.prompt(
      "Paste HTML to insert (e.g. <table>...</table>).",
      "",
    );
    if (!html) return;

    // Basic safety: strip script tags (admin UI should still avoid inserting scripts)
    const safeHtml = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

    editor.commands.focus();
    editor.commands.insertContent(safeHtml, {
      parseOptions: {
        preserveWhitespace: "full",
      },
    });
  }, [editor]);

  if (!editor) return <div className={className}>Loading editor...</div>;

  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isLink = editor.isActive("link");
  const isH2 = editor.isActive("heading", { level: 2 });
  const isH3 = editor.isActive("heading", { level: 3 });
  const isList =
    editor.isActive("bulletList") || editor.isActive("orderedList");
  const isTable = editor.isActive("table");

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-1.5 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${toolbarBtn} ${
            isBold
              ? "bg-accent-subtle text-accent-strong shadow-sm"
              : "text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong"
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${toolbarBtn} ${
            isItalic
              ? "bg-accent-subtle text-accent-strong shadow-sm"
              : "text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong"
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={setLink}
          className={`${toolbarBtn} ${
            isLink
              ? "bg-accent-subtle text-accent-strong shadow-sm"
              : "text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong"
          }`}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Section title" }],
              })
              .run()
          }
          className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
        >
          Add section
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`${toolbarBtn} ${
            isH2
              ? "bg-accent-subtle text-accent-strong shadow-sm"
              : "text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong"
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`${toolbarBtn} ${
            isH3
              ? "bg-accent-subtle text-accent-strong shadow-sm"
              : "text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong"
          }`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${toolbarBtn} ${
            isList
              ? "bg-accent-subtle text-accent-strong shadow-sm"
              : "text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong"
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().run();
            const { state, dispatch } = editor.view;
            const table = createTableNode(state.schema, 8, 3, true);
            if (!table) return;
            dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
            editor.view.focus();
          }}
          className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
        >
          Table
        </button>
        <button
          type="button"
          onClick={insertHtml}
          className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
        >
          Insert HTML
        </button>
        {isTable && (
          <>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().run();
                addRowAfter(editor.view.state, editor.view.dispatch);
                editor.view.focus();
              }}
              className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
            >
              + Row
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().run();
                addColumnAfter(editor.view.state, editor.view.dispatch);
                editor.view.focus();
              }}
              className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
            >
              + Col
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().run();
                deleteTable(editor.view.state, editor.view.dispatch);
                editor.view.focus();
              }}
              className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
            >
              Delete table
            </button>
          </>
        )}
        <button
          type="button"
          onClick={addImage}
          className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
        >
          Add image
        </button>
      </div>
      <p className="mb-2 text-xs text-text-muted">
        Use &quot;Add section&quot; for sub-headers. Select text and click Link
        to add internal paths (e.g. /blog/post-slug, /demo) or external URLs.
      </p>
      <div className="min-h-[200px] rounded-md border border-border-subtle bg-surface px-3 py-2 prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
