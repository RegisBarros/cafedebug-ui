"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { appRoutes } from "@/lib/routes";
import { logger, observabilityEvents } from "@/lib/observability";

import { episodesListDefaultParams } from "./defaults";
import { episodesQueryKeys, fetchEpisodesPage } from "./client";
import type { AdminRouteError, EpisodeRecord, EpisodesQueryParams } from "./types";

const sortableFields = ["publishedAt", "number", "title"] as const;
type SortField = (typeof sortableFields)[number];

const isSortField = (value: string): value is SortField =>
  sortableFields.some((field) => field === value);

const formatPublishedAt = (publishedAt?: string): string => {
  if (!publishedAt) {
    return "Not published";
  }

  const parsedDate = new Date(publishedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return publishedAt;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsedDate);
};

const toSearchCandidate = (episode: EpisodeRecord): string => {
  const values = [
    episode.title,
    episode.shortDescription,
    episode.description,
    episode.url,
    episode.number ? String(episode.number) : undefined
  ];

  return values
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
};

const filterEpisodes = (
  episodes: EpisodeRecord[],
  searchTerm: string
): EpisodeRecord[] => {
  if (!searchTerm) {
    return episodes;
  }

  return episodes.filter((episode) =>
    toSearchCandidate(episode).includes(searchTerm)
  );
};

const getErrorDetail = (error: unknown): AdminRouteError => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "title" in error &&
    "detail" in error
  ) {
    return error as AdminRouteError;
  }

  return {
    status: 500,
    title: "Request failed",
    detail: "Unable to load episodes."
  };
};

const tableCellClassName = "px-4 py-3 text-sm text-on-surface";
const tableHeadClassName =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant";

