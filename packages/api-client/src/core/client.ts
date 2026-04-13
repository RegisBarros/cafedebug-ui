import { configureFetcher, type FetcherConfig } from "./fetcher";

export type CreateApiClientOptions = FetcherConfig;

export const initializeApiClient = (options: CreateApiClientOptions) => {
  configureFetcher(options);
};
