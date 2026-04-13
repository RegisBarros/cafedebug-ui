# Auth Handler Error Normalization — Design

| Field | Value |
|---|---|
| **Status** | Draft |
| **Domain** | `admin/auth` |
| **Spec** | `.specs/admin/auth-error-normalization/spec.md` |
| **Author** | Master Planner |
| **Affected app** | `apps/admin` |

---

## 1. Module Structure After Refactor

```
apps/admin/src/features/auth/
├── auth-flow-rules.js                          (unchanged)
├── index.ts                                    (unchanged)
├── login-status-message.ts                     (unchanged)
│
├── components/
│   └── login-form.tsx                          (unchanged)
│
├── errors/                                     ← NEW DIRECTORY
│   └── createErrorResponse.ts                  ← NEW FILE
│
├── hooks/
│   └── use-login.ts                            (unchanged)
│
├── schemas/
│   └── login.schema.ts                         (unchanged)
│
├── server/
│   └── login.handler.ts                        ← MODIFIED: remove local createErrorResponse,
│                                                  import from errors/
│
├── services/
│   └── login.service.ts                        (unchanged — must not be modified)
│
└── types/
    └── auth.types.ts                           ← MODIFIED: add AuthErrorEnvelope,
                                                   AuthErrorPayload; alias LoginErrorPayload
```

**Route file also modified:**

```
apps/admin/src/app/api/auth/refresh/
└── route.ts                                    ← MODIFIED: success → ok, add status in body,
                                                   use createErrorResponse from features/auth/errors/
```

---

## 2. New Module: `features/auth/errors/createErrorResponse.ts`

### Design Decision: Option B (Side-Effect–Retaining Builder)

Two approaches were evaluated:

| | Option A — Pure Builder | Option B — Side-Effect Builder |
|---|---|---|
| `createErrorResponse` builds JSON response only | ✅ | ❌ |
| Cookies/logging called separately in the handler | ✅ | ❌ |
| Matches FR-3 spec contract exactly | ❌ | ✅ |
| Handler call sites are shorter | ❌ | ✅ |
| Testable in isolation (pure) | ✅ | ⚠ (mockable dependencies) |

**Resolution:** The spec's FR-3 explicitly requires `createErrorResponse` to call
`appendSetCookieHeaders`, `clearKnownAuthCookies`, and `logger[logLevel]` internally.
Option B is mandated by the spec and is implemented here.

Testability under Option B is achieved by:
- The function is extracted to its own named module (no longer a private closure).
- Its dependencies (`appendSetCookieHeaders`, `clearKnownAuthCookies`, `logger`) are
  module-level imports that can be mocked in tests using Jest's module mock system.

Option A (pure builder) is noted as a future refactor once handler decomposition
is in scope (out of scope per spec section 8).

---

### TypeScript Interface

