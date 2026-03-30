import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeCookieHeaderWithSetCookies,
  splitSetCookieHeader,
  validateSessionWithSingleRefresh
} from "../src/lib/auth/session-strategy.js";

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
      return new Response(null, { status: 401 });
    }

    if (fetchCalls.length === 2) {
      const headers = new Headers();
      headers.append("set-cookie", "accessToken=rotated-token; Path=/; HttpOnly");

      return new Response(null, {
        status: 200,
        headers
      });
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

test("validateSessionWithSingleRefresh stops when refresh fails", async () => {
  const fetchCalls = [];

  const fetchMock = async (url, init) => {
    fetchCalls.push({
      url,
      init
    });

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
