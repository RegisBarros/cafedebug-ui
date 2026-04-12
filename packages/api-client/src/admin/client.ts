import { initializeApiClient, type CreateApiClientOptions } from "../core/client";
import { normalizeApiError } from "../core/errors";
import { createAuthResource } from "./resources/auth.resource";
import { createAccountsResource } from "./resources/accounts.resource";
import { createEpisodesResource } from "./resources/episodes.resource";
import { createBannersResource } from "./resources/banners.resource";
import { createCategoriesResource } from "./resources/categories.resource";
import { createTeamMembersResource } from "./resources/team-members.resource";
import { createImagesResource } from "./resources/images.resource";

export const createAdminApiClient = (options: CreateApiClientOptions) => {
  initializeApiClient(options);

  return {
    auth: createAuthResource(),
    accounts: createAccountsResource(),
    episodes: createEpisodesResource(),
    banners: createBannersResource(),
    categories: createCategoriesResource(),
    teamMembers: createTeamMembersResource(),
    images: createImagesResource(),
    normalizeError: normalizeApiError
  };
};

export type AdminApiClient = ReturnType<typeof createAdminApiClient>;
