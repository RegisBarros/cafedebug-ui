import { initializeApiClient, type CreateApiClientOptions } from "../core/client";
import { createPublicEpisodesResource } from "./resources/episodes.resource";
import { createPublicBannersResource } from "./resources/banners.resource";

export const createPublicApiClient = (options: CreateApiClientOptions) => {
  initializeApiClient(options);

  return {
    episodes: createPublicEpisodesResource(),
    banners: createPublicBannersResource()
  };
};

export type PublicApiClient = ReturnType<typeof createPublicApiClient>;
