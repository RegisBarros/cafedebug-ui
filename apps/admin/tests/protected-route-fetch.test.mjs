import assert from "node:assert/strict";
import test from "node:test";

import { fetchProtectedAdminRoute } from "../src/lib/api/protected-route-fetch.js";

test("fetchProtectedAdminRoute retries once after successful refresh", async () => {
  const calls = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init });

    if (calls.length === 1) {
      assert.equal(url, "/api/admin/episodes");
      return new Response(null, { status: 401 });
    }

    if (calls.length === 2) {
      assert.equal(url, "/api/auth/refresh");
      return new Response(null, { status: 200 });
    }

    if (calls.length === 3) {
      assert.equal(url, "/api/admin/episodes");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    throw new Error("Unexpected call count: " + calls.length);
  };

  try {
    const response = await fetchProtectedAdminRoute("/api/admin/episodes", {
      method: "GET"
    });

    assert.equal(response.status, 200);
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchProtectedAdminRoute does not refresh for non-admin paths", async () => {
  const calls = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url });

    return new Response(null, { status: 401 });
  };

  try {
    const response = await fetchProtectedAdminRoute("/api/auth/login", {
      method: "POST"
    });

    assert.equal(response.status, 401);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/auth/login");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchProtectedAdminRoute stops after failed refresh", async () => {
  const calls = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url });

    if (calls.length === 1) {
      assert.equal(url, "/api/admin/episodes");
      return new Response(null, { status: 401 });
    }

    if (calls.length === 2) {
      assert.equal(url, "/api/auth/refresh");
      return new Response(null, { status: 401 });
    }

    throw new Error("Unexpected call count: " + calls.length);
  };

  try {
    const response = await fetchProtectedAdminRoute("/api/admin/episodes", {
      method: "GET"
    });

    assert.equal(response.status, 401);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
