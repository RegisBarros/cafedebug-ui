import { adminRuntimeEnv } from "@/lib/env";

const uniqueCookieNames = (cookieNames: string[]): string[] =>
  Array.from(
    new Set(
      cookieNames
        .map((cookieName) => cookieName.trim())
        .filter((cookieName) => cookieName.length > 0)
    )
  );

const defaultAccessCookieNames = [
  "accessToken",
  "access_token",
  "adminAccessToken",
  "token"
];
const defaultRefreshCookieNames = [
  "refreshToken",
  "refresh_token",
  "adminRefreshToken"
];

export const ADMIN_SESSION_COOKIE_NAME = "cafedebug_admin_session";
export const ADMIN_SESSION_COOKIE_VALUE = "active";
export const ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

export const knownAccessCookieNames = uniqueCookieNames([
  adminRuntimeEnv.accessCookieName,
  ...defaultAccessCookieNames
]);

export const knownRefreshCookieNames = uniqueCookieNames([
  adminRuntimeEnv.refreshCookieName,
  ...defaultRefreshCookieNames
]);

export const knownAuthCookieNames = uniqueCookieNames([
  ADMIN_SESSION_COOKIE_NAME,
  ...knownAccessCookieNames,
  ...knownRefreshCookieNames
]);
