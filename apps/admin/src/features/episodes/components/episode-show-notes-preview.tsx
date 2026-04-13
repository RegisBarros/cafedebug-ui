"use client";

type EpisodeShowNotesPreviewProps = {
  html: string;
};

export function EpisodeShowNotesPreview({ html }: EpisodeShowNotesPreviewProps) {
  if (!html.trim()) {
    return (
      <p className="text-sm text-on-surface-variant">
        Nothing to preview yet.
      </p>
    );
  }

  return (
    <div
      className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-a:text-primary prose-blockquote:border-outline-variant prose-blockquote:text-on-surface-variant prose-code:text-on-surface prose-strong:text-on-surface"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
