import {
  createAdminApiClient,
  normalizeApiError,
  type NormalizedApiError,
  type components
} from "@cafedebug/api-client";

import { extractSetCookieHeaders } from "@/lib/auth/session-strategy.js";
import { adminRuntimeEnv } from "@/lib/env";
import { getTraceIdFromHeaders } from "@/lib/observability";

export type BackendEpisodesQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
};

export type EpisodeMutationInput = components["schemas"]["EpisodeRequest"];

type BackendErrorResult = {
  error: NormalizedApiError;
  response: Response;
  setCookieHeaders: string[];
  traceId?: string;
};

type BackendSuccessResult = {
  data: unknown;
  response: Response;
  setCookieHeaders: string[];
  traceId?: string;
};

export type BackendEpisodeApiResult = BackendSuccessResult | BackendErrorResult;

const episodesPaths = Object.freeze({
  list: "/api/v1/admin/episodes",
  byId: "/api/v1/admin/episodes/{id}"
});

export const adminEpisodesApiPaths = episodesPaths;

const withAuthCookieHeader = (cookieHeader: string): Record<string, string> =>
  cookieHeader.length > 0 ? { cookie: cookieHeader } : {};

const toConfigurationErrorResult = (): BackendErrorResult => ({
  error: normalizeApiError(
    {
      status: 503,
      title: "Configuration Error",
      detail: "Admin API base URL is not configured."
    },
    503
  ),
  response: new Response(null, { status: 503 }),
  setCookieHeaders: []
});

const normalizeBackendResult = (
  result:
    | {
        data: unknown;
        response: Response;
      }
    | {
        error: unknown;
        response: Response;
      }
): BackendEpisodeApiResult => {
  const setCookieHeaders = extractSetCookieHeaders(result.response);

  if ("error" in result) {
    const normalizedError = normalizeApiError(result.error, result.response.status);
    const traceId = normalizedError.traceId ?? getTraceIdFromHeaders(result.response.headers);

    return {
      error: normalizedError,
      response: result.response,
      setCookieHeaders,
      ...(traceId ? { traceId } : {})
    };
  }

  const traceId = getTraceIdFromHeaders(result.response.headers);

  return {
    data: result.data,
    response: result.response,
    setCookieHeaders,
    ...(traceId ? { traceId } : {})
  };
};

const withAdminClient = () => {
  if (!adminRuntimeEnv.apiBaseUrl) {
    return null;
  }

  return createAdminApiClient({
    baseUrl: adminRuntimeEnv.apiBaseUrl
  });
};

export const listEpisodesFromBackend = async ({
  cookieHeader,
  query
}: {
  cookieHeader: string;
  query: BackendEpisodesQuery;
}): Promise<BackendEpisodeApiResult> => {
  const adminClient = withAdminClient();

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
  const adminClient = withAdminClient();

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
  const adminClient = withAdminClient();

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
  const adminClient = withAdminClient();

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
