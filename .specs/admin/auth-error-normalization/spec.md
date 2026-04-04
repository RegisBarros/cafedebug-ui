# Auth Handler Error Normalization

| Field | Value |
|---|---|
| **Status** | Implemented |
| **Domain** | `admin/auth` |
| **Spec path** | `.specs/admin/auth-error-normalization/` |
| **Related spec** | `.specs/admin/login-refactor/` (UI only — separate concern) |
| **Affected app** | `apps/admin` |

---

## 1. Problem Statement

Three distinct problems exist in the current auth API handler layer. Each is independently
addressable but shares the same root cause: no shared contract for auth error shapes.

---

### Problem 1 — SRP Violation in `login.handler.ts`

`createErrorResponse` is a private function local to `login.handler.ts`. It does three
distinct things in a single call:

1. **Builds a `NextResponse` JSON envelope** — assembles `{ ok: false, error: { ... } }`
   and calls `NextResponse.json(payload, { status })`.
2. **Orchestrates cookies** — calls `appendSetCookieHeaders(response, setCookieHeaders)`
   and `clearKnownAuthCookies(response)` depending on caller-supplied flags.
3. **Emits an observability event** — calls `logger[logLevel](event, { ... })`.

Its signature mixes business-level error data with handler-specific side-effect parameters:

```ts
createErrorResponse({
  // error envelope fields
  detail, status, title, traceId?, fieldErrors?,
  // handler-specific side effects
  event, logLevel?, setCookieHeaders?, clearAuthCookies?
})
```

This function is impossible to unit-test in isolation because it is not exported.
Duplicating this pattern in `refresh/route.ts` was skipped entirely — the route
reinlines all three concerns inline at every error branch instead.

**Target state:** Extract `createErrorResponse` to a dedicated module at
`apps/admin/src/features/auth/errors/createErrorResponse.ts` with a clean, exportable
signature. Handler-specific side-effect params (`event`, `logLevel`, `setCookieHeaders`,
`clearAuthCookies`) are retained in the payload type because they are required by the
call sites, but the function itself becomes independently importable and testable.

---

### Problem 2 — Inconsistent Error Shapes Across Auth Routes

The three auth routes return structurally different responses:

| Route | Success key | Error key | `status` in body? | `fieldErrors` possible? |
|---|---|---|---|---|
| `POST /api/auth/login` | `ok: true` | `ok: false` | ✅ Yes | ✅ Yes |
| `POST /api/auth/refresh` | `success: true` | `success: false` | ❌ **No** | ❌ No |
| `POST /api/auth/logout` | `success: true` | — (never errors) | — | — |

Concrete divergences in `refresh/route.ts` versus `login.handler.ts`:

- Uses `success` instead of `ok` as the discriminant key.
- Omits `status` from the error body (present only in the HTTP response status line).
- Constructs inline `NextResponse.json(...)` at every error branch — 4 separate call sites.
- Has no shared type constraining the error shape.

There is no shared TypeScript type or runtime schema enforcing a common contract. A client
parsing `/api/auth/refresh` errors cannot use the same parsing logic as `/api/auth/login`
errors.

**Target state:** All auth API routes that return error responses MUST use `ok: false` as
the discriminant and MUST include `status` inside the error body.

---

### Problem 3 — Handler File Accumulates Too Many Responsibilities

`loginHandler` in `login.handler.ts` currently performs all of the following in sequence
within a single exported function and one private helper:

1. Body parsing (`readLoginBody`)
2. Zod schema validation (`loginSchema.safeParse`, `readValidationFieldErrors`)
3. Runtime env config guard
4. API client instantiation (`createAdminApiClient`)
5. External token API call (`adminApiClient.auth.token`)
6. Response normalization (`adminApiClient.normalizeResponse`)
7. `Set-Cookie` header extraction (`extractSetCookieHeaders`)
8. Cookie orchestration (`appendSetCookieHeaders`, `clearKnownAuthCookies`, `setSessionCookie`)
9. Observability — Sentry breadcrumbs (`addSentryBreadcrumb`)
10. Observability — structured logging (`logger.warn`, `logger.info`, `logger.error`)
11. Sentry exception capture (`captureException`)
12. Success response building
13. Error response building

