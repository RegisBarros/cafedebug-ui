import { createAdminApiClient } from "@cafedebug/api-client";
import { NextResponse } from "next/server";

import {
  appendSetCookieHeaders,
  clearKnownAuthCookies,
  setSessionCookie
} from "@/lib/auth/next-response-cookies";
import { knownRefreshCookieNames } from "@/lib/auth/session-constants";
import {
  extractSetCookieHeaders,
  parseCookieHeader
} from "@/lib/auth/session-strategy.js";
import { adminRuntimeEnv } from "@/lib/env";
import {
  addSentryBreadcrumb,
  captureException,
  getTraceIdFromHeaders,
  logger,
  observabilityEvents
} from "@/lib/observability";

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
  if (!adminRuntimeEnv.apiBaseUrl) {
    logger.error(observabilityEvents.authRefreshFailed, {
      module: "auth",
      action: "refresh",
      reason: "missing-api-base-url",
      status: 503
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          title: "Configuration Error",
          detail: "Admin API base URL is not configured."
        }
      },
      { status: 503 }
    );
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const refreshToken = readRefreshToken(cookieHeader);

  if (!refreshToken) {
    logger.warn(observabilityEvents.authRefreshMissingToken, {
      module: "auth",
      action: "refresh",
      status: 401
    });

    const response = NextResponse.json(
      {
        success: false,
        error: {
          title: "Session expired",
          detail: "Your session has expired. Please sign in again."
        }
      },
      { status: 401 }
    );

    clearKnownAuthCookies(response);
    return response;
  }

  const adminApiClient = createAdminApiClient({
    baseUrl: adminRuntimeEnv.apiBaseUrl
  });

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

      logger.warn(observabilityEvents.authRefreshFailed, {
        module: "auth",
        action: "refresh",
        endpoint: adminApiClient.paths.auth.refreshToken,
        status: normalizedRefreshResponse.error.status,
        ...(traceId ? { traceId } : {})
      });

      const response = NextResponse.json(
        {
          success: false,
          error: {
            title: normalizedRefreshResponse.error.title,
            detail: normalizedRefreshResponse.error.detail,
            ...(traceId ? { traceId } : {})
          }
        },
        { status: normalizedRefreshResponse.error.status }
      );

      appendSetCookieHeaders(response, setCookieHeaders);
      clearKnownAuthCookies(response);

      return response;
    }

    if (normalizedRefreshResponse.data.isSuccess === false) {
      const traceId = getTraceIdFromHeaders(normalizedRefreshResponse.response.headers);

      logger.warn(observabilityEvents.authRefreshFailed, {
        module: "auth",
        action: "refresh",
        endpoint: adminApiClient.paths.auth.refreshToken,
        status: 401,
        ...(traceId ? { traceId } : {})
      });

      const response = NextResponse.json(
        {
          success: false,
          error: {
            title: "Session expired",
            detail:
              normalizedRefreshResponse.data.error?.message?.trim() ??
              "Unable to refresh session. Please sign in again.",
            ...(traceId ? { traceId } : {})
          }
        },
        { status: 401 }
      );

      appendSetCookieHeaders(response, setCookieHeaders);
      clearKnownAuthCookies(response);

      return response;
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

    return NextResponse.json(
      {
        success: false,
        error: {
          title: "Service Unavailable",
          detail: "Unable to refresh session. Please try again."
        }
      },
      { status: 503 }
    );
  }
}
