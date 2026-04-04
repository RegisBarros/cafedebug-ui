"use client";

import { useQuery } from "@tanstack/react-query";

import {
  episodesQueryKeys,
  fetchEpisodesPage
} from "../services/episodes.service";
import type { EpisodesQueryParams } from "../types/episode.types";

export const useEpisodesList = (params: EpisodesQueryParams) =>
  useQuery({
    queryKey: episodesQueryKeys.list(params),
    queryFn: () => fetchEpisodesPage(params)
  });
