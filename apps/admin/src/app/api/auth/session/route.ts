import { NextResponse } from "next/server";

import {
  appendSetCookieHeaders,
  clearKnownAuthCookies,
  setSessionCookie
} from "@/lib/auth/next-response-cookies";
import { knownRefreshCookieNames } from "@/lib/auth/session-constants";
import { validateSessionWithSingleRefresh } from "@/lib/auth/session-strategy.js";
import { adminRuntimeEnv } from "@/lib/env";
import { logger, observabilityEvents } from "@/lib/observability";

const sessionProbePath = "/api/v1/admin/episodes?page=1&pageSize=1";
const refreshPath = "/api/v1/admin/auth/refresh-token";

type SessionValidation = {
  status: "authenticated" | "unauthenticated" | "error";
  reason?: string;
  setCookieHeaders: string[];
};

export async function GET(request: Request) {
  const sessionValidation = (await validateSessionWithSingleRefresh({
    baseUrl: adminRuntimeEnv.apiBaseUrl,
    cookieHeader: request.headers.get("cookie") ?? "",
    refreshCookieNames: knownRefreshCookieNames,
    refreshPath,
    sessionProbePath
  })) as SessionValidation;

  if (sessionValidation.status === "authenticated") {
    logger.info(observabilityEvents.authSessionProbeAuthenticated, {
      module: "auth",
      action: "session-probe",
      status: 200,
      refreshAttempted: sessionValidation.setCookieHeaders.length > 0
    });

    const response = NextResponse.json({ authenticated: true }, { status: 200 });
    appendSetCookieHeaders(response, sessionValidation.setCookieHeaders);
    setSessionCookie(response);

    return response;
  }

  const responseStatus = sessionValidation.status === "error" ? 503 : 401;
  logger.warn(observabilityEvents.authSessionProbeFailed, {
    module: "auth",
    action: "session-probe",
    status: responseStatus,
    reason: sessionValidation.reason
  });

  const response = NextResponse.json(
    {
      authenticated: false,
      reason: sessionValidation.reason
    },
    { status: responseStatus }
  );

  appendSetCookieHeaders(response, sessionValidation.setCookieHeaders);
  clearKnownAuthCookies(response);

  return response;
}