```ts
// features/auth/errors/createErrorResponse.ts

import { NextResponse } from "next/server";

import {
  appendSetCookieHeaders,
  clearKnownAuthCookies
} from "@/lib/auth/next-response-cookies";
import { logger } from "@/lib/observability";

import type { AuthErrorPayload } from "../types/auth.types";

/**
 * Builds a normalized `NextResponse` for any auth API error path.
 *
 * Responsibilities:
 *  1. Constructs `{ ok: false, error: { status, title, detail, ...optionals } }` body.
 *  2. Appends forwarded `Set-Cookie` headers from upstream API when present.
 *  3. Clears all known auth cookies when `clearAuthCookies` is `true`.
 *  4. Emits a structured log event at the requested level.
 *  5. Returns the composed `NextResponse`.
 *
 * Does NOT:
 *  - Call `captureException` (Sentry) — exception capture belongs in the calling handler
 *    where request/endpoint context is available.
 *  - Call `addSentryBreadcrumb` — same reason.
 *  - Import from `app/` or any route file.
 *  - Perform any network I/O.
 *
 * @param payload - Normalized error envelope plus handler-level side-effect params.
 * @returns A `NextResponse` with status, body, cookies, and log side effect applied.
 */
export const createErrorResponse = (payload: AuthErrorPayload): NextResponse => {
  const {
    status,
    title,
    detail,
    type,
    traceId,
    fieldErrors,
    event,
    logLevel = "warn",
    setCookieHeaders = [],
    clearAuthCookies = false
  } = payload;

  const response = NextResponse.json(
    {
      ok: false,
      error: {
        status,
        title,
        detail,
        ...(type ? { type } : {}),
        ...(traceId ? { traceId } : {}),
        ...(fieldErrors ? { fieldErrors } : {})
      }
    },
    { status }
  );

  if (setCookieHeaders.length > 0) {
    appendSetCookieHeaders(response, setCookieHeaders);
  }

  if (clearAuthCookies) {
    clearKnownAuthCookies(response);
  }

  logger[logLevel](event, {
    module: "auth",
    status,
    title,
    ...(traceId ? { traceId } : {}),
    hasFieldErrors: Boolean(fieldErrors)
  });

  return response;
};
```

### Import Provenance

| Import | Source |
|---|---|
| `NextResponse` | `next/server` |
| `appendSetCookieHeaders` | `@/lib/auth/next-response-cookies` |
| `clearKnownAuthCookies` | `@/lib/auth/next-response-cookies` |
| `logger` | `@/lib/observability` |
| `AuthErrorPayload` | `../types/auth.types` (sibling within `features/auth/`) |

No new npm packages are introduced. All dependencies are already present in
`login.handler.ts`.

---

## 3. Updated `AuthErrorPayload` Type in `auth.types.ts`

The full target state of
`apps/admin/src/features/auth/types/auth.types.ts`:

```ts
import type { ApiFieldErrors } from "@cafedebug/api-client";

// ---------------------------------------------------------------------------
// Wire format — the `error` object inside every auth API error response body.
// All three required fields (status, title, detail) map 1:1 to the HTTP response.
// ---------------------------------------------------------------------------

/**
 * The JSON shape of the `error` object inside every auth error response body.
 * This type is the canonical source of truth for the wire format.
 *
 * Required fields: status, title, detail.
 * Optional fields: type, traceId, fieldErrors.
 * Optional fields MUST be omitted (not null) when absent.
 */
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

// ---------------------------------------------------------------------------
// createErrorResponse input type — envelope + handler-level side-effect params.
// ---------------------------------------------------------------------------

/**
 * Full payload accepted by `createErrorResponse`.
 * Extends AuthErrorEnvelope with handler-specific cookie and observability params.
 */
export type AuthErrorPayload = AuthErrorEnvelope & {
  /** Observability event name to pass to logger. REQUIRED. */
  event: string;
  /** Logger level. Defaults to "warn". */
  logLevel?: "warn" | "error";
  /**
   * Raw Set-Cookie header strings forwarded from the upstream API response.
   * Applied to the NextResponse via appendSetCookieHeaders.
   */
  setCookieHeaders?: string[];
  /**
   * When true, clears all known auth cookies on the response via
   * clearKnownAuthCookies. Used after upstream API auth failure.
   */
  clearAuthCookies?: boolean;
};

// ---------------------------------------------------------------------------
// Backward-compatible alias — do NOT remove.
// Consumed by:
//   - login.service.ts (LoginServiceFailureResult.error)
//   - login.schema.ts  (loginErrorResponseSchema parses these fields)
// ---------------------------------------------------------------------------

/**
 * Backward-compatible alias for AuthErrorEnvelope.
 * Kept to avoid breaking loginService and any external consumers.
 * Do NOT rename or remove this export.
 */
export type LoginErrorPayload = AuthErrorEnvelope;

// ---------------------------------------------------------------------------
// Remaining types — UNCHANGED
// ---------------------------------------------------------------------------

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginFieldName = "email" | "password";

export type LoginFieldState = Partial<Record<LoginFieldName, string>>;

export type LoginServiceSuccessResult = {
  ok: true;
  redirectTo: string;
};

export type LoginServiceFailureResult = {
  ok: false;
  error: LoginErrorPayload & {
    kind: "response" | "transport";
    cause?: unknown;
  };
};

export type LoginServiceResult =
  | LoginServiceSuccessResult
  | LoginServiceFailureResult;

export type LoginErrorResponsePayload = {
  error?: {
    detail?: string;
    status?: number;
    title?: string;
    traceId?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export type LoginSuccessResponsePayload = {
  ok?: boolean;
  redirectTo?: string;
};
```

