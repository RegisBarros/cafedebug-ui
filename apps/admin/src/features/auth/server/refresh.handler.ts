import { NextResponse } from "next/server";

import { normalizeApiError } from "@cafedebug/api-client";

import { getAdminApiClient } from "@/lib/api/admin-client";
import {
  appendSetCookieHeaders,
  setSessionCookie
} from "@/lib/auth/next-response-cookies";
import { knownRefreshCookieNames } from "@/lib/auth/session-constants";
import {
  extractSetCookieHeaders,
  parseCookieHeader
} from "@/lib/auth/session-strategy.js";
import {
  addSentryBreadcrumb,
  captureException,
  getTraceIdFromHeaders,
  logger,
  observabilityEvents
} from "@/lib/observability";

import { createErrorResponse } from "../errors/createErrorResponse";

const REFRESH_TOKEN_ENDPOINT = "/api/v1/admin/auth/refresh-token";

const readRefreshToken = (cookieHeader: string): string | undefined => {
  const cookieMap = parseCookieHeader(cookieHeader);

  for (const cookieName of knownRefreshCookieNames) {
    const refreshToken = cookieMap.get(cookieName);

    if (typeof refreshToken === "string" && refreshToken.length > 0) {
      return refreshToken;
    }
  }

  return undefined;
};

export async function refreshHandler(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const refreshToken = readRefreshToken(cookieHeader);

  if (!refreshToken) {
    return createErrorResponse({
      detail: "Your session has expired. Please sign in again.",
      status: 401,
      title: "Session expired",
      event: observabilityEvents.authRefreshMissingToken,
      clearAuthCookies: true
    });
  }

  const adminApiClient = getAdminApiClient();

  if (!adminApiClient) {
    return createErrorResponse({
      detail: "Admin API base URL is not configured.",
      status: 503,
      title: "Configuration Error",
      event: observabilityEvents.authRefreshFailed,
      logLevel: "error"
    });
  }

  addSentryBreadcrumb("Admin session refresh attempt", {
    category: "auth",
    data: {
      module: "auth",
      action: "refresh"
    }
  });

  try {
    const refreshResponse = await adminApiClient.auth.refreshToken(
      { refreshToken },
      { headers: { cookie: cookieHeader } }
    );

    const setCookieHeaders = extractSetCookieHeaders(refreshResponse);

    if (refreshResponse.status >= 400) {
      const normalizedError = normalizeApiError(
        refreshResponse.data,
        refreshResponse.status
      );
      const traceId =
        normalizedError.traceId ??
        getTraceIdFromHeaders(refreshResponse.headers);

      logger.warn(observabilityEvents.apiRequestFailed, {
        module: "auth",
        action: "refresh",
        endpoint: REFRESH_TOKEN_ENDPOINT,
        status: normalizedError.status,
        ...(traceId ? { traceId } : {})
      });

      return createErrorResponse({
        detail: normalizedError.detail,
        status: normalizedError.status,
        title: normalizedError.title,
        ...(traceId ? { traceId } : {}),
        setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authRefreshFailed
      });
    }

    const responseData = refreshResponse.data as { isSuccess?: boolean; error?: { message?: string } };

    if (responseData.isSuccess === false) {
      const traceId = getTraceIdFromHeaders(refreshResponse.headers);

      const fallbackDetail =
        responseData.error?.message?.trim() ??
        "Unable to refresh session. Please sign in again.";

      return createErrorResponse({
        detail: fallbackDetail,
        status: 401,
        title: "Session expired",
        ...(traceId ? { traceId } : {}),
        setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authRefreshFailed
      });
    }

    logger.info(observabilityEvents.authRefreshSuccess, {
      module: "auth",
      action: "refresh",
      endpoint: REFRESH_TOKEN_ENDPOINT,
      status: 200
    });

    const response = NextResponse.json({ success: true }, { status: 200 });

    appendSetCookieHeaders(response, setCookieHeaders);
    setSessionCookie(response);

    return response;
  } catch (error) {
    logger.error(observabilityEvents.authRefreshFailed, {
      module: "auth",
      action: "refresh",
      endpoint: REFRESH_TOKEN_ENDPOINT,
      status: 503
    });

    captureException(error, {
      scope: {
        tags: {
          module: "auth",
          action: "refresh"
        },
        level: "error"
      },
      context: {
        status: 503,
        endpoint: REFRESH_TOKEN_ENDPOINT
      }
    });

    return createErrorResponse({
      detail: "Unable to refresh session. Please try again.",
      status: 503,
      title: "Service Unavailable",
      event: observabilityEvents.authRefreshFailed,
      logLevel: "error"
    });
  }
}