This spec addresses only items 12 and 13 (error response building). The remaining
responsibilities are out of scope for this iteration.

---

## 2. Scope

### In Scope

| Item | Location |
|---|---|
| Extract `createErrorResponse` to a shared module | `features/auth/errors/createErrorResponse.ts` |
| Define `AuthErrorPayload` type | `features/auth/types/auth.types.ts` |
| Update `loginHandler` to import from the new module | `features/auth/server/login.handler.ts` |
| Normalize `refresh/route.ts` error shape: `success` → `ok` | `app/api/auth/refresh/route.ts` |
| Add `status` to `refresh/route.ts` error body | `app/api/auth/refresh/route.ts` |
| Replace inline `NextResponse.json(...)` in `refresh/route.ts` with `createErrorResponse` | `app/api/auth/refresh/route.ts` |

### Out of Scope

| Item | Reason |
|---|---|
| Refactoring `logout/route.ts` | No error responses — not applicable |
| Changing `app/api/auth/session` route | Not part of this refactor |
| Modifying cookie utility functions (`next-response-cookies.ts`) | Utilities are correct |
| Changing `loginService` response parsing | Must not break existing client contract |
| Implementing `type` URI field on error envelope | Field is defined as optional; no value is assigned in this iteration |
| Decomposing `loginHandler`'s other 11 responsibilities | Separate future refactor |

---

## 3. Functional Requirements

### FR-1 — Standardized auth error envelope shape

Every auth API route that returns an HTTP error response MUST produce a JSON body
conforming to this exact structure:

```json
{
  "ok": false,
  "error": {
    "status": 401,
    "title": "Session expired",
    "detail": "Your session has expired. Please sign in again.",
    "traceId": "abc-123",
    "fieldErrors": { "email": ["Email is required."] },
    "type": "https://errors.cafedebug.com/auth/session-expired"
  }
}
```

Fields `traceId`, `fieldErrors`, and `type` are optional and MUST be omitted (not
`null`, not `undefined`) when absent. The fields `status`, `title`, `detail`, and the
top-level `ok: false` key are REQUIRED on every error response.

**Acceptance criterion:** A TypeScript compiler error MUST occur if any auth route
constructs an error response body missing `status`, `title`, or `detail`, or uses a
discriminant other than `ok`.

---

### FR-2 — `AuthErrorPayload` type in `auth.types.ts`

A new exported type named `AuthErrorPayload` MUST be added to
`apps/admin/src/features/auth/types/auth.types.ts`.

```ts
import type { ApiFieldErrors } from "@cafedebug/api-client";

export type AuthErrorEnvelope = {
  status: number;
  title: string;
  detail: string;
  type?: string;
  traceId?: string;
  fieldErrors?: ApiFieldErrors;
};

export type AuthErrorPayload = AuthErrorEnvelope & {
  // Next.js-specific side effects applied to the response
  setCookieHeaders?: string[];
  clearAuthCookies?: boolean;
  // Observability params
  event: string;
  logLevel?: "warn" | "error";
};
```

The existing `LoginErrorPayload` type MUST remain exported and unchanged to avoid
breaking `login.service.ts`. It MAY be re-expressed as an alias:

```ts
// Backward-compatible alias — do not remove
export type LoginErrorPayload = AuthErrorEnvelope;
```

**Acceptance criterion:** `LoginErrorPayload` remains importable from `auth.types.ts`.
`AuthErrorPayload` is exported and used by `createErrorResponse`.

---

### FR-3 — `createErrorResponse` extracted to `features/auth/errors/`

A new file MUST be created at:

```
apps/admin/src/features/auth/errors/createErrorResponse.ts
```

The exported function signature MUST be:

```ts
import { NextResponse } from "next/server";
import type { AuthErrorPayload } from "../types/auth.types";

export const createErrorResponse = (payload: AuthErrorPayload): NextResponse
```

The function MUST:

