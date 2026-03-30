export type ApiFieldErrors = Record<string, string[]>;

export interface NormalizedApiError {
  status: number;
  title: string;
  detail: string;
  fieldErrors?: ApiFieldErrors;
  traceId?: string;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const toInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

const toFieldErrors = (value: unknown): ApiFieldErrors | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value)
    .map(([field, messages]) => {
      if (!Array.isArray(messages)) {
        return [field, []] as const;
      }

      const normalizedMessages = messages.filter(
        (message): message is string => typeof message === "string"
      );

      return [field, normalizedMessages] as const;
    })
    .filter(([, messages]) => messages.length > 0);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const toProblemSource = (error: unknown): UnknownRecord | undefined => {
  if (!isRecord(error)) {
    return undefined;
  }

  if (isRecord(error.error)) {
    return error.error;
  }

  if (isRecord(error.data)) {
    return error.data;
  }

  return error;
};

export const normalizeApiError = (
  error: unknown,
  fallbackStatus = 500
): NormalizedApiError => {
  const source = toProblemSource(error);

  if (!source) {
    return {
      status: fallbackStatus,
      title: "Unexpected Error",
      detail: "An unexpected error occurred while processing the request."
    };
  }

  const status = toInteger(source.status) ?? fallbackStatus;
  const title = toNonEmptyString(source.title) ?? "Request Failed";
  const detail =
    toNonEmptyString(source.detail) ??
    toNonEmptyString(source.message) ??
    "Request failed.";

  const fieldErrors =
    toFieldErrors(source.fieldErrors) ?? toFieldErrors(source.errors);
  const traceId = toNonEmptyString(source.traceId);

  return {
    status,
    title,
    detail,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(traceId ? { traceId } : {})
  };
};

export const isNormalizedApiError = (
  value: unknown
): value is NormalizedApiError => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.status === "number" &&
    typeof value.title === "string" &&
    typeof value.detail === "string"
  );
};
