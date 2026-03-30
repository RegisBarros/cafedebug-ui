import { NextResponse } from "next/server";

import {
  appendSetCookieHeaders,
  clearKnownAuthCookies
} from "@/lib/auth/next-response-cookies";
import {
  createEpisodeInBackend,
  listEpisodesFromBackend
} from "@/lib/api/episodes-admin-api";
import {
  addSentryBreadcrumb,
  captureException,
  logger,
  observabilityEvents
} from "@/lib/observability";

const parseInteger = (value: string | null, fallbackValue: number): number => {
  if (!value) {
    return fallbackValue;
  }

  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallbackValue;
};

const parseBoolean = (
  value: string | null,
  fallbackValue: boolean
): boolean => {
  if (typeof value !== "string") {
    return fallbackValue;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  return fallbackValue;
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const page = parseInteger(requestUrl.searchParams.get("page"), 1);
  const pageSize = parseInteger(requestUrl.searchParams.get("pageSize"), 10);
  const sortBy = requestUrl.searchParams.get("sortBy")?.trim() || "publishedAt";
  const descending = parseBoolean(
    requestUrl.searchParams.get("descending"),
    true
  );
  const cookieHeader = request.headers.get("cookie") ?? "";

  addSentryBreadcrumb("Admin episodes list request", {
    category: "episodes",
    data: {
      module: "episodes",
      action: "list",
      page,
      pageSize,
      sortBy,
      descending
    }
  });

  try {
    const backendResult = await listEpisodesFromBackend({
      cookieHeader,
      query: {
        page,
        pageSize,
        sortBy,
        descending
      }
    });

    if ("error" in backendResult) {
      logger.warn(observabilityEvents.episodesFetchFailed, {
        module: "episodes",
        action: "list",
        endpoint: "/api/v1/admin/episodes",
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
    logger.error(observabilityEvents.episodesFetchFailed, {
      module: "episodes",
      action: "list",
      endpoint: "/api/v1/admin/episodes",
      status: 503
    });

    captureException(error, {
      scope: {
        tags: {
          module: "episodes",
          action: "list"
        },
        level: "error"
      },
      context: {
        endpoint: "/api/v1/admin/episodes",
        status: 503
      }
    });

    return createErrorResponse({
      status: 503,
      title: "Service Unavailable",
      detail: "Unable to load episodes right now.",
      setCookieHeaders: []
    });
  }
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const requestBody = (await request.json()) as Record<string, unknown>;

  addSentryBreadcrumb("Admin episode create request", {
    category: "episodes",
    data: {
      module: "episodes",
      action: "create"
    }
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
        endpoint: "/api/v1/admin/episodes",
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
      action: "create",
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
      action: "create",
      endpoint: "/api/v1/admin/episodes",
      status: 503
    });

    captureException(error, {
      scope: {
        tags: {
          module: "episodes",
          action: "create"
        },
        level: "error"
      },
      context: {
        endpoint: "/api/v1/admin/episodes",
        status: 503
      }
    });

    return createErrorResponse({
      status: 503,
      title: "Service Unavailable",
      detail: "Unable to create episode right now.",
      setCookieHeaders: []
    });
  }
}