### Type Relationship Diagram

```
AuthErrorEnvelope
│  status, title, detail (required)
│  type?, traceId?, fieldErrors? (optional)
│
├─ extended by → AuthErrorPayload
│                  + event (required)
│                  + logLevel?, setCookieHeaders?, clearAuthCookies? (optional)
│                  → consumed by createErrorResponse(payload: AuthErrorPayload)
│
└─ aliased as  → LoginErrorPayload   (backward compat — do not remove)
                 → consumed by LoginServiceFailureResult
                 → parsed by loginErrorResponseSchema
```

---

## 4. Refactored `login.handler.ts` Structure

### What Changes

- **Delete** the private `createErrorResponse` closure (lines 22–58 of current file).
- **Add** import: `import { createErrorResponse } from "../errors/createErrorResponse";`
- **All 5 call sites** pass `AuthErrorPayload` arguments. The argument shapes are
  identical to today — only the function's location changes.

### Call Sequence (Pseudocode)

```
loginHandler(request: Request): Promise<NextResponse>
  │
  ├─ readLoginBody(request)
  │   └─ if body missing or not object:
  │       return createErrorResponse({
  │         status: 400, title: "Bad Request", detail: "Invalid request payload.",
  │         event: observabilityEvents.authLoginValidationFailed
  │       })
  │
  ├─ loginSchema.safeParse(requestBody)
  │   └─ if !parsedBody.success:
  │       fieldErrors = readValidationFieldErrors(parsedBody.error.issues)
  │       return createErrorResponse({
  │         status: 400, title: "Validation Failed",
  │         detail: "Please provide email and password.",
  │         fieldErrors?, event: observabilityEvents.authLoginValidationFailed
  │       })
  │
  ├─ guard adminRuntimeEnv.apiBaseUrl
  │   └─ if missing:
  │       return createErrorResponse({
  │         status: 500, title: "Configuration Error",
  │         detail: "Admin API base URL is not configured.",
  │         event: observabilityEvents.authLoginServiceUnavailable,
  │         logLevel: "error"
  │       })
  │
  ├─ createAdminApiClient(...)
  │
  ├─ addSentryBreadcrumb("Admin login attempt", ...)   ← unchanged, stays here
  │
  ├─ try adminApiClient.auth.token(...)
  │   │
  │   ├─ normalizeResponse(tokenResponse)
  │   ├─ extractSetCookieHeaders(normalizedTokenResponse.response)
  │   │
  │   ├─ if "error" in normalizedTokenResponse:
  │   │   │  logger.warn(observabilityEvents.apiRequestFailed, ...)   ← stays here
  │   │   └─ return createErrorResponse({
  │   │         status: normalizedTokenResponse.error.status,
  │   │         title: normalizedTokenResponse.error.title,
  │   │         detail: normalizedTokenResponse.error.detail,
  │   │         traceId?, fieldErrors?,
  │   │         setCookieHeaders, clearAuthCookies: true,
  │   │         event: observabilityEvents.authLoginFailed
  │   │       })
  │   │
  │   ├─ if normalizedTokenResponse.data.isSuccess === false:
  │   │   └─ return createErrorResponse({
  │   │         status: 401, title: "Authentication Failed",
  │   │         detail: fallbackErrorDetail,
  │   │         setCookieHeaders, clearAuthCookies: true,
  │   │         event: observabilityEvents.authLoginFailed
  │   │       })
  │   │
  │   └─ SUCCESS PATH:
  │       logger.info(observabilityEvents.authLoginSuccess, ...)       ← unchanged
  │       addSentryBreadcrumb("Admin login success", ...)              ← unchanged
  │       response = NextResponse.json({ ok: true, redirectTo })
  │       appendSetCookieHeaders(response, setCookieHeaders)
  │       setSessionCookie(response)
  │       return response
  │
  └─ catch (error):
      logger.error(...)                                               ← stays here
      captureException(error, ...)                                    ← stays here
      return createErrorResponse({
        status: 503, title: "Service Unavailable",
        detail: "Unable to reach the authentication service...",
        event: observabilityEvents.authLoginServiceUnavailable,
        logLevel: "error"
      })
```

