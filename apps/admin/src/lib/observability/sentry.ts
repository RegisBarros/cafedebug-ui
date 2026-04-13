import * as Sentry from "@sentry/nextjs";

import { redactSensitiveData } from "./redaction.js";

type CaptureExceptionOptions = {
  scope?: {
    tags?: Record<string, string | number | boolean | undefined>;
    extras?: Record<string, unknown>;
    contexts?: Record<string, Record<string, unknown>>;
    user?: {
      id?: string;
      username?: string;
      email?: string;
      ip_address?: string;
    };
    level?: "fatal" | "error" | "warning" | "log" | "info" | "debug";
    fingerprint?: string[];
  };
  context?: Record<string, unknown>;
};

const applyScopeOptions = (
  scope: Sentry.Scope,
  options: CaptureExceptionOptions["scope"]
) => {
  if (!options) {
    return;
  }

  if (options.level) {
    scope.setLevel(options.level);
  }

  if (Array.isArray(options.fingerprint) && options.fingerprint.length > 0) {
    scope.setFingerprint(options.fingerprint);
  }

  if (options.tags) {
    for (const [key, value] of Object.entries(options.tags)) {
      if (value !== undefined) {
        scope.setTag(key, String(value));
      }
    }
  }

  if (options.extras) {
    for (const [key, value] of Object.entries(options.extras)) {
      scope.setExtra(key, redactSensitiveData(value));
    }
  }

  if (options.contexts) {
    for (const [key, value] of Object.entries(options.contexts)) {
      scope.setContext(
        key,
        redactSensitiveData(value) as {
          [key: string]: unknown;
        }
      );
    }
  }

  if (options.user) {
    const redactedUser = redactSensitiveData(options.user) as {
      id?: string;
      username?: string;
      email?: string;
      ip_address?: string;
    };

    scope.setUser(redactedUser);
  }
};

export const captureException = (
  error: unknown,
  options: CaptureExceptionOptions = {}
) => {
  Sentry.withScope((scope) => {
    applyScopeOptions(scope, options.scope);

    if (options.context) {
      scope.setContext(
        "context",
        redactSensitiveData(options.context) as {
          [key: string]: unknown;
        }
      );
    }

    Sentry.captureException(error);
  });
};

export const addSentryBreadcrumb = (
  message: string,
  options: {
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, unknown>;
    type?: string;
  } = {}
) => {
  Sentry.addBreadcrumb({
    message,
    category: options.category ?? "app.event",
    level: options.level ?? "info",
    ...(options.type ? { type: options.type } : {}),
    ...(options.data ? { data: redactSensitiveData(options.data) } : {})
  });
};
