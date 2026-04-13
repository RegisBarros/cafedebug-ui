/**
 * Token Cookie Strategy: STRATEGY B — JSON Body Token Extraction
 *
 * CONFIRMED (Phase 0): The backend POST /api/v1/admin/auth/token endpoint returns
 * token data exclusively in the JSON response body. No Set-Cookie headers are emitted.
 *
 * This handler:
 * 1. Attempts Strategy A first (forwarding any Set-Cookie headers defensively)
 * 2. Falls back to Strategy B: extracts tokens from JSON body and sets HttpOnly cookies
 * 3. Always sets the session signal cookie after successful token establishment
 */
import { NextResponse } from "next/server";

import { normalizeApiError } from "@cafedebug/api-client";

import { getAdminApiClient } from "@/lib/api/admin-client";

import { extractSetCookieHeaders } from "@/lib/auth/session-strategy.js";
import {
  addSentryBreadcrumb,
  captureException,
  getTraceIdFromHeaders,
  logger,
  observabilityEvents
} from "@/lib/observability";
import { postLoginRedirectRoute } from "@/lib/routes";

import {
  appendSetCookieHeaders,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setSessionCookie
} from "@/lib/auth/next-response-cookies";
import { loginSchema } from "../schemas/login.schema";
import { createErrorResponse } from "../errors/createErrorResponse";
import { parseTokenEnvelope } from "./token-envelope";

const AUTH_TOKEN_ENDPOINT = "/api/v1/admin/auth/token";

const readLoginBody = async (request: Request): Promise<unknown | undefined> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

const readValidationFieldErrors = (
  validationIssues: {
    path: PropertyKey[];
    message: string;
  }[]
) => {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of validationIssues) {
    const [pathValue] = issue.path;

    if (typeof pathValue !== "string") {
      continue;
    }

    if (pathValue !== "email" && pathValue !== "password") {
      continue;
    }

    fieldErrors[pathValue] = [issue.message];
  }

  return fieldErrors;
};

export async function loginHandler(request: Request) {
  const requestBody = await readLoginBody(request);

  if (!requestBody || typeof requestBody !== "object") {
    return createErrorResponse({
      detail: "Invalid request payload.",
      status: 400,
      title: "Bad Request",
      event: observabilityEvents.authLoginValidationFailed
    });
  }

  const parsedBody = loginSchema.safeParse(requestBody);

  if (!parsedBody.success) {
    const fieldErrors = readValidationFieldErrors(parsedBody.error.issues);

    return createErrorResponse({
      detail: "Please provide email and password.",
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
      status: 400,
      title: "Validation Failed",
      event: observabilityEvents.authLoginValidationFailed
    });
  }

  const adminApiClient = getAdminApiClient();

  if (!adminApiClient) {
    return createErrorResponse({
      detail: "Admin API base URL is not configured.",
      status: 500,
      title: "Configuration Error",
      event: observabilityEvents.authLoginServiceUnavailable,
      logLevel: "error"
    });
  }

  addSentryBreadcrumb("Admin login attempt", {
    category: "auth",
    data: {
      module: "auth",
      action: "login"
    }
  });

  try {
    const tokenResponse = await adminApiClient.auth.token({
      email: parsedBody.data.email,
      password: parsedBody.data.password
    });

    const setCookieHeaders = extractSetCookieHeaders(tokenResponse);

    if (tokenResponse.status >= 400) {
      const normalizedError = normalizeApiError(
        tokenResponse.data,
        tokenResponse.status
      );
      const traceId =
        normalizedError.traceId ??
        getTraceIdFromHeaders(tokenResponse.headers);

      logger.warn(observabilityEvents.apiRequestFailed, {
        module: "auth",
        action: "login",
        endpoint: AUTH_TOKEN_ENDPOINT,
        status: normalizedError.status,
        ...(traceId ? { traceId } : {})
      });

      return createErrorResponse({
        detail: normalizedError.detail,
        status: normalizedError.status,
        title: normalizedError.title,
        ...(normalizedError.type ? { type: normalizedError.type } : {}),
        ...(traceId ? { traceId } : {}),
        ...(normalizedError.fieldErrors ? { fieldErrors: normalizedError.fieldErrors } : {}),
        setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authLoginFailed
      });
    }

    const tokenData = parseTokenEnvelope(tokenResponse.data);

    if (!tokenData) {
      logger.error(observabilityEvents.authLoginFailed, {
        module: "auth",
        action: "login",
        status: tokenResponse.status,
        issue: "missing-access-token"
      });

      return createErrorResponse({
        detail: "Authentication response was incomplete. Please try again.",
        status: 502,
        title: "Upstream Error",
        clearAuthCookies: true,
        event: observabilityEvents.authLoginFailed,
        logLevel: "error"
      });
    }

    logger.info(observabilityEvents.authLoginSuccess, {
      module: "auth",
      action: "login",
      status: tokenResponse.status
    });

    addSentryBreadcrumb("Admin login success", {
      category: "auth",
      data: {
        module: "auth",
        action: "login",
        status: tokenResponse.status
      }
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: postLoginRedirectRoute
    });

    // Strategy A (defensive): forward any Set-Cookie headers from the backend if present
    if (setCookieHeaders.length > 0) {
      appendSetCookieHeaders(response, setCookieHeaders);
    } else {
      // Strategy B: backend sent no Set-Cookie headers — extract tokens from JSON body
      setAccessTokenCookie(response, tokenData.accessToken, tokenData.expiresIn);
      setRefreshTokenCookie(
        response,
        tokenData.refreshToken.token,
        tokenData.refreshToken.expirationDate
      );
    }

    // Always set the session signal cookie after successful token establishment
    setSessionCookie(response);

    return response;
  } catch (error) {
    logger.error(observabilityEvents.apiRequestFailed, {
      module: "auth",
      action: "login",
      endpoint: AUTH_TOKEN_ENDPOINT,
      status: 503
    });

    captureException(error, {
      scope: {
        tags: {
          module: "auth",
          action: "login"
        },
        level: "error"
      },
      context: {
        status: 503,
        endpoint: AUTH_TOKEN_ENDPOINT
      }
    });

    return createErrorResponse({
      detail: "Unable to reach the authentication service. Please try again.",
      status: 503,
      title: "Service Unavailable",
      event: observabilityEvents.authLoginServiceUnavailable,
      logLevel: "error"
    });
  }
}
