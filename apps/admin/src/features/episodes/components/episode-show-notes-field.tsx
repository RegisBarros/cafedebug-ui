"use client";

import { useCallback, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { EditorContent } from "@tiptap/react";

import type { EpisodeEditorSchemaValues } from "../schemas/episode.schema";
import { useEpisodeShowNotesEditor } from "../hooks/use-episode-show-notes-editor";
import { EpisodeShowNotesToolbar } from "./episode-show-notes-toolbar";
import { EpisodeShowNotesPreview } from "./episode-show-notes-preview";

type EditorMode = "write" | "preview";

type EpisodeShowNotesFieldProps = {
  form: UseFormReturn<EpisodeEditorSchemaValues>;
  error?: string | undefined;
};

const editorClassName =
  "min-h-[520px] w-full" +
  " [&_.tiptap]:min-h-[520px] [&_.tiptap]:p-4 [&_.tiptap]:text-sm [&_.tiptap]:leading-relaxed [&_.tiptap]:text-on-surface [&_.tiptap]:outline-none" +
  " [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-outline-variant [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:text-on-surface-variant" +
  " [&_.tiptap_code]:rounded [&_.tiptap_code]:bg-surface-container-low [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:font-mono [&_.tiptap_code]:text-xs" +
  " [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6" +
  " [&_.tiptap_a]:text-primary [&_.tiptap_a]:underline" +
  " [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:text-on-surface-variant/45 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]";

export function EpisodeShowNotesField({ form, error }: EpisodeShowNotesFieldProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>("write");

  const description = form.watch("description");

  const handleChange = useCallback(
    (html: string) => {
      form.setValue("description", html, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
    },
    [form]
  );

  const {
    editor,
    commands,
    activeStates,
    previewHtml,
    updatePreviewHtml,
    isReady
  } = useEpisodeShowNotesEditor({
    value: description,
    onChange: handleChange
  });

  const handleSwitchToPreview = useCallback(() => {
    updatePreviewHtml();
    setEditorMode("preview");
  }, [updatePreviewHtml]);

  const toolbarActions = useMemo(
    () => [
      { label: "Bold", icon: "format_bold", active: activeStates.bold, onAction: commands.toggleBold },
      { label: "Italic", icon: "format_italic", active: activeStates.italic, onAction: commands.toggleItalic },
      { label: "Link", icon: "link", active: activeStates.link, onAction: commands.setLink },
      { label: "Quote", icon: "format_quote", active: activeStates.blockquote, onAction: commands.toggleBlockquote },
      { label: "Code", icon: "code", active: activeStates.code, onAction: commands.toggleCode },
      { label: "Bulleted List", icon: "format_list_bulleted", active: activeStates.bulletList, onAction: commands.toggleBulletList },
      { label: "Numbered List", icon: "format_list_numbered", active: activeStates.orderedList, onAction: commands.toggleOrderedList }
    ],
    [activeStates, commands]
  );

  return (
    <div className="flex min-h-[500px] flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="text-sm font-semibold tracking-tight text-on-surface" htmlFor="episode-show-notes">
          Show Notes
        </label>

        <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 dark:bg-surface-container dark:border dark:border-outline-variant/50">
          <button
            className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/60 ${
              editorMode === "write"
                ? "bg-surface-container-lowest text-on-surface shadow-sm ring-1 ring-outline-variant/50"
                : "bg-transparent text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={(event) => {
              event.preventDefault();
              setEditorMode("write");
            }}
            type="button"
          >
            Write
          </button>
          <button
            className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/60 ${
              editorMode === "preview"
                ? "bg-surface-container-lowest text-on-surface shadow-sm ring-1 ring-outline-variant/50"
                : "bg-transparent text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={(event) => {
              event.preventDefault();
              handleSwitchToPreview();
            }}
            type="button"
          >
            Preview
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-ambient">
        <EpisodeShowNotesToolbar
          actions={toolbarActions}
          disabled={!isReady || editorMode === "preview"}
        />

        {editorMode === "write" ? (
          <EditorContent
            className={editorClassName}
            editor={editor}
            id="episode-show-notes"
          />
        ) : (
          <div className="min-h-[520px] p-4">
            <EpisodeShowNotesPreview html={previewHtml} />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}