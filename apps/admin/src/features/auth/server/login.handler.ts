/**
 * Token Cookie Strategy: STRATEGY B — JSON Body Token Extraction
 *
 * CONFIRMED (Phase 0): The backend POST /api/v1/admin/auth/token endpoint returns
 * token data exclusively in the JSON response body. No Set-Cookie headers are emitted.
 *
 * The generated OpenAPI schema (components["schemas"]["Result"]) only contains
 * `isSuccess`, `error`, and `isFailure` — token fields are absent from the schema.
 * The actual response body includes: { accessToken, refreshToken, tokenType, expiresIn }.
 *
 * This handler:
 * 1. Attempts Strategy A first (forwarding any Set-Cookie headers defensively)
 * 2. Falls back to Strategy B: extracts tokens from JSON body and sets HttpOnly cookies
 * 3. Always sets the session signal cookie after successful token establishment
 */
import { NextResponse } from "next/server";

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
import type { TokenResponse } from "../types/auth.types";

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
      body: {
        email: parsedBody.data.email,
        password: parsedBody.data.password
      }
    });

    const normalizedTokenResponse = adminApiClient.normalizeResponse(tokenResponse);
    const setCookieHeaders = extractSetCookieHeaders(
      normalizedTokenResponse.response
    );

    if ("error" in normalizedTokenResponse) {
      const responseFieldErrors = normalizedTokenResponse.error.fieldErrors;
      const traceId =
        normalizedTokenResponse.error.traceId ??
        getTraceIdFromHeaders(normalizedTokenResponse.response.headers);

      logger.warn(observabilityEvents.apiRequestFailed, {
        module: "auth",
        action: "login",
        endpoint: adminApiClient.paths.auth.token,
        status: normalizedTokenResponse.error.status,
        ...(traceId ? { traceId } : {})
      });

      return createErrorResponse({
        detail: normalizedTokenResponse.error.detail,
        status: normalizedTokenResponse.error.status,
        title: normalizedTokenResponse.error.title,
        ...(normalizedTokenResponse.error.type ? { type: normalizedTokenResponse.error.type } : {}),
        ...(traceId ? { traceId } : {}),
        ...(responseFieldErrors ? { fieldErrors: responseFieldErrors } : {}),
        setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authLoginFailed
      });
    }

    // GAP-02: Removed dead `isSuccess === false` check — the API contract has no such
    // field in the token response. Any API errors surface via `"error" in normalizedTokenResponse`.

    // Strategy B: Extract tokens from the JSON response body.
    // The generated schema does not capture token fields; use a type assertion
    // against the verified TokenResponse shape from the API contract.
    const tokenData = normalizedTokenResponse.data as unknown as TokenResponse;

    if (!tokenData.accessToken || typeof tokenData.accessToken !== "string") {
      logger.error(observabilityEvents.authLoginFailed, {
        module: "auth",
        action: "login",
        status: 200,
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
      status: 200
    });

    addSentryBreadcrumb("Admin login success", {
      category: "auth",
      data: {
        module: "auth",
        action: "login",
        status: 200
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
      endpoint: adminApiClient.paths.auth.token,
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
        endpoint: adminApiClient.paths.auth.token
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