1. Call `NextResponse.json({ ok: false, error: { status, title, detail, ...optionals } }, { status })`.
2. Call `appendSetCookieHeaders(response, setCookieHeaders)` when `setCookieHeaders` is non-empty.
3. Call `clearKnownAuthCookies(response)` when `clearAuthCookies` is `true`.
4. Call `logger[logLevel](event, { module: "auth", status, title, ...optionals })`.
5. Return the `NextResponse`.

The function MUST NOT call `captureException` or `addSentryBreadcrumb` — those remain
in the calling handler where request context is available.

The function MUST NOT import from `app/` or from any route file.

**Acceptance criterion:** The file exists, is importable, exports `createErrorResponse`
with the above signature, and passes TypeScript compilation with no errors.

---

### FR-4 — `login.handler.ts` removes its local `createErrorResponse`

The private `createErrorResponse` function declared at the top of `login.handler.ts`
MUST be deleted. All call sites within `loginHandler` MUST be updated to import and use
the extracted function from `features/auth/errors/createErrorResponse.ts`.

No behavioral change is permitted. The response body shape, HTTP status codes, log
events, cookie operations, and observability calls MUST produce identical output before
and after this change.

**Acceptance criterion:** `login.handler.ts` contains no local function named
`createErrorResponse`. TypeScript compiles without errors. All existing call sites pass
the same arguments via `AuthErrorPayload`.

---

### FR-5 — `refresh/route.ts` adopts `ok` as discriminant

Every JSON error response in `apps/admin/src/app/api/auth/refresh/route.ts` MUST
replace `success: false` with `ok: false`.

The four affected error sites are:

| Trigger | Current shape | Required shape |
|---|---|---|
| Missing `apiBaseUrl` | `{ success: false, error: { title, detail } }` | `{ ok: false, error: { status: 503, title, detail } }` |
| Missing refresh token cookie | `{ success: false, error: { title, detail } }` | `{ ok: false, error: { status: 401, title, detail } }` |
| API error response (`"error" in normalizedRefreshResponse`) | `{ success: false, error: { title, detail, traceId? } }` | `{ ok: false, error: { status, title, detail, traceId? } }` |
| `isSuccess === false` branch | `{ success: false, error: { title, detail, traceId? } }` | `{ ok: false, error: { status: 401, title, detail, traceId? } }` |
| `catch` block | `{ success: false, error: { title, detail } }` | `{ ok: false, error: { status: 503, title, detail } }` |

The success response `{ success: true }` is NOT changed — it is out of scope and has no
client consumer that requires normalization in this iteration.

**Acceptance criterion:** No occurrence of `success: false` remains in `refresh/route.ts`.
Every error branch produces a body with `ok: false` and includes `status` inside the
`error` object.

---

### FR-6 — `refresh/route.ts` uses `createErrorResponse`

All inline `NextResponse.json(...)` error constructions in `refresh/route.ts` MUST be
replaced with calls to `createErrorResponse` from
`features/auth/errors/createErrorResponse.ts`.

This is required to enforce the contract at the type level and avoid future divergence.

**Acceptance criterion:** `refresh/route.ts` imports `createErrorResponse` from
`@/features/auth/errors/createErrorResponse`. No inline `NextResponse.json(...)` call
for error paths remains in the file.

---

### FR-7 — `status` field is present in all refresh error bodies

Following FR-5 and FR-6, the `status` field inside the `error` envelope object MUST be
present in every error response from `/api/auth/refresh`. The value MUST equal the HTTP
response status code.

Mapping:

| Error condition | `status` in body | HTTP status |
|---|---|---|
| Missing `apiBaseUrl` | `503` | `503` |
| Missing refresh token | `401` | `401` |
| API error (normalized) | `normalizedRefreshResponse.error.status` | `normalizedRefreshResponse.error.status` |
| `isSuccess === false` | `401` | `401` |
| Catch block | `503` | `503` |

**Acceptance criterion:** Each of the five error branches in `refresh/route.ts` produces
a body where `error.status === response.status`.

---

## 4. Non-Functional Requirements

### NFR-1 — No breaking change to `loginService`

