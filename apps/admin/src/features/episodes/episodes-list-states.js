export const EPISODES_LIST_STATES = Object.freeze([
  {
    key: "loading",
    title: "Loading state",
    description: "Skeleton rows communicate list hydration while the episodes query resolves.",
    actionLabel: "Waiting for data"
  },
  {
    key: "empty",
    title: "Empty state",
    description: "Explain that no episodes match the active filters and provide a clear next action.",
    actionLabel: "Create first episode"
  },
  {
    key: "error",
    title: "Error state",
    description: "Show a recoverable inline failure with retry affordance and contextual guidance.",
    actionLabel: "Retry fetch"
  }
]);
