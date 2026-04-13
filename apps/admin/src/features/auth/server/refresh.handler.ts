import { NextResponse } from "next/server";

import { requestRefreshToken } from "@/lib/api/auth-admin-api";
import { readRefreshTokenFromCookieHeader } from "@/lib/auth/backend-auth-headers.js";
import {
  appendSetCookieHeaders,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setSessionCookie
} from "@/lib/auth/next-response-cookies";
import { knownRefreshCookieNames } from "@/lib/auth/session-constants";
import {
  addSentryBreadcrumb,
  captureException,
  logger,
  observabilityEvents
} from "@/lib/observability";

import { createErrorResponse } from "../errors/createErrorResponse";
import { parseTokenEnvelope } from "./token-envelope";

const REFRESH_TOKEN_ENDPOINT = "/api/v1/admin/auth/refresh-token";

export async function refreshHandler(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const refreshToken = readRefreshTokenFromCookieHeader(
    cookieHeader,
    knownRefreshCookieNames
  );

  if (!refreshToken) {
    return createErrorResponse({
      detail: "Your session has expired. Please sign in again.",
      status: 401,
      title: "Session expired",
      event: observabilityEvents.authRefreshMissingToken,
      clearAuthCookies: true
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
    const backendResult = await requestRefreshToken({
      refreshToken
    });

    if ("error" in backendResult) {
      const logLevel = backendResult.error.status >= 500 ? "error" : "warn";

      logger[logLevel](observabilityEvents.apiRequestFailed, {
        module: "auth",
        action: "refresh",
        endpoint: REFRESH_TOKEN_ENDPOINT,
        status: backendResult.error.status,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
      });

      return createErrorResponse({
        detail: backendResult.error.detail,
        status: backendResult.error.status,
        title: backendResult.error.title,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {}),
        setCookieHeaders: backendResult.setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authRefreshFailed,
        ...(logLevel === "error" ? { logLevel: "error" } : {})
      });
    }

    const tokenEnvelope = parseTokenEnvelope(backendResult.data);

    if (!tokenEnvelope) {
      logger.error(observabilityEvents.authRefreshFailed, {
        module: "auth",
        action: "refresh",
        endpoint: REFRESH_TOKEN_ENDPOINT,
        status: backendResult.status,
        issue: "invalid-token-envelope"
      });

      return createErrorResponse({
        detail:
          "Authentication refresh response was incomplete. Please sign in again.",
        status: 502,
        title: "Upstream Error",
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {}),
        setCookieHeaders: backendResult.setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authRefreshFailed,
        logLevel: "error"
      });
    }

    logger.info(observabilityEvents.authRefreshSuccess, {
      module: "auth",
      action: "refresh",
      endpoint: REFRESH_TOKEN_ENDPOINT,
      status: backendResult.status
    });

    const response = NextResponse.json({ success: true }, { status: 200 });

    appendSetCookieHeaders(response, backendResult.setCookieHeaders);
    setAccessTokenCookie(response, tokenEnvelope.accessToken, tokenEnvelope.expiresIn);
    setRefreshTokenCookie(
      response,
      tokenEnvelope.refreshToken.token,
      tokenEnvelope.refreshToken.expirationDate
    );
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
