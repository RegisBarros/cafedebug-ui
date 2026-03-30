const REDACTED_VALUE = "[REDACTED]";
const MAX_REDACTION_DEPTH = 6;
const MAX_ARRAY_ITEMS = 25;
const MAX_STRING_LENGTH = 1200;

const sensitiveKeyPatterns = Object.freeze([
  /pass(word)?/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /api[-_]?key/i,
  /session/i,
  /email/i,
  /phone/i,
  /cpf|ssn/i
]);

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const shouldRedactKey = (key) =>
  sensitiveKeyPatterns.some((pattern) => pattern.test(key));

const truncateString = (value) => {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`;
};

const sanitizeError = (error, depth) => ({
  name: error.name,
  message: truncateString(error.message),
  ...(typeof error.stack === "string"
    ? { stack: truncateString(error.stack) }
    : {}),
  ...(error.cause ? { cause: sanitizeValue(error.cause, depth + 1, "cause") } : {})
});

const sanitizeArray = (value, depth) =>
  value
    .slice(0, MAX_ARRAY_ITEMS)
    .map((entry) => sanitizeValue(entry, depth + 1))
    .concat(value.length > MAX_ARRAY_ITEMS ? ["[TRUNCATED_ARRAY_ITEMS]"] : []);

const sanitizeRecord = (value, depth) =>
  Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (shouldRedactKey(key)) {
        return [key, REDACTED_VALUE];
      }

      return [key, sanitizeValue(entryValue, depth + 1, key)];
    })
  );

const sanitizeValue = (value, depth = 0, keyHint = "") => {
  if (shouldRedactKey(keyHint)) {
    return REDACTED_VALUE;
  }

  if (depth > MAX_REDACTION_DEPTH) {
    return "[MAX_DEPTH_REACHED]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (typeof value === "symbol") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return sanitizeError(value, depth);
  }

  if (Array.isArray(value)) {
    return sanitizeArray(value, depth);
  }

  if (isRecord(value)) {
    return sanitizeRecord(value, depth);
  }

  return String(value);
};

export const redactSensitiveData = (value) => sanitizeValue(value, 0);

export const sanitizeTelemetryRecord = (record) => redactSensitiveData(record);

export const sanitizeLogContext = (context) => {
  if (isRecord(context)) {
    return redactSensitiveData(context);
  }

  if (context === undefined) {
    return {};
  }

  return {
    value: redactSensitiveData(context)
  };
};

export { REDACTED_VALUE };