### What Does NOT Change

- `readLoginBody` helper function — unchanged, stays in file.
- `readValidationFieldErrors` helper function — unchanged, stays in file.
- `addSentryBreadcrumb` call sites — unchanged, caller keeps request context.
- `captureException` call site in `catch` — unchanged, caller has the `error` object.
- `logger.warn(observabilityEvents.apiRequestFailed, ...)` before the API error
  `createErrorResponse` call — unchanged (this log captures endpoint + status context
  not available inside `createErrorResponse`).
- Success response path — unchanged.

---

## 5. Normalized `refresh/route.ts` — Before / After

### Error Branch 1: Missing `apiBaseUrl`

**Before:**
```ts
return NextResponse.json(
  {
    success: false,
    error: {
      title: "Configuration Error",
      detail: "Admin API base URL is not configured."
    }
  },
  { status: 503 }
);
```

**After:**
```ts
return createErrorResponse({
  status: 503,
  title: "Configuration Error",
  detail: "Admin API base URL is not configured.",
  event: observabilityEvents.authRefreshFailed,
  logLevel: "error"
});
```

> Note: The existing `logger.error(...)` call before this branch is **removed** —
> `createErrorResponse` calls `logger[logLevel](event, ...)` internally. The log
> context (module, action, reason, status) is reconstructed via `AuthErrorPayload`
> fields.

---

### Error Branch 2: Missing Refresh Token Cookie

**Before:**
```ts
const response = NextResponse.json(
  {
    success: false,
    error: {
      title: "Session expired",
      detail: "Your session has expired. Please sign in again."
    }
  },
  { status: 401 }
);
clearKnownAuthCookies(response);
return response;
```

**After:**
```ts
return createErrorResponse({
  status: 401,
  title: "Session expired",
  detail: "Your session has expired. Please sign in again.",
  clearAuthCookies: true,
  event: observabilityEvents.authRefreshMissingToken
});
```

> `clearKnownAuthCookies` is now handled internally by `createErrorResponse` via
> `clearAuthCookies: true`.

---

### Error Branch 3: API Error Response (`"error" in normalizedRefreshResponse`)

**Before:**
```ts
const response = NextResponse.json(
  {
    success: false,
    error: {
      title: normalizedRefreshResponse.error.title,
      detail: normalizedRefreshResponse.error.detail,
      ...(traceId ? { traceId } : {})
    }
  },
  { status: normalizedRefreshResponse.error.status }
);
appendSetCookieHeaders(response, setCookieHeaders);
clearKnownAuthCookies(response);
return response;
```

**After:**
```ts
return createErrorResponse({
  status: normalizedRefreshResponse.error.status,
  title: normalizedRefreshResponse.error.title,
  detail: normalizedRefreshResponse.error.detail,
  ...(traceId ? { traceId } : {}),
  setCookieHeaders,
  clearAuthCookies: true,
  event: observabilityEvents.authRefreshFailed
});
```

