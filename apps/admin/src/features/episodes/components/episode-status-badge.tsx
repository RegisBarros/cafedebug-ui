type EpisodeStatusBadgeProps = {
  active: boolean;
};

export function EpisodeStatusBadge({ active }: EpisodeStatusBadgeProps) {
  if (active) {
    return (
      <span className="inline-flex items-center rounded-[4px] bg-[#f3f4f6] px-2.5 py-1 text-xs font-semibold text-on-surface dark:bg-white/10">
        Published
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-[4px] border border-[#ffedd5] bg-[#fff7ed] px-2.5 py-1 text-xs font-semibold text-primary">
      Draft
    </span>
  );
}
