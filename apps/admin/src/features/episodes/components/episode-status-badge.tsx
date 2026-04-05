type EpisodeStatusBadgeProps = {
  active: boolean;
};

export function EpisodeStatusBadge({ active }: EpisodeStatusBadgeProps) {
  if (active) {
    return (
      <span className="inline-flex items-center rounded-[4px] bg-gray-100 px-2.5 py-1 text-xs font-medium text-on-surface dark:bg-white/10">
        Published
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-[4px] border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-medium text-primary dark:border-primary/25 dark:bg-primary/10">
      Draft
    </span>
  );
}
