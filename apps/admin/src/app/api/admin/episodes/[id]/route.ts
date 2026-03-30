import { NextResponse } from "next/server";

import {
  appendSetCookieHeaders,
  clearKnownAuthCookies
} from "@/lib/auth/next-response-cookies";
import {
  getEpisodeFromBackend,
  updateEpisodeInBackend
} from "@/lib/api/episodes-admin-api";
import {
  addSentryBreadcrumb,
  captureException,
  logger,
  observabilityEvents
} from "@/lib/observability";

const toEpisodeId = (value: string): number | null => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const createErrorResponse = ({
  status,
  title,
  detail,
  traceId,
  setCookieHeaders
}: {
  status: number;
  title: string;
  detail: string;
  traceId?: string;
  setCookieHeaders: string[];
}) => {
  const response = NextResponse.json(
    {
      ok: false,
      error: {
        status,
        title,
        detail,
        ...(traceId ? { traceId } : {})
      }
    },
    { status }
  );

  appendSetCookieHeaders(response, setCookieHeaders);

  if (status === 401) {
    clearKnownAuthCookies(response);
  }

  return response;
};

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await context.params;
  const episodeId = toEpisodeId(id);

  if (!episodeId) {
    return createErrorResponse({
      status: 400,
      title: "Bad Request",
      detail: "Episode id must be a positive integer.",
      setCookieHeaders: []
    });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";

  addSentryBreadcrumb("Admin episode detail request", {
    category: "episodes",
    data: {
      module: "episodes",
      action: "detail",
      id: episodeId
    }
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
        endpoint: "/api/v1/admin/episodes/{id}",
        status: backendResult.error.status,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
      });

      return createErrorResponse({
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
      { status: backendResult.response.status }
    );

    appendSetCookieHeaders(response, backendResult.setCookieHeaders);

    return response;
  } catch (error) {
    logger.error(observabilityEvents.apiRequestFailed, {
      module: "episodes",
      action: "detail",
      endpoint: "/api/v1/admin/episodes/{id}",
      status: 503
    });

    captureException(error, {
      scope: {
        tags: {
          module: "episodes",
          action: "detail"
        },
        level: "error"
      },
      context: {
        endpoint: "/api/v1/admin/episodes/{id}",
        status: 503
      }
    });

    return createErrorResponse({
      status: 503,
      title: "Service Unavailable",
      detail: "Unable to load this episode right now.",
      setCookieHeaders: []
    });
  }
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await context.params;
  const episodeId = toEpisodeId(id);

  if (!episodeId) {
    return createErrorResponse({
      status: 400,
      title: "Bad Request",
      detail: "Episode id must be a positive integer.",
      setCookieHeaders: []
    });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const requestBody = (await request.json()) as Record<string, unknown>;

  addSentryBreadcrumb("Admin episode update request", {
    category: "episodes",
    data: {
      module: "episodes",
      action: "update",
      id: episodeId
    }
  });

  try {
    const backendResult = await updateEpisodeInBackend({
      cookieHeader,
      id: episodeId,
      payload: requestBody
    });

    if ("error" in backendResult) {
      logger.warn(observabilityEvents.apiRequestFailed, {
        module: "episodes",
        action: "update",
        endpoint: "/api/v1/admin/episodes/{id}",
        status: backendResult.error.status,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
      });

      return createErrorResponse({
        status: backendResult.error.status,
        title: backendResult.error.title,
        detail: backendResult.error.detail,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {}),
        setCookieHeaders: backendResult.setCookieHeaders
      });
    }

    logger.info(observabilityEvents.episodesActionExecuted, {
      module: "episodes",
      action: "update",
      status: backendResult.response.status,
      ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
    });

    const response = NextResponse.json(
      {
        ok: true,
        data: backendResult.data,
        ...(backendResult.traceId ? { traceId: backendResult.traceId } : {})
      },
      { status: backendResult.response.status }
    );

    appendSetCookieHeaders(response, backendResult.setCookieHeaders);

    return response;
  } catch (error) {
    logger.error(observabilityEvents.apiRequestFailed, {
      module: "episodes",
      action: "update",
      endpoint: "/api/v1/admin/episodes/{id}",
      status: 503
    });

    captureException(error, {
      scope: {
        tags: {
          module: "episodes",
          action: "update"
        },
        level: "error"
      },
      context: {
        endpoint: "/api/v1/admin/episodes/{id}",
        status: 503
      }
    });

    return createErrorResponse({
      status: 503,
      title: "Service Unavailable",
      detail: "Unable to update this episode right now.",
      setCookieHeaders: []
    });
  }
}
