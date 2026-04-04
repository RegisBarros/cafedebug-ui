import { normalizeApiError, type NormalizedApiError } from "@cafedebug/api-client";

import { extractSetCookieHeaders } from "@/lib/auth/session-strategy.js";
import { getTraceIdFromHeaders } from "@/lib/observability";

export type BackendErrorResult = {
  error: NormalizedApiError;
  response: Response;
  setCookieHeaders: string[];
  traceId?: string;
};

export type BackendSuccessResult<TData = unknown> = {
  data: TData;
  response: Response;
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
  response: new Response(null, { status: 503 }),
  setCookieHeaders: []
});

export const normalizeBackendResult = <TData = unknown>(
  result:
    | { data: TData; response: Response }
    | { error: unknown; response: Response }
): BackendApiResult<TData> => {
  const setCookieHeaders = extractSetCookieHeaders(result.response);

  if ("error" in result) {
    const normalizedError = normalizeApiError(
      result.error,
      result.response.status
    );
    const traceId =
      normalizedError.traceId ??
      getTraceIdFromHeaders(result.response.headers);

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
