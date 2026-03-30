import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTH_ROUTE_RULES,
  getRouteProtectionRedirect,
  isProtectedAdminPath
} from "../src/lib/auth/route-rules.js";
import { validateSessionWithSingleRefresh } from "../src/lib/auth/session-strategy.js";

const readCookieHeader = (headers) => {
  if (!headers) {
    return "";
  }

  if (headers instanceof Headers) {
    return headers.get("cookie") ?? "";
  }

  if (typeof headers.cookie === "string") {
    return headers.cookie;
  }

  return "";
};

test("auth route rules enforce episodes-first redirects", () => {
  assert.equal(AUTH_ROUTE_RULES.login, "/login");
  assert.equal(AUTH_ROUTE_RULES.postLogin, "/episodes");
});

test("protected admin routes include episodes/dashboard/settings paths", () => {
  assert.equal(isProtectedAdminPath("/episodes"), true);
  assert.equal(isProtectedAdminPath("/episodes/new"), true);
  assert.equal(isProtectedAdminPath("/dashboard"), true);
  assert.equal(isProtectedAdminPath("/settings"), true);
  assert.equal(isProtectedAdminPath("/login"), false);
  assert.equal(isProtectedAdminPath("/"), false);
});

test("route protection redirects anonymous and authenticated users correctly", () => {
  assert.equal(
    getRouteProtectionRedirect({
      pathname: "/login",
      isAuthenticated: true
    }),
    "/episodes"
  );

  assert.equal(
    getRouteProtectionRedirect({
      pathname: "/episodes/new",
      isAuthenticated: false
    }),
    "/login"
  );

  assert.equal(
    getRouteProtectionRedirect({
      pathname: "/episodes",
      isAuthenticated: true
    }),
    null
  );
});

test("single refresh attempt retries exactly once after a 401", async () => {
  const fetchCalls = [];

  const fetchMock = async (url, init) => {
    fetchCalls.push({ url, init });

    if (fetchCalls.length === 1) {
      return new Response(null, { status: 401 });
    }

    if (fetchCalls.length === 2) {
      const headers = new Headers();
      headers.append("set-cookie", "accessToken=rotated-token; Path=/; HttpOnly");
      return new Response(null, { status: 200, headers });
    }

    if (fetchCalls.length === 3) {
      const cookieHeader = readCookieHeader(init?.headers);
      assert.match(cookieHeader, /accessToken=rotated-token/);
      return new Response(null, { status: 200 });
    }

    throw new Error(`Unexpected call count: ${fetchCalls.length}`);
  };

  const result = await validateSessionWithSingleRefresh({
    fetchImpl: fetchMock,
    baseUrl: "http://api.local",
    cookieHeader: "accessToken=stale-token; refreshToken=refresh-value",
    refreshCookieNames: ["refreshToken"],
    refreshPath: "/refresh",
    sessionProbePath: "/probe"
  });

  assert.equal(result.status, "authenticated");
  assert.equal(result.refreshAttempted, true);
  assert.equal(fetchCalls.length, 3);
});

test("single refresh attempt stops when refresh fails", async () => {
  const fetchCalls = [];

  const fetchMock = async (url, init) => {
    fetchCalls.push({ url, init });

    if (fetchCalls.length === 1) {
      return new Response(null, { status: 401 });
    }

    if (fetchCalls.length === 2) {
      return new Response(null, { status: 401 });
    }

    throw new Error(`Unexpected call count: ${fetchCalls.length}`);
  };

  const result = await validateSessionWithSingleRefresh({
    fetchImpl: fetchMock,
    baseUrl: "http://api.local",
    cookieHeader: "refreshToken=refresh-value",
    refreshCookieNames: ["refreshToken"],
    refreshPath: "/refresh",
    sessionProbePath: "/probe"
  });

  assert.equal(result.status, "unauthenticated");
  assert.equal(result.refreshAttempted, true);
  assert.equal(fetchCalls.length, 2);
});
