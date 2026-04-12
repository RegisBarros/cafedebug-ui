import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBackendAuthHeaders,
  resolveAccessTokenFromCookieHeader
} from "../src/lib/auth/backend-auth-headers.js";
import {
  mergeCookieHeaderWithSetCookies,
  splitSetCookieHeader,
  validateSessionWithSingleRefresh
} from "../src/lib/auth/session-strategy.js";

const readHeaderValue = (headers, headerName) => {
  if (!headers) {
    return "";
  }

  if (headers instanceof Headers) {
    return headers.get(headerName) ?? "";
  }

  if (typeof headers[headerName] === "string") {
    return headers[headerName];
  }

  const lowercaseHeaderName = headerName.toLowerCase();

  if (typeof headers[lowercaseHeaderName] === "string") {
    return headers[lowercaseHeaderName];
  }

  return "";
};

test("buildBackendAuthHeaders translates the access-token cookie into a bearer header", () => {
  const headers = buildBackendAuthHeaders(
    "access_token=jwt-value; refreshToken=refresh-value",
    {
      accessCookieNames: ["accessToken", "access_token"]
    }
  );

  assert.equal(headers.Authorization, "Bearer jwt-value");
  assert.equal(headers.cookie, undefined);
});

test("buildBackendAuthHeaders refresh mode sends JSON headers without auth", () => {
  const headers = buildBackendAuthHeaders(
    "accessToken=jwt-value; refreshToken=refresh-value",
    {
      mode: "refresh",
      accessCookieNames: ["accessToken"]
    }
  );

  assert.equal(headers.Authorization, undefined);
  assert.equal(headers.cookie, undefined);
  assert.equal(headers.accept, "application/json");
  assert.equal(headers["content-type"], "application/json");
});

test("resolveAccessTokenFromCookieHeader reads the first matching known access cookie", () => {
  const accessToken = resolveAccessTokenFromCookieHeader(
    "token=fallback-token; accessToken=preferred-token",
    ["accessToken", "token"]
  );

  assert.equal(accessToken, "preferred-token");
});

test("splitSetCookieHeader keeps expires commas scoped to the same cookie", () => {
  const combinedHeader =
    "accessToken=new-token; Path=/; Expires=Wed, 01 Jan 2030 00:00:00 GMT; HttpOnly, refreshToken=next-refresh; Path=/; HttpOnly";

  assert.deepEqual(splitSetCookieHeader(combinedHeader), [
    "accessToken=new-token; Path=/; Expires=Wed, 01 Jan 2030 00:00:00 GMT; HttpOnly",
    "refreshToken=next-refresh; Path=/; HttpOnly"
  ]);
});

test("mergeCookieHeaderWithSetCookies rotates and removes cookies", () => {
  const mergedCookies = mergeCookieHeaderWithSetCookies(
    "accessToken=old; refreshToken=keep",
    [
      "accessToken=new; Path=/; HttpOnly",
      "refreshToken=; Path=/; Max-Age=0"
    ]
  );

  assert.equal(mergedCookies, "accessToken=new");
});

test("validateSessionWithSingleRefresh retries exactly once after a 401", async () => {
  const fetchCalls = [];

  const fetchMock = async (url, init) => {
    fetchCalls.push({
      url,
      init
    });

    if (fetchCalls.length === 1) {
      assert.equal(
        readHeaderValue(init?.headers, "Authorization"),
        "Bearer stale-token"
      );
      assert.equal(readHeaderValue(init?.headers, "cookie"), "");
      return new Response(null, { status: 401 });
    }

    if (fetchCalls.length === 2) {
      assert.equal(readHeaderValue(init?.headers, "Authorization"), "");
      assert.equal(readHeaderValue(init?.headers, "cookie"), "");

      return new Response(
        JSON.stringify({
          accessToken: "rotated-token",
          refreshToken: {
            token: "rotated-refresh",
            expirationDate: "2026-04-13T00:00:00.000Z"
          },
          tokenType: "Bearer",
          expiresIn: 3600
        }),
        {
          status: 201,
          headers: new Headers({ "content-type": "application/json" })
        }
      );
    }

    if (fetchCalls.length === 3) {
      assert.equal(
        readHeaderValue(init?.headers, "Authorization"),
        "Bearer rotated-token"
      );
      assert.equal(readHeaderValue(init?.headers, "cookie"), "");
      return new Response(null, { status: 200 });
    }

    throw new Error("Unexpected call count: " + fetchCalls.length);
  };

  const result = await validateSessionWithSingleRefresh({
    fetchImpl: fetchMock,
    baseUrl: "http://api.local",
    cookieHeader: "accessToken=stale-token; refreshToken=refresh-value",
    accessCookieNames: ["accessToken"],
    refreshCookieNames: ["refreshToken"],
    refreshPath: "/refresh",
    sessionProbePath: "/probe"
  });

  assert.equal(result.status, "authenticated");
  assert.equal(result.refreshAttempted, true);
  assert.equal(fetchCalls.length, 3);
});

test("validateSessionWithSingleRefresh stops when refresh fails", async () => {
  const fetchCalls = [];

  const fetchMock = async (url, init) => {
    fetchCalls.push({
      url,
      init
    });

    if (fetchCalls.length === 1) {
      assert.equal(
        readHeaderValue(init?.headers, "Authorization"),
        "Bearer stale-token"
      );
      return new Response(null, { status: 401 });
    }

    if (fetchCalls.length === 2) {
      assert.equal(readHeaderValue(init?.headers, "Authorization"), "");
      assert.equal(readHeaderValue(init?.headers, "cookie"), "");
      return new Response(null, { status: 401 });
    }

    throw new Error("Unexpected call count: " + fetchCalls.length);
  };

  const result = await validateSessionWithSingleRefresh({
    fetchImpl: fetchMock,
    baseUrl: "http://api.local",
    cookieHeader: "accessToken=stale-token; refreshToken=refresh-value",
    accessCookieNames: ["accessToken"],
    refreshCookieNames: ["refreshToken"],
    refreshPath: "/refresh",
    sessionProbePath: "/probe"
  });

  assert.equal(result.status, "unauthenticated");
  assert.equal(result.refreshAttempted, true);
  assert.equal(fetchCalls.length, 2);
});

test("validateSessionWithSingleRefresh stops when refresh payload is invalid", async () => {
  const fetchCalls = [];

  const fetchMock = async (_url, init) => {
    fetchCalls.push({ init });

    if (fetchCalls.length === 1) {
      return new Response(null, { status: 401 });
    }

    if (fetchCalls.length === 2) {
      assert.equal(readHeaderValue(init?.headers, "Authorization"), "");
      assert.equal(readHeaderValue(init?.headers, "cookie"), "");

      return new Response(
        JSON.stringify({
          tokenType: "Bearer"
        }),
        {
          status: 201,
          headers: new Headers({ "content-type": "application/json" })
        }
      );
    }

    throw new Error("Unexpected call count: " + fetchCalls.length);
  };

  const result = await validateSessionWithSingleRefresh({
    fetchImpl: fetchMock,
    baseUrl: "http://api.local",
    cookieHeader: "accessToken=stale-token; refreshToken=refresh-value",
    accessCookieNames: ["accessToken"],
    refreshCookieNames: ["refreshToken"],
    refreshPath: "/refresh",
    sessionProbePath: "/probe"
  });

  assert.equal(result.status, "unauthenticated");
  assert.equal(result.reason, "refresh-invalid-payload");
  assert.equal(result.refreshAttempted, true);
  assert.equal(fetchCalls.length, 2);
});
