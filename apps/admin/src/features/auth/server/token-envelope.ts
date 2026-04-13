import type { TokenEnvelope } from "../types/auth.types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
};

const toPositiveInteger = (value: unknown): number | undefined =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value > 0
    ? value
    : undefined;

const isIsoDate = (value: string): boolean =>
  Number.isFinite(Date.parse(value));

export const parseTokenEnvelope = (
  payload: unknown
): TokenEnvelope | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const accessToken = toTrimmedString(payload.accessToken);
  const tokenType = toTrimmedString(payload.tokenType);
  const expiresIn = toPositiveInteger(payload.expiresIn);

  if (!accessToken || !tokenType || tokenType.toLowerCase() !== "bearer") {
    return undefined;
  }

  if (!expiresIn) {
    return undefined;
  }

  const refreshTokenPayload = payload.refreshToken;

  if (!isRecord(refreshTokenPayload)) {
    return undefined;
  }

  const refreshToken = toTrimmedString(refreshTokenPayload.token);
  const refreshTokenExpirationDate = toTrimmedString(
    refreshTokenPayload.expirationDate
  );

  if (!refreshToken || !refreshTokenExpirationDate) {
    return undefined;
  }

  if (!isIsoDate(refreshTokenExpirationDate)) {
    return undefined;
  }

  return {
    accessToken,
    refreshToken: {
      token: refreshToken,
      expirationDate: refreshTokenExpirationDate
    },
    tokenType: "Bearer",
    expiresIn
  };
};
