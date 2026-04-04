import createClient, {
  wrapAsPathBasedClient,
  type Client,
  type ClientOptions
} from "openapi-fetch";

import type { paths } from "./generated/schema";

export type ApiPaths = paths;
export type ApiClient = Client<ApiPaths>;
export type PathBasedClient = ReturnType<typeof wrapAsPathBasedClient<ApiPaths>>;

export interface CreateApiClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export const createApiClient = ({
  baseUrl,
  fetch
}: CreateApiClientOptions): ApiClient => {
  const clientOptions: ClientOptions = { baseUrl };

  if (fetch) {
    clientOptions.fetch = (request) => fetch(request);
  }

  return createClient<ApiPaths>(clientOptions);
};
