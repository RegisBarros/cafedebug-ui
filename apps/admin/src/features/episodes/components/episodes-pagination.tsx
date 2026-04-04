type EpisodesPaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function EpisodesPagination({
  page,
  pageSize,
  totalCount,
  hasPrevious,
  hasNext,
  isFetching,
  onPrevious,
  onNext
}: EpisodesPaginationProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between border-t border-outline-variant/60 bg-gray-50/30 px-6 py-4 dark:bg-white/5">
      <span className="text-sm text-on-surface-variant">
        Showing {from} to {to} of {totalCount} episodes
      </span>

      <div className="flex items-center gap-2">
        <button
          aria-label="Previous page"
          className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-[#f3f4f6] hover:text-on-surface disabled:opacity-50 dark:hover:bg-white/10"
          disabled={!hasPrevious || isFetching}
          onClick={onPrevious}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
            chevron_left
          </span>
        </button>

        <button
          aria-label="Next page"
          className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-[#f3f4f6] hover:text-on-surface disabled:opacity-50 dark:hover:bg-white/10"
          disabled={!hasNext || isFetching}
          onClick={onNext}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}
