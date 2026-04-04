"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createEpisode, episodesQueryKeys } from "../services/episodes.service";
import type {
  AdminRouteError,
  EpisodeRequestPayload,
  EpisodesMutationResult
} from "../types/episode.types";

export const useCreateEpisode = () => {
  const queryClient = useQueryClient();

  return useMutation<EpisodesMutationResult, AdminRouteError, EpisodeRequestPayload>(
    {
      mutationFn: createEpisode,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: episodesQueryKeys.all });
      }
    }
  );
};
