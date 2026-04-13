"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateEpisode, episodesQueryKeys } from "../services/episodes.service";
import type {
  AdminRouteError,
  EpisodeRequestPayload,
  EpisodesMutationResult
} from "../types/episode.types";

type UpdateEpisodeInput = {
  id: number;
  payload: EpisodeRequestPayload;
};

export const useUpdateEpisode = () => {
  const queryClient = useQueryClient();

  return useMutation<EpisodesMutationResult, AdminRouteError, UpdateEpisodeInput>(
    {
      mutationFn: updateEpisode,
      onSuccess: (_data, { id }) => {
        queryClient.invalidateQueries({ queryKey: episodesQueryKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: episodesQueryKeys.all });
      }
    }
  );
};