`apps/admin/src/features/auth/services/login.service.ts` parses `/api/auth/login`
responses using `loginErrorResponseSchema` (Zod) and `loginSuccessResponseSchema`.

Both schemas parse _optionally_ (`z.optional()` on all error fields, `response.ok` to
branch between error and success). The refactoring MUST NOT remove or rename any field
from the login response body that this service currently reads:

| Field read by `loginService` | Must remain present |
|---|---|
| `error.detail` | ✅ |
| `error.status` | ✅ |
| `error.title` | ✅ |
| `error.traceId` | ✅ (optional) |
| `error.fieldErrors` | ✅ (optional) |
| `ok` (used as discriminant via `response.ok`) | ✅ |
| `redirectTo` | ✅ (success only) |

**Acceptance criterion:** `loginService` is not modified. Running the service against a
mock of the new `loginHandler` output produces identical `LoginServiceResult` values.

### NFR-2 — No new runtime dependencies

`createErrorResponse` MUST use only modules already imported in `login.handler.ts`:
`next/server`, `@/lib/auth/next-response-cookies`, and `@/lib/observability`. No new
npm packages are permitted.

### NFR-3 — TypeScript strict mode compliance

All new and modified files MUST compile under the existing `tsconfig.json` settings with
no `@ts-ignore` or `@ts-expect-error` suppressions.

### NFR-4 — No behavioral regression on the login flow

The observable behavior of `POST /api/auth/login` — HTTP status codes, JSON body shapes,
Set-Cookie headers, log output — MUST be identical before and after this refactoring.
This is a pure internal restructuring.

---

## 5. Error Contract — TypeScript Definitions

### Canonical types (target state in `auth.types.ts`)

```ts
import type { ApiFieldErrors } from "@cafedebug/api-client";

// The JSON shape of the `error` object inside every auth error response body.
export type AuthErrorEnvelope = {
  /** Mirrors the HTTP response status code. REQUIRED. */
  status: number;
  /** Short human-readable title safe for UI display. REQUIRED. */
  title: string;
  /** Longer human-readable description safe for UI display. REQUIRED. */
  detail: string;
  /**
   * Optional URI identifying the error type/category.
   * Not populated in this iteration — field is defined for future use.
   */
  type?: string;
  /** Backend trace ID for correlation with server-side logs. */
  traceId?: string;
  /** Field-level validation errors keyed by field name (login only). */
  fieldErrors?: ApiFieldErrors;
};

// The full payload accepted by createErrorResponse.
export type AuthErrorPayload = AuthErrorEnvelope & {
  /** Observability event name to pass to logger. REQUIRED. */
  event: string;
  /** Logger level. Defaults to "warn". */
  logLevel?: "warn" | "error";
  /** Raw Set-Cookie header strings forwarded from the upstream API response. */
  setCookieHeaders?: string[];
  /** When true, clears all known auth cookies on the response. */
  clearAuthCookies?: boolean;
};

// Backward-compatible alias. Do NOT remove — used by loginService parsing types.
export type LoginErrorPayload = AuthErrorEnvelope;
```

### Wire format

```ts
// Error response body (all auth routes)
type AuthErrorResponseBody = {
  ok: false;
  error: AuthErrorEnvelope;
};

// Login success response body (unchanged)
type LoginSuccessResponseBody = {
  ok: true;
  redirectTo: string;
};

// Refresh success response body (unchanged)
type RefreshSuccessResponseBody = {
  success: true;
};
```

---

## 6. Files Affected

| File | Change type | Description |
|---|---|---|
| `apps/admin/src/features/auth/types/auth.types.ts` | **Modify** | Add `AuthErrorEnvelope`, `AuthErrorPayload`. Keep `LoginErrorPayload` as alias. |
| `apps/admin/src/features/auth/errors/createErrorResponse.ts` | **Create** | New module; extracted and exported `createErrorResponse` function. |
| `apps/admin/src/features/auth/server/login.handler.ts` | **Modify** | Remove local `createErrorResponse`. Import from `errors/createErrorResponse`. |
| `apps/admin/src/app/api/auth/refresh/route.ts` | **Modify** | Replace `success: false` with `ok: false`. Add `status` to error envelope. Use `createErrorResponse`. |

