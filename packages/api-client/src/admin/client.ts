import { wrapAsPathBasedClient } from "openapi-fetch";

import { createApiClient, type CreateApiClientOptions } from "../client";
import { normalizeApiError } from "../errors";
import { type OpenApiResponse, type NormalizedClientResponse } from "../types";
import { adminApiPaths } from "./paths";
import { createAuthResource } from "./resources/auth.resource";
import { createAccountsResource } from "./resources/accounts.resource";
import { createEpisodesResource } from "./resources/episodes.resource";
import { createBannersResource } from "./resources/banners.resource";
import { createCategoriesResource } from "./resources/categories.resource";
import { createTeamMembersResource } from "./resources/team-members.resource";
import { createImagesResource } from "./resources/images.resource";

export const normalizeClientResponse = <TData>(
  result: OpenApiResponse<TData>
): NormalizedClientResponse<TData> => {
  if ("error" in result) {
    return {
      error: normalizeApiError(result.error, result.response.status),
      response: result.response
    };
  }

  return { data: result.data, response: result.response };
};

export const createAdminApiClient = (options: CreateApiClientOptions) => {
  const rawClient = createApiClient(options);
  const pathClient = wrapAsPathBasedClient(rawClient);

  return {
    raw: rawClient,
    paths: adminApiPaths,
    auth: createAuthResource(pathClient),
    accounts: createAccountsResource(pathClient),
    episodes: createEpisodesResource(pathClient),
    banners: createBannersResource(pathClient),
    categories: createCategoriesResource(pathClient),
    teamMembers: createTeamMembersResource(pathClient),
    images: createImagesResource(pathClient),
    normalizeError: normalizeApiError,
    normalizeResponse: normalizeClientResponse
  };
};

export type AdminApiClient = ReturnType<typeof createAdminApiClient>;
