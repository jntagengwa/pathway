"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { uploadBlogAsset } from "../../lib/api-client";

type BlogEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  className?: string;
};

const toolbarBtn =
  "rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150 ease-out";

export function BlogEditor({
  content,
  onChange,
  className,
}: BlogEditorProps) {
  const [, forceUpdate] = useState({});
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: { loading: "lazy" },
      }),
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

  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = typeof btoa !== "undefined" ? btoa(binary) : "";
    const mimeType = file.type as "image/png" | "image/jpeg" | "image/webp";
    if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) return null;
    try {
      const res = await uploadBlogAsset(base64, mimeType, "INLINE");
      return res.url;
    } catch {
      return null;
    }
  }, []);

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

  if (!editor) return <div className={className}>Loading editor...</div>;

  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isH2 = editor.isActive("heading", { level: 2 });
  const isH3 = editor.isActive("heading", { level: 3 });
  const isList = editor.isActive("bulletList") || editor.isActive("orderedList");

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
          onClick={() =>
            editor.chain().focus().insertContent({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Section title" }] }).run()
          }
          className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
        >
          Add section
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
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
          onClick={addImage}
          className={`${toolbarBtn} text-text-primary hover:bg-accent-subtle/60 hover:text-accent-strong`}
        >
          Add image
        </button>
      </div>
      <p className="mb-2 text-xs text-text-muted">
        Use &quot;Add section&quot; for sub-headers. Images can be placed inline, above or below text by positioning the cursor.
      </p>
      <div className="min-h-[200px] rounded-md border border-border-subtle bg-surface px-3 py-2 prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