> The existing `logger.warn(observabilityEvents.authRefreshFailed, ...)` call before
> this branch is **removed** — handled internally by `createErrorResponse`.

---

### Error Branch 4: `isSuccess === false`

**Before:**
```ts
const response = NextResponse.json(
  {
    success: false,
    error: {
      title: "Session expired",
      detail: normalizedRefreshResponse.data.error?.message?.trim() ?? "...",
      ...(traceId ? { traceId } : {})
    }
  },
  { status: 401 }
);
appendSetCookieHeaders(response, setCookieHeaders);
clearKnownAuthCookies(response);
return response;
```

**After:**
```ts
return createErrorResponse({
  status: 401,
  title: "Session expired",
  detail: normalizedRefreshResponse.data.error?.message?.trim()
    ?? "Unable to refresh session. Please sign in again.",
  ...(traceId ? { traceId } : {}),
  setCookieHeaders,
  clearAuthCookies: true,
  event: observabilityEvents.authRefreshFailed
});
```

> The existing `logger.warn(...)` before this branch is **removed** — handled internally.

---

### Error Branch 5: `catch` Block

**Before:**
```ts
return NextResponse.json(
  {
    success: false,
    error: {
      title: "Service Unavailable",
      detail: "Unable to refresh session. Please try again."
    }
  },
  { status: 503 }
);
```

**After:**
```ts
return createErrorResponse({
  status: 503,
  title: "Service Unavailable",
  detail: "Unable to refresh session. Please try again.",
  event: observabilityEvents.authRefreshFailed,
  logLevel: "error"
});
```

> The existing `logger.error(...)` and `captureException(...)` calls before this
> return are **retained in the handler** — they carry endpoint and raw error context
> not available inside `createErrorResponse`.

---

### Success Response — UNCHANGED

```ts
// refresh/route.ts — success path: not modified
const response = NextResponse.json({ success: true }, { status: 200 });
appendSetCookieHeaders(response, setCookieHeaders);
setSessionCookie(response);
return response;
```

`{ success: true }` is NOT changed per spec section 8 (out of scope). The middleware
(`middleware.ts`) checks `refreshResponse.ok` (the HTTP `Response.ok` property) and
does not parse the JSON body at all — confirmed by reading `session-strategy.js` line
248: `if (!refreshResponse.ok)`. No consumer reads `success` from the body.

---

### Import Addition in `refresh/route.ts`

```ts
// Add this import:
import { createErrorResponse } from "@/features/auth/errors/createErrorResponse";
```

Inline `NextResponse.json(...)` calls for the 5 error branches are **all removed**.
The `NextResponse` import MAY be retained for the success branch.

