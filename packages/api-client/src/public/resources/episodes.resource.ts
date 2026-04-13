import type { GetApiV1PublicEpisodesParams } from "../../generated/models";
import {
  getApiV1PublicEpisodes,
  getApiV1PublicEpisodesId
} from "../../generated/public-episodes/public-episodes";

export const createPublicEpisodesResource = () => ({
  list: (params?: GetApiV1PublicEpisodesParams, options?: RequestInit) =>
    getApiV1PublicEpisodes(params, options),

  get: (id: number, options?: RequestInit) =>
    getApiV1PublicEpisodesId(id, options)
});
