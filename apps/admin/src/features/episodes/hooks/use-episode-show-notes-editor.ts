"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { getEditorHtml, isHtmlContentEmpty } from "../services/episode-show-notes-serialization";
import { sanitizeShowNotesHtml } from "../services/episode-show-notes-sanitizer";

type UseEpisodeShowNotesEditorOptions = {
  value: string;
  onChange: (html: string) => void;
};

export function useEpisodeShowNotesEditor({
  value,
  onChange
}: UseEpisodeShowNotesEditorOptions) {
  const [previewHtml, setPreviewHtml] = useState("");
  const lastSyncedRef = useRef<string>(value);
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
            target: "_blank"
          }
        }
      })
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const html = getEditorHtml(currentEditor);
      lastSyncedRef.current = html;
      isInternalUpdate.current = true;
      onChange(html);
    }
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (value === lastSyncedRef.current) {
      return;
    }

    lastSyncedRef.current = value;
    editor.commands.setContent(value || "");
  }, [editor, value]);

  const updatePreviewHtml = useCallback(() => {
    if (!editor) {
      setPreviewHtml("");
      return;
    }

    const html = getEditorHtml(editor);
    setPreviewHtml(isHtmlContentEmpty(html) ? "" : sanitizeShowNotesHtml(html));
  }, [editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleCode = useCallback(() => {
    editor?.chain().focus().toggleCode().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const commands = {
    toggleBold,
    toggleItalic,
    toggleCode,
    toggleBlockquote,
    toggleBulletList,
    toggleOrderedList,
    setLink
  };

  const activeStates = {
    bold: editor?.isActive("bold") ?? false,
    italic: editor?.isActive("italic") ?? false,
    code: editor?.isActive("code") ?? false,
    blockquote: editor?.isActive("blockquote") ?? false,
    bulletList: editor?.isActive("bulletList") ?? false,
    orderedList: editor?.isActive("orderedList") ?? false,
    link: editor?.isActive("link") ?? false
  };

  return {
    editor,
    commands,
    activeStates,
    previewHtml,
    updatePreviewHtml,
    isReady: !!editor && !editor.isDestroyed
  };
}
