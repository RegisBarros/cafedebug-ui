const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|authorization|cookie|session|refresh|access|email|phone|cpf|cnpj|credit|card|ssn|otp|pin)/i;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi;
const JWT_PATTERN =
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g;

const MAX_DEPTH = 5;
const MAX_ARRAY_ITEMS = 20;
const MAX_STRING_LENGTH = 512;
export const REDACTED_VALUE = "[REDACTED]";

const shouldRedactKey = (key: string): boolean => SENSITIVE_KEY_PATTERN.test(key);

const redactSensitiveString = (value: string): string => {
  const redactedValue = value
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(BEARER_TOKEN_PATTERN, "Bearer [REDACTED]")
    .replace(JWT_PATTERN, "[REDACTED_JWT]");

  return redactedValue.length > MAX_STRING_LENGTH
    ? `${redactedValue.slice(0, MAX_STRING_LENGTH)}…[truncated]`
    : redactedValue;
};

export const sanitizeTelemetryValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) {
    return "[truncated]";
  }

  if (value === null || typeof value === "undefined") {
    return value;
  }

  if (typeof value === "string") {
    return redactSensitiveString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveString(value.message)
    };
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeTelemetryValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(
      ([key, nestedValue]) => {
        if (shouldRedactKey(key)) {
          return [key, "[REDACTED]"] as const;
        }

        return [key, sanitizeTelemetryValue(nestedValue, depth + 1)] as const;
      }
    );

    return Object.fromEntries(sanitizedEntries);
  }

  return String(value);
};

export const sanitizeTelemetryRecord = <T>(record: T): T =>
  sanitizeTelemetryValue(record) as T;

export const redactSensitiveData = <T>(value: T): T =>
  sanitizeTelemetryValue(value) as T;

export const sanitizeLogContext = (
  context: unknown
): Record<string, unknown> => {
  if (
    typeof context === "object" &&
    context !== null &&
    !Array.isArray(context)
  ) {
    return redactSensitiveData(context) as Record<string, unknown>;
  }

  if (typeof context === "undefined") {
    return {};
  }

  return {
    value: redactSensitiveData(context)
  };
};
