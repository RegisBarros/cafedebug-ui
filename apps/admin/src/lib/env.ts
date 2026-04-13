const toTrimmedValue = (value: string | undefined): string => value?.trim() ?? "";

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

const parseSameSite = (
  value: string | undefined
): "lax" | "strict" | "none" => {
  const normalizedValue = toTrimmedValue(value).toLowerCase();

  if (
    normalizedValue === "strict" ||
    normalizedValue === "none" ||
    normalizedValue === "lax"
  ) {
    return normalizedValue;
  }

  return "lax";
};

export const adminRuntimeEnv = {
  apiBaseUrl: toTrimmedValue(process.env.ADMIN_API_BASE_URL),
  cookieDomain: toTrimmedValue(process.env.ADMIN_COOKIE_DOMAIN),
  cookieSameSite: parseSameSite(process.env.ADMIN_COOKIE_SAMESITE),
  cookieSecure: parseBooleanFlag(
    process.env.ADMIN_COOKIE_SECURE,
    process.env.NODE_ENV === "production"
  ),
  accessCookieName: toTrimmedValue(process.env.ADMIN_ACCESS_COOKIE_NAME),
  refreshCookieName: toTrimmedValue(process.env.ADMIN_REFRESH_COOKIE_NAME)
} as const;
