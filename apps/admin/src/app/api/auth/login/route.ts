import { createAdminApiClient, type ApiFieldErrors } from "@cafedebug/api-client";
import { NextResponse } from "next/server";

import {
  appendSetCookieHeaders,
  clearKnownAuthCookies,
  setSessionCookie
} from "@/lib/auth/next-response-cookies";
import { extractSetCookieHeaders } from "@/lib/auth/session-strategy.js";
import { adminRuntimeEnv } from "@/lib/env";
import {
  addSentryBreadcrumb,
  captureException,
  getTraceIdFromHeaders,
  logger,
  observabilityEvents
} from "@/lib/observability";
import { postLoginRedirectRoute } from "@/lib/routes";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

type LoginErrorPayload = {
  detail: string;
  status: number;
  title: string;
  fieldErrors?: ApiFieldErrors;
  traceId?: string;
};

const createErrorResponse = ({
  detail,
  status,
  title,
  fieldErrors,
  traceId,
  event,
  logLevel = "warn",
  setCookieHeaders = [],
  clearAuthCookies = false
}: LoginErrorPayload & {
  event: string;
  logLevel?: "warn" | "error";
  setCookieHeaders?: string[];
  clearAuthCookies?: boolean;
}) => {
  const response = NextResponse.json(
  {
      ok: false,
      error: {
        detail,
        status,
        title,
        ...(traceId ? { traceId } : {}),
        ...(fieldErrors ? { fieldErrors } : {})
      }
    },
    { status }
  );

  appendSetCookieHeaders(response, setCookieHeaders);

  if (clearAuthCookies) {
    clearKnownAuthCookies(response);
  }

  logger[logLevel](event, {
    module: "auth",
    action: "login",
    status,
    title,
    ...(traceId ? { traceId } : {}),
    hasFieldErrors: Boolean(fieldErrors)
  });

  return response;
};

const readLoginBody = async (
  request: Request
): Promise<LoginRequestBody | undefined> => {
  try {
    return (await request.json()) as LoginRequestBody;
  } catch {
    return undefined;
  }
};

export async function POST(request: Request) {
  const requestBody = await readLoginBody(request);

  if (!requestBody || typeof requestBody !== "object") {
    return createErrorResponse({
      detail: "Invalid request payload.",
      status: 400,
      title: "Bad Request",
      event: observabilityEvents.authLoginValidationFailed
    });
  }

  const email =
    typeof requestBody.email === "string" ? requestBody.email.trim() : "";
  const password =
    typeof requestBody.password === "string" ? requestBody.password : "";

  const fieldErrors: ApiFieldErrors = {};

  if (!email) {
    fieldErrors.email = ["Email is required."];
  }

  if (!password) {
    fieldErrors.password = ["Password is required."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createErrorResponse({
      detail: "Please provide email and password.",
      fieldErrors,
      status: 400,
      title: "Validation Failed",
      event: observabilityEvents.authLoginValidationFailed
    });
  }

  if (!adminRuntimeEnv.apiBaseUrl) {
    return createErrorResponse({
      detail: "Admin API base URL is not configured.",
      status: 500,
      title: "Configuration Error",
      event: observabilityEvents.authLoginServiceUnavailable,
      logLevel: "error"
    });
  }

  const adminApiClient = createAdminApiClient({
    baseUrl: adminRuntimeEnv.apiBaseUrl
  });

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
        email,
        password
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
        ...(traceId ? { traceId } : {}),
        ...(responseFieldErrors ? { fieldErrors: responseFieldErrors } : {}),
        setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authLoginFailed
      });
    }

    if (normalizedTokenResponse.data.isSuccess === false) {
      const fallbackErrorDetail =
        normalizedTokenResponse.data.error?.message?.trim() ||
        "Authentication failed. Check your credentials and try again.";

      return createErrorResponse({
        detail: fallbackErrorDetail,
        status: 401,
        title: "Authentication Failed",
        setCookieHeaders,
        clearAuthCookies: true,
        event: observabilityEvents.authLoginFailed
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

    appendSetCookieHeaders(response, setCookieHeaders);
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
