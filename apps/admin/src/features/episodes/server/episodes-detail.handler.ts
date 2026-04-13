import { NextResponse } from "next/server";

import { getEpisodeFromBackend } from "@/lib/api/episodes-admin-api";
import { appendSetCookieHeaders } from "@/lib/auth/next-response-cookies";
import {
  addSentryBreadcrumb,
  captureException,
  logger,
  observabilityEvents
} from "@/lib/observability";

import { createEpisodesErrorResponse } from "./episodes-error-response";

const ENDPOINT = "/api/v1/admin/episodes/{id}";

const toEpisodeId = (value: string): number | null => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

export async function episodesDetailHandler(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const episodeId = toEpisodeId(id);

  if (!episodeId) {
    return createEpisodesErrorResponse({
      status: 400,
      title: "Bad Request",
      detail: "Episode id must be a positive integer.",
      setCookieHeaders: []
    });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";

  addSentryBreadcrumb("Admin episode detail request", {
    category: "episodes",
    data: { module: "episodes", action: "detail", id: episodeId }
  });

  try {
    const backendResult = await getEpisodeFromBackend({
      cookieHeader,
      id: episodeId
    });

    if ("error" in backendResult) {
      logger.warn(observabilityEvents.apiRequestFailed, {
        module: "episodes",
        action: "detail",
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
      module: "episodes", action: "detail", endpoint: ENDPOINT, status: 503
    });

    captureException(error, {
      scope: { tags: { module: "episodes", action: "detail" }, level: "error" },
      context: { endpoint: ENDPOINT, status: 503 }
    });

    return createEpisodesErrorResponse({
      status: 503,
      title: "Service Unavailable",
      detail: "Unable to load this episode right now.",
      setCookieHeaders: []
    });
  }
}
