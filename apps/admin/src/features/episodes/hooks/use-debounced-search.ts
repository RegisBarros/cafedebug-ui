"use client";

import { useEffect, useMemo, useState } from "react";

import type { EpisodeRecord } from "../types/episode.types";

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

type UseDebouncedSearchResult = {
  searchInput: string;
  setSearchInput: (value: string) => void;
  searchTerm: string;
  filteredItems: EpisodeRecord[];
};

export function useDebouncedSearch(episodes: EpisodeRecord[]): UseDebouncedSearchResult {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return episodes;

    return episodes.filter((episode) =>
      toSearchCandidate(episode).includes(searchTerm)
    );
  }, [episodes, searchTerm]);

  return { searchInput, setSearchInput, searchTerm, filteredItems };
}