### Files explicitly NOT modified

| File | Reason |
|---|---|
| `apps/admin/src/features/auth/services/login.service.ts` | Client-side; no breaking changes permitted |
| `apps/admin/src/features/auth/schemas/login.schema.ts` | Schemas remain valid for the unchanged response shape |
| `apps/admin/src/app/api/auth/login/route.ts` | Thin delegation only; no changes needed |
| `apps/admin/src/app/api/auth/logout/route.ts` | No error responses; out of scope |
| `apps/admin/src/lib/auth/next-response-cookies.ts` | Cookie utilities are correct; no changes |

---

## 7. API Contract Compatibility

### `POST /api/auth/login` — no change to external contract

The login route response shape is unchanged:

```json
// Success
{ "ok": true, "redirectTo": "/dashboard" }

// Error
{ "ok": false, "error": { "status": 401, "title": "...", "detail": "..." } }
```

`loginService` uses `response.ok` (the HTTP `Response.ok` property) to branch, then
parses `error.*` fields via `loginErrorResponseSchema`. All parsed fields remain present.
**No change to `loginService` is needed or permitted.**

### `POST /api/auth/refresh` — controlled breaking change (internal only)

The refresh route is consumed only by the Next.js middleware at
`apps/admin/src/middleware.ts` (or equivalent internal client). It is NOT consumed by
any browser-side `loginService`-style fetch wrapper.

Before implementing FR-5 and FR-6, confirm the refresh consumer (middleware or refresh
service) parses the response. If the consumer checks `response.success`, it MUST be
updated to check `response.ok` as part of the same pull request. This is a prerequisite,
not a separate task.

**Acceptance criterion:** A search for `success` key access on the parsed refresh
response body returns zero matches after this refactoring.

---

## 8. Out-of-Scope Clarifications

The following are explicitly deferred and MUST NOT be implemented as part of this spec:

- **`type` URI population** — The `type` field is defined in `AuthErrorEnvelope` as
  `type?: string` but no value is assigned. Do not invent URIs.
- **`refresh/route.ts` success shape normalization** — `{ success: true }` stays as-is.
- **`loginHandler` decomposition** — The remaining 11 responsibilities listed in Problem 3
  are a separate future refactor.
- **Shared Zod schemas for error responses** — `loginErrorResponseSchema` is sufficient
  for the login client. No cross-route shared schema is required here.
- **Refresh client-side service** — If no refresh service exists, none is created.

---

## 9. Success Criteria

This feature is complete when all of the following are true:

- [ ] `apps/admin/src/features/auth/errors/createErrorResponse.ts` exists and exports `createErrorResponse`.
- [ ] `AuthErrorEnvelope` and `AuthErrorPayload` are exported from `auth.types.ts`.
- [ ] `LoginErrorPayload` remains exported from `auth.types.ts` without modification to its shape.
- [ ] `login.handler.ts` contains no local `createErrorResponse` declaration.
- [ ] `login.handler.ts` imports `createErrorResponse` from `@/features/auth/errors/createErrorResponse`.
- [ ] `refresh/route.ts` contains zero occurrences of `success: false`.
- [ ] Every error branch in `refresh/route.ts` includes `status` inside the `error` envelope.
- [ ] `refresh/route.ts` imports and uses `createErrorResponse` at all error branches.
- [ ] `loginService` is unmodified.
- [ ] TypeScript compiles with no errors across all affected files.
- [ ] Manual smoke test: `POST /api/auth/login` with invalid credentials returns `{ ok: false, error: { status: 401, ... } }`.
- [ ] Manual smoke test: `POST /api/auth/refresh` with no cookie returns `{ ok: false, error: { status: 401, title: "Session expired", ... } }`.

---

## Debugger Review

**Reviewer:** The Debugger  
**Status:** ⚠️ Requires revision

### Issues Found

