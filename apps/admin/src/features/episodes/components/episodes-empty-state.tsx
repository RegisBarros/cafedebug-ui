import Link from "next/link";

import { appRoutes } from "@/lib/routes";

type EpisodesEmptyStateProps = {
  searchTerm: string;
  onClearSearch: () => void;
};

export function EpisodesEmptyState({ searchTerm, onClearSearch }: EpisodesEmptyStateProps) {
  const title = searchTerm
    ? "No episodes match your search"
    : "No episodes available yet";

  const description = searchTerm
    ? "Try a different keyword or clear the search input."
    : "Create your first episode to populate this table.";

  return (
    <div className="space-y-3 rounded-lg border border-outline-variant/60 bg-surface-container p-6">
      <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      <p className="text-sm text-on-surface-variant">{description}</p>

      <div className="flex flex-wrap gap-3">
        <Link
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary"
          href={appRoutes.newEpisode}
        >
          Create first episode
        </Link>

        {searchTerm ? (
          <button
            className="inline-flex h-10 items-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface"
            onClick={onClearSearch}
            type="button"
          >
            Clear search
          </button>
        ) : null}
      </div>
    </div>
  );
}
