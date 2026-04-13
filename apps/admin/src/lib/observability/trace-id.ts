export const traceIdHeaderNames = Object.freeze([
  "x-trace-id",
  "x-request-id",
  "x-correlation-id"
]);

const toTrimmedString = (value: string | null | undefined): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export const getTraceIdFromHeaders = (
  headers: Headers | null | undefined
): string | undefined => {
  if (!headers) {
    return undefined;
  }

  for (const headerName of traceIdHeaderNames) {
    const traceId = toTrimmedString(headers.get(headerName));

    if (traceId) {
      return traceId;
    }
  }

  return undefined;
};
