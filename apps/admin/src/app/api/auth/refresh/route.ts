import { NextResponse } from "next/server";

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

import { createErrorResponse } from "@/features/auth/errors/createErrorResponse";

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

export async function POST(request: Request) {
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
    const refreshResponse = await adminApiClient.auth.refreshToken({
      body: {
        refreshToken
      }
    });
    const normalizedRefreshResponse =
      adminApiClient.normalizeResponse(refreshResponse);
    const setCookieHeaders = extractSetCookieHeaders(
      normalizedRefreshResponse.response
    );

    if ("error" in normalizedRefreshResponse) {
      const traceId =
        normalizedRefreshResponse.error.traceId ??
        getTraceIdFromHeaders(normalizedRefreshResponse.response.headers);

      logger.warn(observabilityEvents.apiRequestFailed, {
        module: "auth",
        action: "refresh",
        endpoint: adminApiClient.paths.auth.refreshToken,
        status: normalizedRefreshResponse.error.status,
        ...(traceId ? { traceId } : {})
      });

      return createErrorResponse({
        detail: normalizedRefreshResponse.error.detail,
        status: normalizedRefreshResponse.error.status,
        title: normalizedRefreshResponse.error.title,
        ...(traceId ? { traceId } : {}),
        setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authRefreshFailed
      });
    }

    if (normalizedRefreshResponse.data.isSuccess === false) {
      const traceId = getTraceIdFromHeaders(normalizedRefreshResponse.response.headers);

      const fallbackDetail =
        normalizedRefreshResponse.data.error?.message?.trim() ??
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
      endpoint: adminApiClient.paths.auth.refreshToken,
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
      endpoint: adminApiClient.paths.auth.refreshToken,
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
        endpoint: adminApiClient.paths.auth.refreshToken
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
