import type { Editor } from "@tiptap/react";

const TIPTAP_EMPTY_PARAGRAPH = "<p></p>";

export const getEditorHtml = (editor: Editor): string => {
  return editor.getHTML();
};

export const isEditorContentEmpty = (editor: Editor): boolean => {
  return editor.isEmpty;
};

export const isHtmlContentEmpty = (html: string): boolean => {
  const trimmed = html.trim();
  return trimmed.length === 0 || trimmed === TIPTAP_EMPTY_PARAGRAPH;
};
