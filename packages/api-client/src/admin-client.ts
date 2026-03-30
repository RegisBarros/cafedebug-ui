import { wrapAsPathBasedClient } from "openapi-fetch";

import { createApiClient, type CreateApiClientOptions } from "./client";
import { normalizeApiError, type NormalizedApiError } from "./errors";

export const adminApiPaths = {
  auth: {
    token: "/api/v1/admin/auth/token",
    refreshToken: "/api/v1/admin/auth/refresh-token"
  },
  accounts: {
    forgotPassword: "/api/v1/accounts-admin/forgot-password",
    changePassword: "/api/v1/accounts-admin/change-password",
    resetPassword: "/api/v1/accounts-admin/reset-password",
    verifyEmail: "/api/v1/accounts-admin/verify-email"
  },
  episodes: {
    list: "/api/v1/admin/episodes",
    byId: "/api/v1/admin/episodes/{id}"
  },
  banners: {
    list: "/api/v1/admin/banners",
    byId: "/api/v1/admin/banners/{id}"
  },
  categories: {
    list: "/api/v1/admin/categories",
    byId: "/api/v1/admin/categories/{id}"
  },
  teamMembers: {
    list: "/api/v1/admin/team-members",
    byId: "/api/v1/admin/team-members/{id}"
  },
  images: {
    upload: "/api/v1/admin/images/upload",
    remove: "/api/v1/admin/images/delete"
  }
} as const;

type OpenApiResponse<TData> =
  | {
      data: TData;
      response: Response;
    }
  | {
      error: unknown;
      response: Response;
    };

export type NormalizedClientResponse<TData> =
  | {
      data: TData;
      response: Response;
    }
  | {
      error: NormalizedApiError;
      response: Response;
    };

export const normalizeClientResponse = <TData>(
  result: OpenApiResponse<TData>
): NormalizedClientResponse<TData> => {
  if ("error" in result) {
    return {
      error: normalizeApiError(result.error, result.response.status),
      response: result.response
    };
  }

  return {
    data: result.data,
    response: result.response
  };
};

export const createAdminApiClient = (options: CreateApiClientOptions) => {
  const rawClient = createApiClient(options);
  const pathClient = wrapAsPathBasedClient(rawClient);

  return {
    raw: rawClient,
    paths: adminApiPaths,
    auth: {
      token: pathClient[adminApiPaths.auth.token].POST,
      refreshToken: pathClient[adminApiPaths.auth.refreshToken].POST
    },
    accounts: {
      forgotPassword: pathClient[adminApiPaths.accounts.forgotPassword].POST,
      changePassword: pathClient[adminApiPaths.accounts.changePassword].POST,
      resetPassword: pathClient[adminApiPaths.accounts.resetPassword].POST,
      verifyEmail: pathClient[adminApiPaths.accounts.verifyEmail].POST
    },
    episodes: {
      list: {
        get: pathClient[adminApiPaths.episodes.list].GET,
        create: pathClient[adminApiPaths.episodes.list].POST
      },
      byId: {
        get: pathClient[adminApiPaths.episodes.byId].GET,
        update: pathClient[adminApiPaths.episodes.byId].PUT,
        remove: pathClient[adminApiPaths.episodes.byId].DELETE
      }
    },
    banners: {
      list: {
        get: pathClient[adminApiPaths.banners.list].GET,
        create: pathClient[adminApiPaths.banners.list].POST
      },
      byId: {
        get: pathClient[adminApiPaths.banners.byId].GET,
        update: pathClient[adminApiPaths.banners.byId].PUT,
        remove: pathClient[adminApiPaths.banners.byId].DELETE
      }
    },
    categories: {
      list: {
        get: pathClient[adminApiPaths.categories.list].GET,
        create: pathClient[adminApiPaths.categories.list].POST
      },
      byId: {
        get: pathClient[adminApiPaths.categories.byId].GET,
        update: pathClient[adminApiPaths.categories.byId].PUT,
        remove: pathClient[adminApiPaths.categories.byId].DELETE
      }
    },
    teamMembers: {
      list: {
        get: pathClient[adminApiPaths.teamMembers.list].GET,
        create: pathClient[adminApiPaths.teamMembers.list].POST
      },
      byId: {
        get: pathClient[adminApiPaths.teamMembers.byId].GET,
        update: pathClient[adminApiPaths.teamMembers.byId].PUT,
        remove: pathClient[adminApiPaths.teamMembers.byId].DELETE
      }
    },
    images: {
      upload: pathClient[adminApiPaths.images.upload].POST,
      remove: pathClient[adminApiPaths.images.remove].POST
    },
    normalizeError: normalizeApiError,
    normalizeResponse: normalizeClientResponse
  };
};

export type AdminApiClient = ReturnType<typeof createAdminApiClient>;