---

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Request (POST /api/auth/login or /api/auth/refresh)            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Handler (loginHandler / refresh POST)                          │
│                                                                 │
│  ┌─ Body parsing / validation / config guard                    │
│  │  ↓                                                          │
│  ├─ External API call (adminApiClient.auth.token / refreshToken)│
│  │  ↓                                                          │
│  ├─ normalizeResponse()                                         │
│  │  ↓                                                          │
│  ├─ extractSetCookieHeaders()  ──────────────────────────┐     │
│  │                                                        │     │
│  │  ┌── ERROR PATH ─────────────────────────────────┐   │     │
│  │  │                                               │   │     │
│  │  │  [optional] logger.warn(apiRequestFailed)     │   │     │
│  │  │  [optional] captureException(error)  ◄──┐    │   │     │
│  │  │                                         │    │   │     │
│  │  │  createErrorResponse({                  │    │   │     │
│  │  │    status, title, detail,               │    │   │     │
│  │  │    traceId?, fieldErrors?,              │    │   │     │
│  │  │    setCookieHeaders ◄───────────────────┼────┘   │     │
│  │  │    clearAuthCookies: true,              │        │     │
│  │  │    event, logLevel                      │        │     │
│  │  │  })                                     │        │     │
│  │  │    │                                    │        │     │
│  │  │    │  features/auth/errors/             │        │     │
│  │  │    │  createErrorResponse.ts            │        │     │
│  │  │    │  ┌──────────────────────────┐      │        │     │
│  │  │    └─►│ NextResponse.json(       │      │        │     │
│  │  │       │   { ok: false, error:{} }│      │        │     │
│  │  │       │ )                        │      │        │     │
│  │  │       │ appendSetCookieHeaders() │      │        │     │
│  │  │       │ clearKnownAuthCookies()  │      │        │     │
│  │  │       │ logger[logLevel](event)  │      │        │     │
│  │  │       │ return NextResponse      │      │        │     │
│  │  │       └──────────────────────────┘      │        │     │
│  │  └───────────────────────────────────────── │        │     │
│  │                                             │        │     │
│  │  ┌── SUCCESS PATH ───────────────────────── │ ───┐  │     │
│  │  │  logger.info(loginSuccess)               │   │  │     │
│  │  │  addSentryBreadcrumb(...)  ───────────────┘   │  │     │
│  │  │  NextResponse.json({ ok: true, redirectTo })  │  │     │
│  │  │  appendSetCookieHeaders(response, ◄───────────┘  │     │
│  │  │    setCookieHeaders)                              │     │
│  │  │  setSessionCookie(response)                       │     │
│  │  └───────────────────────────────────────────────────     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    NextResponse
```

### Layer Separation Summary

| Concern | Location |
|---|---|
| Cookie read / refresh token extraction | Handler (stays) |
| API call + normalize | Handler (stays) |
| `Set-Cookie` header extraction | Handler (stays) |
| `addSentryBreadcrumb` | Handler (stays) — has request context |
| `captureException` | Handler (stays) — has raw `error` object |
| `logger.warn` for API endpoint failures | Handler (stays) — has endpoint + status |
| JSON error body construction | `createErrorResponse` (new module) |
| `appendSetCookieHeaders` on error response | `createErrorResponse` (via `setCookieHeaders`) |
| `clearKnownAuthCookies` on error response | `createErrorResponse` (via `clearAuthCookies`) |
| `logger[logLevel]` for auth event | `createErrorResponse` |
| Success response construction | Handler (stays) |

---

## 7. Import Boundary Rules

### Who May Import `features/auth/errors/`

| Layer | Import permitted | Rationale |
|---|---|---|
| `features/auth/server/*.ts` | ✅ Yes | Primary consumer — server-side handlers |
| `app/api/auth/**/*.ts` | ✅ Yes | Route files delegate to this module directly |
| `features/auth/components/` | ❌ No | UI layer must never import server-side error builders |
| `features/auth/hooks/` | ❌ No | Client hooks must never import Next.js server utilities |
| `features/auth/services/` | ❌ No | Client service layer; `loginService` uses HTTP response |
| `lib/` | ❌ No | Infrastructure layer must not depend on feature modules |
| Any feature other than `auth` | ❌ No | Cross-feature imports are prohibited |

### Enforcement

`createErrorResponse.ts` imports `NextResponse` from `next/server`. Any attempt to
import it into a client component or hook will fail at build time with a Next.js
"Server Only" boundary violation. No explicit `"server-only"` guard is needed because
`NextResponse` is already a server-only export.

---

## 8. No Breaking Changes Checklist

### `LoginErrorPayload` Consumers

| Consumer | Field(s) read | Compatible? | Notes |
|---|---|---|---|
| `login.service.ts` — `LoginServiceFailureResult.error` | `detail`, `status`, `title`, `traceId?`, `fieldErrors?` | ✅ Yes | `LoginErrorPayload = AuthErrorEnvelope` — same fields, same types |
| `loginErrorResponseSchema` (Zod) | `error.detail`, `error.status`, `error.title`, `error.traceId`, `error.fieldErrors` | ✅ Yes | All parsed with `.optional()` — new `type?` field is ignored by Zod |
| `auth.types.ts` — exported name | `LoginErrorPayload` as exported symbol | ✅ Yes | Kept as `type LoginErrorPayload = AuthErrorEnvelope` |

### Wire Format Consumers

| Consumer | Field read from JSON | After refactor | Breaking? |
|---|---|---|---|
| `loginService` on `POST /api/auth/login` | `response.ok`, `error.detail`, `error.status`, `error.title`, `error.traceId?`, `error.fieldErrors?` | All fields unchanged | ❌ No |
| `loginService` on success | `redirectTo` | Unchanged | ❌ No |
| `middleware.ts` on `POST /api/auth/refresh` | `refreshResponse.ok` (HTTP property, not JSON) | Unchanged | ❌ No |
| Internal refresh client (none exists) | — | N/A | ❌ No |

### `success` Key on Refresh Response

Search for any consumer of the JSON `success` field from the refresh response body:

```
grep -r "\.success\b" apps/admin/src/lib/auth/session-strategy.js
# → 0 matches
```

`session-strategy.js` uses `refreshResponse.ok` (the HTTP `Response` property) at
line 248. The JSON body is never parsed for the refresh route. The `success → ok`
change in the JSON body is safe.

### Field-by-Field Stability Matrix

| Field | Before (login) | After (login) | Before (refresh error) | After (refresh error) |
|---|---|---|---|---|
| Discriminant key | `ok: false` | `ok: false` | `success: false` | `ok: false` |
| `error.status` | ✅ present | ✅ present | ❌ absent | ✅ present |
| `error.title` | ✅ present | ✅ present | ✅ present | ✅ present |
| `error.detail` | ✅ present | ✅ present | ✅ present | ✅ present |
| `error.traceId` | optional | optional | optional | optional |
| `error.fieldErrors` | optional | optional | never | never |
| `error.type` | absent | absent (optional) | absent | absent (optional) |

---

## 9. TypeScript Wire Format Reference Types

These are documentation-only types (not for export). They capture the full response
contract as it will exist after the refactor.

```ts
// Auth error response body — enforced by createErrorResponse return type
type AuthErrorResponseBody = {
  ok: false;
  error: {
    status: number;      // required — mirrors HTTP status
    title: string;       // required
    detail: string;      // required
    type?: string;       // optional — future use
    traceId?: string;    // optional
    fieldErrors?: Record<string, string[]>; // optional — login only
  };
};