export function EpisodesListPage() {
  const [page, setPage] = useState<number>(episodesListDefaultParams.page);
  const [pageSize] = useState<number>(episodesListDefaultParams.pageSize);
  const [sortBy, setSortBy] = useState<SortField>(
    episodesListDefaultParams.sortBy as SortField
  );
  const [descending, setDescending] = useState<boolean>(
    episodesListDefaultParams.descending
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const previousErrorKeyRef = useRef<string | null>(null);

  const queryParams = useMemo<EpisodesQueryParams>(
    () => ({
      page,
      pageSize,
      sortBy,
      descending
    }),
    [descending, page, pageSize, sortBy]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const episodesQuery = useQuery({
    queryKey: episodesQueryKeys.list(queryParams),
    queryFn: () => fetchEpisodesPage(queryParams)
  });

  const normalizedError = episodesQuery.error
    ? getErrorDetail(episodesQuery.error)
    : null;

  useEffect(() => {
    if (!normalizedError) {
      previousErrorKeyRef.current = null;
      return;
    }

    const errorKey = [
      normalizedError.status,
      normalizedError.title,
      normalizedError.detail,
      normalizedError.traceId ?? "-"
    ].join(":");

    if (previousErrorKeyRef.current === errorKey) {
      return;
    }

    previousErrorKeyRef.current = errorKey;

    logger.warn(observabilityEvents.episodesFetchFailed, {
      module: "episodes",
      action: "list",
      status: normalizedError.status,
      ...(normalizedError.traceId ? { traceId: normalizedError.traceId } : {})
    });
  }, [normalizedError]);

  const filteredItems = useMemo(
    () => filterEpisodes(episodesQuery.data?.items ?? [], searchTerm),
    [episodesQuery.data?.items, searchTerm]
  );

  const emptyStateTitle = searchTerm
    ? "No episodes match your search"
    : "No episodes available yet";
  const emptyStateDescription = searchTerm
    ? "Try a different keyword or clear the search input."
    : "Create your first episode to populate this table.";

  const handleRetry = async () => {
    logger.info(observabilityEvents.episodesActionExecuted, {
      module: "episodes",
      action: "retry-fetch"
    });

    await episodesQuery.refetch();
  };

  return (
    <section className="space-y-4 rounded-xl bg-surface-container-low p-6 shadow-ambient">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-on-surface">Episodes</h1>
          <p className="text-sm text-on-surface-variant">
            Manage episode drafts and published content.
          </p>
        </div>

        <Link
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition hover:bg-primary-strong"
          href={appRoutes.newEpisode}
        >
          New Episode
        </Link>
      </header>

      <div className="grid gap-3 rounded-lg bg-surface-container p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Search
          </span>
          <input
            className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by title, summary, or episode #"
            type="search"
            value={searchInput}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Sort
          </span>
          <select
            className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
            onChange={(event) => {
              if (isSortField(event.target.value)) {
                setSortBy(event.target.value);
              }
              setPage(1);
            }}
            value={sortBy}
          >
            <option value="publishedAt">Published date</option>
            <option value="number">Episode number</option>
            <option value="title">Title</option>
          </select>
        </label>

        <button
          className="h-11 rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          onClick={() => {
            setDescending((previous) => !previous);
            setPage(1);
          }}
          type="button"
        >
          {descending ? "Descending" : "Ascending"}
        </button>
      </div>

      {episodesQuery.isLoading ? (
        <div className="overflow-hidden rounded-lg border border-outline-variant/60">
          <table className="min-w-full border-collapse">
            <thead className="bg-surface-container">
              <tr>
                <th className={tableHeadClassName}>#</th>
                <th className={tableHeadClassName}>Title & Summary</th>
                <th className={tableHeadClassName}>Status</th>
                <th className={tableHeadClassName}>Published / Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, index) => (
                <tr
                  className="border-t border-outline-variant/40"
                  key={`skeleton-row-${index + 1}`}
                >
                  <td className={tableCellClassName}>
                    <span className="inline-block h-3 w-10 animate-pulse rounded bg-surface-container-high" />
                  </td>
                  <td className={tableCellClassName}>
                    <span className="inline-block h-3 w-56 animate-pulse rounded bg-surface-container-high" />
                  </td>
                  <td className={tableCellClassName}>
                    <span className="inline-block h-5 w-20 animate-pulse rounded-full bg-surface-container-high" />
                  </td>
                  <td className={tableCellClassName}>
                    <span className="inline-block h-3 w-24 animate-pulse rounded bg-surface-container-high" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!episodesQuery.isLoading && normalizedError ? (
        <div
          className="space-y-3 rounded-lg border border-danger bg-surface-container p-4"
          role="alert"
        >
          <p className="text-sm font-semibold text-danger">{normalizedError.title}</p>
          <p className="text-sm text-on-surface-variant">{normalizedError.detail}</p>
          {normalizedError.traceId ? (
            <p className="text-xs text-on-surface-variant">
              Trace ID: <code>{normalizedError.traceId}</code>
            </p>
          ) : null}
          <button
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary"
            onClick={handleRetry}
            type="button"
          >
            Retry fetch
          </button>
        </div>
      ) : null}

      {!episodesQuery.isLoading && !normalizedError && filteredItems.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-outline-variant/60 bg-surface-container p-6">
          <h2 className="text-lg font-semibold text-on-surface">{emptyStateTitle}</h2>
          <p className="text-sm text-on-surface-variant">{emptyStateDescription}</p>
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
                onClick={() => setSearchInput("")}
                type="button"
              >
                Clear search
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!episodesQuery.isLoading && !normalizedError && filteredItems.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
            <table className="min-w-full border-collapse">
              <thead className="bg-surface-container">
                <tr>
                  <th className={tableHeadClassName}>#</th>
                  <th className={tableHeadClassName}>Title & Summary</th>
                  <th className={tableHeadClassName}>Status</th>
                  <th className={tableHeadClassName}>Published / Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((episode) => (
                  <tr
                    className="border-t border-outline-variant/40 transition hover:bg-surface-container"
                    key={episode.id}
                  >
                    <td className={tableCellClassName}>
                      {typeof episode.number === "number" ? `#${episode.number}` : "—"}
                    </td>

                    <td className={tableCellClassName}>
                      <p className="font-medium text-on-surface">{episode.title}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {episode.shortDescription ||
                          episode.description ||
                          "No summary available."}
                      </p>
                    </td>

                    <td className={tableCellClassName}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                          episode.active
                            ? "bg-success/20 text-success"
                            : "bg-primary-container text-on-surface"
                        }`}
                      >
                        {episode.active ? "Published" : "Draft"}
                      </span>
                    </td>

                    <td className={tableCellClassName}>
                      <p className="text-xs text-on-surface-variant">
                        {formatPublishedAt(episode.publishedAt)}
                      </p>
                      <Link
                        className="mt-1 inline-flex text-sm font-semibold text-primary hover:text-primary-strong"
                        href={appRoutes.editEpisode(String(episode.id))}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container p-4">
            <p className="text-xs text-on-surface-variant">
              Page {episodesQuery.data?.page ?? page} of{" "}
              {episodesQuery.data?.pageCount ?? 1} —{" "}
              {episodesQuery.data?.totalCount ?? filteredItems.length} total episodes
            </p>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-10 items-center rounded-lg bg-surface-container-high px-3 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!episodesQuery.data?.hasPrevious || episodesQuery.isFetching}
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                className="inline-flex h-10 items-center rounded-lg bg-surface-container-high px-3 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!episodesQuery.data?.hasNext || episodesQuery.isFetching}
                onClick={() => setPage((previous) => previous + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </footer>
        </>
      ) : null}
    </section>
  );
}
