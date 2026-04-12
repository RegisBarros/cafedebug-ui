import type { EpisodeRequest, GetApiV1AdminEpisodesParams } from "../../generated/models";
import {
  getApiV1AdminEpisodes,
  getApiV1AdminEpisodesId,
  postApiV1AdminEpisodes,
  putApiV1AdminEpisodesId,
  deleteApiV1AdminEpisodesId
} from "../../generated/admin-episodes/admin-episodes";

export const createEpisodesResource = () => ({
  list: (params?: GetApiV1AdminEpisodesParams, options?: RequestInit) =>
    getApiV1AdminEpisodes(params, options),

  get: (id: number, options?: RequestInit) =>
    getApiV1AdminEpisodesId(id, options),

  create: (body: EpisodeRequest, options?: RequestInit) =>
    postApiV1AdminEpisodes(body, options),

  update: (id: number, body: EpisodeRequest, options?: RequestInit) =>
    putApiV1AdminEpisodesId(id, body, options),

  remove: (id: number, options?: RequestInit) =>
    deleteApiV1AdminEpisodesId(id, options)
});
