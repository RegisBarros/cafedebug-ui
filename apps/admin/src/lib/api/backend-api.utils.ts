import { normalizeApiError, type NormalizedApiError } from "@cafedebug/api-client";

import { extractSetCookieHeaders } from "@/lib/auth/session-strategy.js";
import { getTraceIdFromHeaders } from "@/lib/observability";

export type BackendErrorResult = {
  error: NormalizedApiError;
  status: number;
  headers: Headers;
  setCookieHeaders: string[];
  traceId?: string;
};

export type BackendSuccessResult<TData = unknown> = {
  data: TData;
  status: number;
  headers: Headers;
  setCookieHeaders: string[];
  traceId?: string;
};

export type BackendApiResult<TData = unknown> =
  | BackendSuccessResult<TData>
  | BackendErrorResult;

export const withAuthCookieHeader = (
  cookieHeader: string
): Record<string, string> =>
  cookieHeader.length > 0 ? { cookie: cookieHeader } : {};

export const toConfigurationErrorResult = (): BackendErrorResult => ({
  error: normalizeApiError(
    {
      status: 503,
      title: "Configuration Error",
      detail: "Admin API base URL is not configured."
    },
    503
  ),
  status: 503,
  headers: new Headers(),
  setCookieHeaders: []
});

type OrvalResponse = {
  data: unknown;
  status: number;
  headers: Headers;
};

export const normalizeBackendResult = <TData = unknown>(
  result: OrvalResponse
): BackendApiResult<TData> => {
  const setCookieHeaders = extractSetCookieHeaders(result);

  if (result.status >= 400) {
    const normalizedError = normalizeApiError(
      result.data,
      result.status
    );
    const traceId =
      normalizedError.traceId ??
      getTraceIdFromHeaders(result.headers);

    return {
      error: normalizedError,
      status: result.status,
      headers: result.headers,
      setCookieHeaders,
      ...(traceId ? { traceId } : {})
    };
  }

  const traceId = getTraceIdFromHeaders(result.headers);

  return {
    data: result.data as TData,
    status: result.status,
    headers: result.headers,
    setCookieHeaders,
    ...(traceId ? { traceId } : {})
  };
};
