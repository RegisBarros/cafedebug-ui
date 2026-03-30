import { PlaceholderPanel } from "@/features/placeholders/placeholder-panel";

type EpisodeEditorPlaceholderProps = {
  mode: "new" | "edit";
  id?: string;
};

export function EpisodeEditorPlaceholder({ mode, id }: EpisodeEditorPlaceholderProps) {
  const title = mode === "new" ? "Create episode" : `Edit episode ${id}`;

  return (
    <PlaceholderPanel
      title={title}
      description="Editor layout is scaffolded only. Full form composition, validation, and upload integration belong to dedicated CRUD implementation tasks."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-lg bg-surface-container p-4">
          <p className="text-sm font-medium text-on-surface">Content column</p>
          <p className="mt-1 text-sm text-on-surface-variant">Title and notes editors will be implemented here.</p>
        </div>
        <div className="rounded-lg bg-surface-container p-4">
          <p className="text-sm font-medium text-on-surface">Metadata column</p>
          <p className="mt-1 text-sm text-on-surface-variant">Status, publish date, tags, media, and category fields will live here.</p>
        </div>
      </div>
    </PlaceholderPanel>
  );
}