// Login success response body — UNCHANGED
type LoginSuccessResponseBody = {
  ok: true;
  redirectTo: string;
};

// Refresh success response body — NOT CHANGED by this spec
type RefreshSuccessResponseBody = {
  success: true;
};
```

---

## 10. Acceptance Criteria Cross-Reference

| Spec Criterion | Design Coverage | Section |
|---|---|---|
| `createErrorResponse.ts` exists and exports `createErrorResponse` | Module structure + full implementation | §1, §2 |
| `AuthErrorEnvelope` and `AuthErrorPayload` exported from `auth.types.ts` | Full type definitions | §3 |
| `LoginErrorPayload` remains exported without shape change | Alias declaration + consumer matrix | §3, §8 |
| `login.handler.ts` has no local `createErrorResponse` | Call sequence outline | §4 |
| `login.handler.ts` imports from `@/features/auth/errors/createErrorResponse` | Import specification | §4 |
| `refresh/route.ts` has zero occurrences of `success: false` | Before/after for all 5 branches | §5 |
| Every refresh error branch includes `status` in error envelope | Before/after table, field matrix | §5, §8 |
| `refresh/route.ts` uses `createErrorResponse` at all error branches | Before/after for all 5 branches | §5 |
| `loginService` is unmodified | Consumer checklist | §8 |
| TypeScript compiles with no errors | Type definitions are exact, no suppressions | §2, §3 |
