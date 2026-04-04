"use client";

import { useQuery } from "@tanstack/react-query";

import {
  episodesQueryKeys,
  fetchEpisodeById
} from "../services/episodes.service";

export const useEpisodeById = (id: number | null) =>
  useQuery({
    queryKey: id ? episodesQueryKeys.detail(id) : ["episode", "new"],
    queryFn: async () => {
      if (!id) return null;
      return fetchEpisodeById(id);
    },
    enabled: Boolean(id)
  });
