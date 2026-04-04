import { NextResponse } from "next/server";

import {
  appendSetCookieHeaders,
  clearKnownAuthCookies
} from "@/lib/auth/next-response-cookies";
import { logger } from "@/lib/observability";

import type { AuthErrorPayload } from "../types/auth.types";

/**
 * Builds a standardized auth error NextResponse.
 *
 * Handles:
 * - JSON envelope: { ok: false, error: { status, title, detail, type?, traceId?, fieldErrors? } }
 * - Optional cookie header forwarding (appendSetCookieHeaders)
 * - Optional auth cookie clearing (clearKnownAuthCookies)
 * - Observability logging at the specified log level
 *
 * Does NOT handle: captureException, addSentryBreadcrumb — those stay in the calling handler
 * because they require request/endpoint context not available here.
 */
export const createErrorResponse = ({
  detail,
  status,
  title,
  type,
  fieldErrors,
  traceId,
  event,
  logLevel = "warn",
  setCookieHeaders = [],
  clearAuthCookies = false
}: AuthErrorPayload): NextResponse => {
  const response = NextResponse.json(
    {
      ok: false,
      error: {
        status,
        title,
        detail,
        ...(type ? { type } : {}),
        ...(traceId ? { traceId } : {}),
        ...(fieldErrors ? { fieldErrors } : {})
      }
    },
    { status }
  );

  if (setCookieHeaders.length > 0) {
    appendSetCookieHeaders(response, setCookieHeaders);
  }

  if (clearAuthCookies) {
    clearKnownAuthCookies(response);
  }

  logger[logLevel](event, {
    module: "auth",
    status,
    title,
    ...(traceId ? { traceId } : {}),
    hasFieldErrors: Boolean(fieldErrors)
  });

  return response;
};
