import { type components } from "@cafedebug/api-client";

import { getAdminApiClient } from "./admin-client";
import {
  type BackendApiResult,
  withAuthCookieHeader,
  toConfigurationErrorResult,
  normalizeBackendResult
} from "./backend-api.utils";

export type BackendEpisodesQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
};

export type EpisodeMutationInput = components["schemas"]["EpisodeRequest"];

export type BackendEpisodeApiResult = BackendApiResult;

export const listEpisodesFromBackend = async ({
  cookieHeader,
  query
}: {
  cookieHeader: string;
  query: BackendEpisodesQuery;
}): Promise<BackendEpisodeApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) {
    return toConfigurationErrorResult();
  }

  const response = await adminClient.episodes.list.get({
    params: {
      query
    },
    headers: withAuthCookieHeader(cookieHeader)
  });

  return normalizeBackendResult(response);
};

export const getEpisodeFromBackend = async ({
  cookieHeader,
  id
}: {
  cookieHeader: string;
  id: number;
}): Promise<BackendEpisodeApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) {
    return toConfigurationErrorResult();
  }

  const response = await adminClient.episodes.byId.get({
    params: {
      path: { id }
    },
    headers: withAuthCookieHeader(cookieHeader)
  });

  return normalizeBackendResult(response);
};

export const createEpisodeInBackend = async ({
  cookieHeader,
  payload
}: {
  cookieHeader: string;
  payload: EpisodeMutationInput;
}): Promise<BackendEpisodeApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) {
    return toConfigurationErrorResult();
  }

  const response = await adminClient.episodes.list.create({
    body: payload,
    headers: withAuthCookieHeader(cookieHeader)
  });

  return normalizeBackendResult(response);
};

export const updateEpisodeInBackend = async ({
  cookieHeader,
  id,
  payload
}: {
  cookieHeader: string;
  id: number;
  payload: EpisodeMutationInput;
}): Promise<BackendEpisodeApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) {
    return toConfigurationErrorResult();
  }

  const response = await adminClient.episodes.byId.update({
    params: {
      path: { id }
    },
    body: payload,
    headers: withAuthCookieHeader(cookieHeader)
  });

  return normalizeBackendResult(response);
};
