import { postLoginRedirectRoute } from "@/lib/routes";

import {
  loginErrorResponseSchema,
  loginSuccessResponseSchema
} from "../schemas/login.schema";
import type { LoginRequest, LoginServiceResult } from "../types/auth.types";

const readJsonPayload = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const loginService = async (
  payload: LoginRequest
): Promise<LoginServiceResult> => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const parsedErrorResponse = loginErrorResponseSchema.safeParse(
        await readJsonPayload(response)
      );

      const errorPayload = parsedErrorResponse.success
        ? parsedErrorResponse.data.error
        : undefined;

      return {
        ok: false,
        error: {
          kind: "response",
          detail:
            errorPayload?.detail ??
            "Unable to sign in. Check your credentials and try again.",
          status: errorPayload?.status ?? response.status,
          title: errorPayload?.title ?? "Authentication Failed",
          ...(errorPayload?.type ? { type: errorPayload.type } : {}),
          ...(errorPayload?.traceId ? { traceId: errorPayload.traceId } : {}),
          ...(errorPayload?.fieldErrors
            ? { fieldErrors: errorPayload.fieldErrors }
            : {})
        }
      };
    }

    const parsedSuccessResponse = loginSuccessResponseSchema.safeParse(
      await readJsonPayload(response)
    );

    return {
      ok: true,
      redirectTo:
        parsedSuccessResponse.success && parsedSuccessResponse.data.redirectTo
          ? parsedSuccessResponse.data.redirectTo
          : postLoginRedirectRoute
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        kind: "transport",
        detail: "Unable to reach the authentication service. Please try again.",
        status: 503,
        title: "Service Unavailable",
        cause: error
      }
    };
  }
};
