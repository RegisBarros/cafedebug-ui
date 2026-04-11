"use client";

type ToolbarAction = {
  label: string;
  icon: string;
  active: boolean;
  onAction: () => void;
};

type EpisodeShowNotesToolbarProps = {
  actions: ToolbarAction[];
  disabled: boolean;
};

export function EpisodeShowNotesToolbar({ actions, disabled }: EpisodeShowNotesToolbarProps) {
  const separatorIndices = new Set([2, 5]);

  return (
    <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b border-outline-variant/50 bg-surface-container-low px-2 py-2 text-on-surface-variant">
      {actions.map((action, index) => (
        <span key={action.label} className="contents">
          {separatorIndices.has(index) ? (
            <span className="mx-1 h-5 w-px bg-outline-variant/50" />
          ) : null}
          <button
            aria-label={action.label}
            aria-pressed={action.active}
            className={`rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/60 ${
              action.active
                ? "bg-primary/15 text-primary"
                : "hover:bg-surface-container-low hover:text-on-surface"
            }`}
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              action.onAction();
            }}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              {action.icon}
            </span>
          </button>
        </span>
      ))}
    </div>
  );
}