| # | Severity | Area | Issue | Recommendation |
|---|---|---|---|---|
| 1 | 🔴 High | FR-3 / NFR-4 | **Silent logLevel regression in `refresh/route.ts` catch block.** `createErrorResponse` defaults `logLevel` to `"warn"`. The current catch block in `refresh/route.ts` logs at `logger.error(...)`. If FR-6's migration doesn't explicitly pass `logLevel: "error"` for the catch branch, the log level silently downgrades with no compile-time signal. This is a behavioral regression on observability that is invisible to any type checker or smoke test. | Add an explicit requirement to FR-6 (or FR-7): every catch-block call to `createErrorResponse` in `refresh/route.ts` MUST pass `logLevel: "error"`. Mirror the pattern already present in `loginHandler`'s catch block. |
| 2 | 🟡 Medium | FR-5 | **Spec text says "four affected error sites" but the table lists five.** The paragraph opening FR-5 reads: "The four affected error sites are:" The table immediately below has five rows (missing apiBaseUrl, missing token, API error, isSuccess === false, catch). The actual `refresh/route.ts` code also has five error branches. | Change the opening sentence to "The five affected error sites are:" |
| 3 | 🟡 Medium | FR-6 | **`event` field mapping for `refresh/route.ts` is unspecified.** `AuthErrorPayload.event` is a required string. FR-6 says to migrate all inline errors to `createErrorResponse`, but provides no mapping of which `observabilityEvents.*` constant to pass at each of the five call sites. The implementer must infer these, risking wrong events (e.g. accidentally using `authLoginFailed` instead of `authRefreshFailed`) or mixing `authRefreshFailed` and `authRefreshMissingToken` incorrectly. | Add an event-mapping column to the FR-5 table (or a separate FR-6 sub-table) explicitly listing the correct `observabilityEvents.*` value for each refresh error branch. |
| 4 | 🟡 Medium | Section 7 | **Refresh consumer prerequisite is left open when the answer is already deterministic.** Section 7 says: "Before implementing FR-5 and FR-6, confirm the refresh consumer parses the response… this is a prerequisite, not a separate task." The actual middleware (`middleware.ts`) calls `validateSessionWithSingleRefresh` from `session-strategy.js`, which checks only `refreshResponse.ok` (the HTTP `Response.ok` property) and `Set-Cookie` headers. It never reads the JSON body. The prerequisite is already satisfied — but the spec leaves it as an open question, creating ambiguity about whether this blocks the implementation. | Document the finding inline: the session strategy does not read the refresh response body; no consumer check of `response.success` exists. Remove the blocking-prerequisite framing. Update the acceptance criterion in Section 9 to a confirmatory search: "A grep for `.success` on the parsed refresh response JSON across `apps/admin/src/` returns zero matches." |
| 5 | 🟡 Medium | Section 3 (NFR-1) vs Section 5 | **Internal contradiction: `LoginErrorPayload` is described as "unchanged" but the alias changes its shape.** NFR-1 states "`LoginErrorPayload` remains exported and unchanged." Section 5 proposes `export type LoginErrorPayload = AuthErrorEnvelope`, which adds an optional `type?: string` field that does not exist on the current `LoginErrorPayload`. While TypeScript-additive and backward-compatible, it contradicts the "unchanged" language. The `loginErrorResponseSchema` in `login.schema.ts` does not parse `type`, so the wire format and service parsing remain safe — but code that constructs `LoginErrorPayload` objects (e.g. in `login.service.ts` failure result) will now accept the new field silently. | Either: (a) remove "unchanged" and replace with "backward-compatible alias — adding only the optional `type` field"; or (b) keep `LoginErrorPayload` as a standalone type and do not alias it, preserving true structural equality. Option (b) is more precise for a spec that claims no breaking change. |
| 6 | 🟢 Low | FR-3 | **`setCookieHeaders` guard condition is ambiguous between `undefined` and `[]`.** FR-3 step 2 says "Call `appendSetCookieHeaders(response, setCookieHeaders)` when `setCookieHeaders` is non-empty." The type is `setCookieHeaders?: string[]`. The guard must protect against both `undefined` and an empty array `[]`. A naïve implementation checking only truthiness (`if (setCookieHeaders)`) would pass an empty array through; checking only `length` would throw on `undefined`. | Rewrite the condition explicitly: "Call `appendSetCookieHeaders(response, setCookieHeaders)` when `setCookieHeaders` is defined and `setCookieHeaders.length > 0`." |
| 7 | 🟢 Low | FR-3 | **Cookie application order must be documented as a behavioral contract.** `appendSetCookieHeaders` (forwarding upstream cookies) always runs before `clearKnownAuthCookies` (writing clear headers). When both are called and a cookie name overlaps, the clear header overwrites the upstream value — which is the correct security behavior on error paths. This ordering is implicitly correct in FR-3's numbered steps but is never stated as a contract. A future maintainer reordering the two calls would silently break session cleanup on error. | Add a note to FR-3: "`clearKnownAuthCookies` MUST always be called after `appendSetCookieHeaders`. When a cookie name appears in both, the clear instruction must take precedence." |

