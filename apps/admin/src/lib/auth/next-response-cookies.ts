import type { NextRequest, NextResponse } from "next/server";

import { adminRuntimeEnv } from "@/lib/env";

import {
  ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_VALUE,
  knownAuthCookieNames
} from "./session-constants";

const createCookieBaseOptions = () => ({
  domain: adminRuntimeEnv.cookieDomain || undefined,
  httpOnly: true,
  path: "/",
  sameSite: adminRuntimeEnv.cookieSameSite,
  secure: adminRuntimeEnv.cookieSecure
});

export const appendSetCookieHeaders = (
  response: NextResponse,
  setCookieHeaders: string[]
) => {
  for (const setCookieHeader of setCookieHeaders) {
    response.headers.append("set-cookie", setCookieHeader);
  }
};

export const setSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    ...createCookieBaseOptions(),
    maxAge: ADMIN_SESSION_COOKIE_MAX_AGE_SECONDS,
    name: ADMIN_SESSION_COOKIE_NAME,
    value: ADMIN_SESSION_COOKIE_VALUE
  });
};

export const clearKnownAuthCookies = (response: NextResponse) => {
  for (const cookieName of knownAuthCookieNames) {
    response.cookies.set({
      ...createCookieBaseOptions(),
      maxAge: 0,
      name: cookieName,
      value: ""
    });
  }
};

export const hasSessionSignalCookie = (request: NextRequest): boolean =>
  knownAuthCookieNames.some((cookieName) => request.cookies.has(cookieName));
