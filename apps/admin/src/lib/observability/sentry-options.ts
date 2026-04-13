import * as Sentry from "@sentry/nextjs";

import { sanitizeTelemetryRecord } from "./redaction";

type SentryRuntime = "client" | "server" | "edge";
type SentryInitOptions = NonNullable<Parameters<typeof Sentry.init>[0]>;

const parseBooleanFlag = (
  value: string | undefined,
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

const parseSampleRate = (
  value: string | undefined,
  fallbackValue: number
): number => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallbackValue;
  }

  return parsedValue >= 0 && parsedValue <= 1 ? parsedValue : fallbackValue;
};

const resolveDsn = (runtime: SentryRuntime): string | undefined => {
  const publicDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  const privateDsn = process.env.SENTRY_DSN?.trim();

  if (runtime === "client") {
    return publicDsn;
  }

  return privateDsn || publicDsn;
};

export const createSentryInitOptions = (runtime: SentryRuntime): SentryInitOptions => {
  const dsn = resolveDsn(runtime);

  return {
    ...(dsn ? { dsn } : {}),
    enabled: Boolean(dsn) && parseBooleanFlag(process.env.SENTRY_ENABLED, true),
    environment: process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
    sendDefaultPii: false,
    beforeSend: (event) => sanitizeTelemetryRecord(event),
    beforeBreadcrumb: (breadcrumb) => sanitizeTelemetryRecord(breadcrumb)
  };
};