### Edge Cases Not Covered

**`refresh/route.ts` — `isSuccess === false` branch `traceId` extraction:**  
The current code calls `getTraceIdFromHeaders(normalizedRefreshResponse.response.headers)` but does NOT check `normalizedRefreshResponse.data.error?.traceId` first (unlike the `"error" in normalizedRefreshResponse` branch, which checks `normalizedRefreshResponse.error.traceId` first). After migration to `createErrorResponse`, this inconsistency is preserved silently. The spec does not address this asymmetry. Not a regression, but a pre-existing gap the refactor could optionally normalize.

**`refresh/route.ts` — missing `apiBaseUrl` branch never clears cookies:**  
The current config-error path returns early without calling `clearKnownAuthCookies`. After migration to `createErrorResponse`, passing `clearAuthCookies: false` (or omitting it) preserves this behavior. The spec's FR-5 table does not flag this branch as a non-clearing case, which could mislead an implementer into adding cookie clearing that does not currently exist. The spec should explicitly state `clearAuthCookies: false` (omit the field) for the missing `apiBaseUrl` branch.

### Client Contract Safety

`loginService` is safe. It parses error responses via `loginErrorResponseSchema` (Zod), which uses `.optional()` on all fields including `status`, `title`, `detail`, `traceId`, and `fieldErrors`. The schema does not parse a `type` field, so the new optional `type` field on `AuthErrorEnvelope` is silently ignored during parsing. All fields currently read by the service (`error.detail`, `error.status`, `error.title`, `error.traceId`, `error.fieldErrors`) remain present in the new response shape. The `loginService` does not need modification and will not silently misbehave after this refactoring.

The `loginErrorResponseSchema` does **not** validate the `ok: false` discriminant on the error body — it branches on `response.ok` (the HTTP `Response.ok` boolean), not on the JSON field. The refactoring preserves `ok: false` in the body, so there is no risk even if the schema were updated in the future.

**Refresh consumer is safe:** `session-strategy.js` reads only `refreshResponse.ok` (the HTTP status) and `Set-Cookie` headers from the refresh response. It never reads the JSON body. The change from `success: false` → `ok: false` in the body has zero impact on the middleware. The blocking prerequisite in Section 7 is already resolved.

### Approval

⚠️ **Revision required before implementation begins.**

**Blocking (must fix):**
- Issue 1: Add explicit `logLevel: "error"` requirement for the refresh catch block. This is the only issue that causes a silent behavioral regression with no detection mechanism.
- Issue 3: Add the `event` string mapping table for refresh error branches to eliminate implementation ambiguity.

**Non-blocking but should fix:**
- Issue 2: Correct the "four" → "five" error site count in FR-5.
- Issue 4: Resolve the open prerequisite with the confirmed finding that `session-strategy.js` never reads the refresh JSON body.
- Issue 5: Resolve the "unchanged" vs alias contradiction in NFR-1 language.
- Issue 6: Clarify the `setCookieHeaders` guard condition.
- Issue 7: Document cookie application order as a named behavioral contract.

Architecture compliance: ✅ The spec correctly places `createErrorResponse` in `features/auth/errors/`, keeps `app/` routes thin, and prohibits imports from `app/` inside the new module. Layer boundaries are respected.
