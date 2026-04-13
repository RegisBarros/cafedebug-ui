import { NextResponse } from "next/server";

import { createEpisodeInBackend } from "@/lib/api/episodes-admin-api";
import { appendSetCookieHeaders } from "@/lib/auth/next-response-cookies";
import {
  addSentryBreadcrumb,
  captureException,
  logger,
  observabilityEvents
} from "@/lib/observability";

import { createEpisodesErrorResponse } from "./episodes-error-response";

const ENDPOINT = "/api/v1/admin/episodes";

export async function episodesCreateHandler(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const requestBody = (await request.json()) as Record<string, unknown>;

  addSentryBreadcrumb("Admin episode create request", {
    category: "episodes",
    data: { module: "episodes", action: "create" }
  });

  try {
    const backendResult = await createEpisodeInBackend({
      cookieHeader,
      payload: requestBody
    });

    if ("error" in backendResult) {
      logger.warn(observabilityEvents.apiRequestFailed, {
        module: "episodes",
        action: "create",
        endpoint: ENDPOINT,
        status: backendResult.error.status,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
      });

      return createEpisodesErrorResponse({
        status: backendResult.error.status,
        title: backendResult.error.title,
        detail: backendResult.error.detail,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {}),
        setCookieHeaders: backendResult.setCookieHeaders
      });
    }

    logger.info(observabilityEvents.episodesActionExecuted, {
      module: "episodes",
      action: "create",
      status: backendResult.status,
      ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
    });

    const response = NextResponse.json(
      {
        ok: true,
        data: backendResult.data,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
      },
      { status: backendResult.status }
    );

    appendSetCookieHeaders(response, backendResult.setCookieHeaders);
    return response;
  } catch (error) {
    logger.error(observabilityEvents.apiRequestFailed, {
      module: "episodes", action: "create", endpoint: ENDPOINT, status: 503
    });

    captureException(error, {
      scope: { tags: { module: "episodes", action: "create" }, level: "error" },
      context: { endpoint: ENDPOINT, status: 503 }
    });

    return createEpisodesErrorResponse({
      status: 503,
      title: "Service Unavailable",
      detail: "Unable to create episode right now.",
      setCookieHeaders: []
    });
  }
}
