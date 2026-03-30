"use client";

import { useMemo, useState } from "react";

import { PlaceholderPanel } from "@/features/placeholders/placeholder-panel";
import { EPISODES_LIST_STATES } from "@/features/episodes/episodes-list-states";
import { logger, observabilityEvents } from "@/lib/observability";
import { appRoutes } from "@/lib/routes";

export function EpisodesPagePlaceholder() {
  const [activeState, setActiveState] = useState(EPISODES_LIST_STATES[0]?.key ?? "loading");
  const activeStateData = useMemo(
    () => EPISODES_LIST_STATES.find((state) => state.key === activeState),
    [activeState]
  );

  const triggerEpisodeAction = (action: "fetch" | "save-draft" | "publish") => {
    if (action === "fetch") {
      logger.warn(observabilityEvents.episodesFetchFailed, {
        module: "episodes",
        action,
        status: 503,
        source: "placeholder"
      });
      return;
    }

    logger.info(observabilityEvents.episodesActionExecuted, {
      module: "episodes",
      action,
      source: "placeholder"
    });
  };

  return (
    <PlaceholderPanel
      title="Episodes"
      description="Episodes CRUD scaffolding starts here. This placeholder keeps routes and IA stable while data hooks and forms are introduced in later todos."
      actions={[
        { href: appRoutes.newEpisode, label: "Create new episode" },
        { href: appRoutes.editEpisode("episode-id"), label: "Open edit placeholder" }
      ]}
    >
      <div className="rounded-lg bg-surface-container p-4">
        <p className="text-sm font-medium text-on-surface">Next milestone</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Replace this panel with searchable table, pagination, and TanStack Query-backed list states.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary"
            onClick={() => triggerEpisodeAction("fetch")}
            type="button"
          >
            Simulate fetch failure event
          </button>
          <button
            className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface"
            onClick={() => triggerEpisodeAction("save-draft")}
            type="button"
          >
            Simulate save draft success
          </button>
          <button
            className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface"
            onClick={() => triggerEpisodeAction("publish")}
            type="button"
          >
            Simulate publish success
          </button>
        </div>
      </div>
      <div className="rounded-lg bg-surface-container p-4">
        <p className="text-sm font-medium text-on-surface">Current mock list state</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          {activeStateData?.description ?? "Select a state below to preview list behavior."}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3" data-testid="episodes-list-state-coverage">
        {EPISODES_LIST_STATES.map((state) => (
          <article
            className={`rounded-lg bg-surface-container p-4 ${
              activeState === state.key ? "ring-2 ring-focus-ring" : ""
            }`}
            data-state={state.key}
            key={state.key}
          >
            <p className="text-sm font-medium text-on-surface">{state.title}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{state.description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{state.actionLabel}</p>
            <button
              className="mt-3 rounded-lg bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface"
              onClick={() => setActiveState(state.key)}
              type="button"
            >
              Set active state
            </button>
          </article>
        ))}
      </div>
    </PlaceholderPanel>
  );
}
