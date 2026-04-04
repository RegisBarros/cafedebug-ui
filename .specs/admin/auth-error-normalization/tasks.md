# Tasks: Auth Handler Error Normalization

| Field | Value |
|---|---|
| **Status** | Ready for implementation |
| **Spec** | `.specs/admin/auth-error-normalization/spec.md` |
| **Design** | `.specs/admin/auth-error-normalization/design.md` |
| **Assigned to** | Frontend Blacksmith |

---

## Prerequisites Checklist

Before starting implementation, verify the following are satisfied:

- [ ] `apps/admin/src/features/auth/errors/` directory does not yet exist (Phase 2 creates it)
- [ ] No local `createErrorResponse` exists outside `login.handler.ts` in the auth feature
- [ ] `apps/admin/src/lib/auth/session-strategy.js` confirmed to never read the refresh JSON body (reads only `refreshResponse.ok` — the HTTP `Response.ok` property — and `Set-Cookie` headers). This resolves the open prerequisite from spec §7: the `success → ok` change in the response body has zero impact on the middleware.
- [ ] Run `pnpm --filter @cafedebug/admin typecheck` to confirm zero pre-existing TypeScript errors before making changes

---

## Phase 1 — Type Updates

### Task 1.1 — Update `auth.types.ts`

- **File:** `apps/admin/src/features/auth/types/auth.types.ts`
- **Type:** MODIFY
- **Layer:** server (type definitions shared across server layer)
- **Change:**

  1. Add `AuthErrorEnvelope` interface with JSDoc comments — the canonical wire-format shape for the `error` object inside every auth error response body:

     ```ts
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
     ```

  2. Add `AuthErrorPayload` type — extends `AuthErrorEnvelope` with handler-level side-effect params:

     ```ts
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
     ```

  3. Replace the existing `LoginErrorPayload` standalone type with a backward-compatible alias pointing to `AuthErrorEnvelope`. Add the "do not remove" guard comment:

     ```ts
     // Backward-compatible alias — do NOT remove.
     // Consumed by:
     //   - login.service.ts (LoginServiceFailureResult.error)
     //   - login.schema.ts  (loginErrorResponseSchema parses these fields)
     export type LoginErrorPayload = AuthErrorEnvelope;
     ```

  4. All remaining types (`LoginRequest`, `LoginFieldName`, `LoginFieldState`, `LoginServiceSuccessResult`, `LoginServiceFailureResult`, `LoginServiceResult`, `LoginErrorResponsePayload`, `LoginSuccessResponsePayload`) are **UNCHANGED**.

- **Deliverables:**
  1. `AuthErrorEnvelope` exported from `auth.types.ts`
  2. `AuthErrorPayload` exported from `auth.types.ts`
  3. `LoginErrorPayload` remains exported as a named alias — same structural shape as before (additive `type?` field is transparent to all existing consumers)
  4. Existing types below the new additions are structurally identical to current file

- **Architecture rules:**
  - Do NOT import `AuthErrorPayload` or `AuthErrorEnvelope` into any client component, hook, or service — these types are consumed only by `createErrorResponse` and the server handlers
  - `LoginErrorPayload` alias MUST NOT be removed; `login.service.ts` depends on it
  - No `@ts-ignore` or `@ts-expect-error` suppressions

- **Validation:**
  - `grep -n "AuthErrorEnvelope\|AuthErrorPayload\|LoginErrorPayload" apps/admin/src/features/auth/types/auth.types.ts` returns all three names
  - `pnpm --filter @cafedebug/admin typecheck` passes with zero errors after this change alone
  - Confirm `LoginErrorPayload` is structurally equal to its current shape: `{ detail: string; status: number; title: string; traceId?: string; fieldErrors?: ApiFieldErrors }` — the new `type?: string` field is additive and backward-compatible

---

## Phase 2 — Extract `createErrorResponse` Module

### Task 2.1 — Create `features/auth/errors/createErrorResponse.ts`

- **File:** `apps/admin/src/features/auth/errors/createErrorResponse.ts`
- **Type:** CREATE (new directory + new file)
- **Layer:** server
- **Change:**

  Create the directory `apps/admin/src/features/auth/errors/` and the file `createErrorResponse.ts` with the exact implementation from design.md §2:

  ```ts
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

  **Implementation notes (from Debugger Review):**
  - The `setCookieHeaders` guard MUST use `setCookieHeaders.length > 0` (not just truthiness) to protect against both `undefined` (handled by default `= []`) and empty array `[]`
  - `clearKnownAuthCookies` MUST always be called **after** `appendSetCookieHeaders` — when a cookie name appears in both, the clear instruction must take precedence (security contract)
  - `captureException` and `addSentryBreadcrumb` are intentionally absent — they stay in calling handlers that have the raw `error` object and request context

- **Deliverables:**
  1. `apps/admin/src/features/auth/errors/` directory exists
  2. `createErrorResponse.ts` exists and exports named `createErrorResponse` function
  3. Function accepts `AuthErrorPayload` and returns `NextResponse`
  4. No `captureException` or `addSentryBreadcrumb` calls inside the module
  5. No imports from `app/` or any route file

- **Architecture rules:**
  - Module MUST NOT import from `app/` (spec FR-3)
  - Module MUST NOT import from `features/auth/components/`, `features/auth/hooks/`, or `features/auth/services/` (design §7 import boundary rules)
  - No new npm packages introduced — all imports (`next/server`, `@/lib/auth/next-response-cookies`, `@/lib/observability`) are already present in `login.handler.ts` (spec NFR-2)

- **Validation:**
  - `ls apps/admin/src/features/auth/errors/createErrorResponse.ts` exists
  - `pnpm --filter @cafedebug/admin typecheck` passes with zero errors
  - `grep -n "captureException\|addSentryBreadcrumb\|from.*app/" apps/admin/src/features/auth/errors/createErrorResponse.ts` returns zero matches

---

## Phase 3 — Refactor `login.handler.ts`

> **Dependency:** Phase 2 (Task 2.1) must be complete before this phase.

### Task 3.1 — Import `createErrorResponse` from new module

- **File:** `apps/admin/src/features/auth/server/login.handler.ts`
- **Type:** MODIFY
- **Layer:** server
- **Change:**

  Add the import statement for `createErrorResponse` from the new module:

  ```ts
  import { createErrorResponse } from "../errors/createErrorResponse";
  ```

  Place this import in the feature-relative imports block (after the `@/lib/*` imports, with other `../` feature imports).

- **Deliverables:**
  1. Import line present at correct location in import block
  2. No `import { createErrorResponse }` pointing anywhere other than `../errors/createErrorResponse`

- **Architecture rules:**
  - Import path is relative (`../errors/createErrorResponse`), not an alias (`@/features/auth/errors/createErrorResponse`) — both are valid but relative is consistent with how `login.handler.ts` already imports from `../schemas/login.schema` and `../types/auth.types`

- **Validation:**
  - `grep -n "createErrorResponse" apps/admin/src/features/auth/server/login.handler.ts` shows the import line and the existing call sites (no local definition)

---

### Task 3.2 — Remove local `createErrorResponse` definition

- **File:** `apps/admin/src/features/auth/server/login.handler.ts`
- **Type:** MODIFY
- **Layer:** server
- **Change:**

  Delete the entire private `createErrorResponse` function declaration — currently lines 23–69 in the file. This is the block starting with:
  ```ts
  const createErrorResponse = ({
    detail,
    status,
    ...
  }: LoginErrorPayload & {
    ...
  }) => {
  ```
  and ending with `};` before `const readLoginBody`.

  All **4 existing call sites** inside `loginHandler` remain unchanged — they now call the imported function instead of the local one. The argument shapes are identical.

  **Also update the `LoginErrorPayload` import** — since `login.handler.ts` imports `LoginErrorPayload` only for the local function's type annotation (which is now removed), verify whether the import is still needed. If `LoginErrorPayload` is no longer referenced in the file after deletion, remove it from the `import type { LoginErrorPayload } from "../types/auth.types"` line. The `AuthErrorPayload` type is used internally by `createErrorResponse` and does not need to be imported into the handler.

- **Deliverables:**
  1. No function named `createErrorResponse` declared locally in `login.handler.ts`
  2. All 4 call sites within `loginHandler` pass their existing arguments (structure unchanged)
  3. `LoginErrorPayload` import removed if it is no longer referenced in the file
  4. No orphaned type imports

- **Architecture rules:**
  - Zero behavioral change permitted — response bodies, HTTP status codes, cookie operations, and log output MUST produce identical results before and after (spec FR-4, NFR-4)
  - No `@ts-ignore` or `@ts-expect-error` suppressions

- **Validation:**
  - `grep -n "const createErrorResponse" apps/admin/src/features/auth/server/login.handler.ts` returns zero matches
  - `pnpm --filter @cafedebug/admin typecheck` passes with zero errors
  - All 4 call sites still present: `grep -c "createErrorResponse(" apps/admin/src/features/auth/server/login.handler.ts` returns `4`

---

### Task 3.3 — Verify `readLoginBody` and `readValidationFieldErrors` are retained

- **File:** `apps/admin/src/features/auth/server/login.handler.ts`
- **Type:** VERIFY
- **Layer:** server
- **Change:**

  Confirm that `readLoginBody` and `readValidationFieldErrors` helper functions are **NOT removed**. These helpers are out of scope for this refactor (spec §3 Problem 3 defers handler decomposition to a future iteration).

- **Deliverables:**
  1. `readLoginBody` function still present in the file
  2. `readValidationFieldErrors` function still present in the file

- **Architecture rules:**
  - No scope creep — this task only removes the `createErrorResponse` local definition; no other refactoring is permitted in this phase

- **Validation:**
  - `grep -n "readLoginBody\|readValidationFieldErrors" apps/admin/src/features/auth/server/login.handler.ts` returns both function declarations

---

## Phase 4 — Normalize `refresh/route.ts`

> **Dependency:** Phase 2 (Task 2.1) must be complete before this phase.

### Task 4.1 — Add `createErrorResponse` import and normalize all five error branches

- **File:** `apps/admin/src/app/api/auth/refresh/route.ts`
- **Type:** MODIFY
- **Layer:** server (API route)
- **Change:**

  **Step 1 — Add import:**
  ```ts
  import { createErrorResponse } from "@/features/auth/errors/createErrorResponse";
  ```
  Add this to the feature imports block. Use the `@/` alias (not relative path) since this is an `app/api` route referencing a `features/` module.

  **Step 2 — Replace all 5 error branches** using the exact before/after from design.md §5:

  ---

  **Branch 1 — Missing `apiBaseUrl`:**

  Remove the existing `logger.error(...)` call and the inline `NextResponse.json(...)` return. Replace with:

  ```ts
  return createErrorResponse({
    status: 503,
    title: "Configuration Error",
    detail: "Admin API base URL is not configured.",
    event: observabilityEvents.authRefreshFailed,
    logLevel: "error"
  });
  ```

  > `logger.error(...)` is removed — `createErrorResponse` calls `logger[logLevel](event, ...)` internally with `logLevel: "error"`.

  ---

  **Branch 2 — Missing refresh token cookie:**

  Remove the existing `logger.warn(...)` call and the inline response construction block (`NextResponse.json(...)` + `clearKnownAuthCookies(response)` + `return response`). Replace with:

  ```ts
  return createErrorResponse({
    status: 401,
    title: "Session expired",
    detail: "Your session has expired. Please sign in again.",
    clearAuthCookies: true,
    event: observabilityEvents.authRefreshMissingToken
  });
  ```

  > `clearKnownAuthCookies` is now handled internally via `clearAuthCookies: true`. `logger.warn(...)` is removed — handled internally.

  ---

  **Branch 3 — API error response (`"error" in normalizedRefreshResponse`):**

  Remove the existing `logger.warn(observabilityEvents.authRefreshFailed, ...)` call and the inline response construction block (`NextResponse.json(...)` + `appendSetCookieHeaders(response, setCookieHeaders)` + `clearKnownAuthCookies(response)` + `return response`). Replace with:

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

  > `logger.warn(...)`, `appendSetCookieHeaders(...)`, and `clearKnownAuthCookies(...)` are removed — all handled internally by `createErrorResponse`.

  ---

  **Branch 4 — `isSuccess === false`:**

  Remove the existing `logger.warn(observabilityEvents.authRefreshFailed, ...)` call and the inline response construction block. Replace with:

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

  > `logger.warn(...)`, `appendSetCookieHeaders(...)`, and `clearKnownAuthCookies(...)` are removed — all handled internally.

  ---

  **Branch 5 — `catch` block:**

  The existing `logger.error(...)` call and `captureException(...)` call **MUST BE RETAINED** — they carry the raw `error` object and endpoint context not available inside `createErrorResponse`. Only the final `return NextResponse.json(...)` is replaced:

  ```ts
  return createErrorResponse({
    status: 503,
    title: "Service Unavailable",
    detail: "Unable to refresh session. Please try again.",
    event: observabilityEvents.authRefreshFailed,
    logLevel: "error"   // ← REQUIRED: prevents silent log level downgrade (Debugger Issue #1)
  });
  ```

  > `logger.error(...)` and `captureException(...)` stay. `logLevel: "error"` is **mandatory** — the default is `"warn"` and the current handler already logs at `"error"` level in the catch block.

  ---

  **Step 3 — Clean up `NextResponse` import:**

  After replacing all 5 error branches, the success path still uses `NextResponse.json({ success: true }, { status: 200 })`. Confirm `NextResponse` remains imported for the success branch. If it is used nowhere else, it MAY be removed only if the success path is also confirmed not to need it — but the success path DOES use it, so retain the import.

- **Deliverables:**
  1. `createErrorResponse` imported from `@/features/auth/errors/createErrorResponse`
  2. All 5 error branches use `createErrorResponse(...)` instead of inline `NextResponse.json(...)`
  3. No `success: false` remains anywhere in the file
  4. All 5 error branches include `status` inside the `error` envelope
  5. Branch 5 (catch) passes `logLevel: "error"`
  6. `logger.error(...)` and `captureException(...)` in the catch block are retained
  7. Success path `{ success: true }` is **UNCHANGED** (spec §8 out of scope)

- **Architecture rules:**
  - Route file (`app/api/`) may import from `features/auth/errors/` — permitted per design §7 import boundary rules
  - No business logic added to the route file itself — it remains a thin delegator
  - `captureException` stays in the handler (it has the raw error + request context; `createErrorResponse` must not call it)

- **Validation:**
  - `grep -n "success: false" apps/admin/src/app/api/auth/refresh/route.ts` returns zero matches
  - `grep -n "ok: false" apps/admin/src/app/api/auth/refresh/route.ts` returns 5 matches (one per error branch via `createErrorResponse`)
  - `grep -n "NextResponse.json" apps/admin/src/app/api/auth/refresh/route.ts` returns only the success path (`{ success: true }`)
  - `grep -n "logLevel.*error" apps/admin/src/app/api/auth/refresh/route.ts` confirms `logLevel: "error"` on the catch branch
  - `pnpm --filter @cafedebug/admin typecheck` passes with zero errors

---

### Task 4.2 — Confirm error count discrepancy is resolved (spec says 4, actual is 5)

- **File:** `apps/admin/src/app/api/auth/refresh/route.ts`
- **Type:** VERIFY
- **Layer:** server
- **Change:**

  Verify that all **5** error branches are normalized, not 4. The spec's FR-5 opening sentence incorrectly reads "four affected error sites" (Debugger Issue #2 — non-blocking but must not cause implementer confusion). The table in FR-5 and the actual `refresh/route.ts` both have 5 branches. Task 4.1 already normalizes all 5. This task is a confirmatory check.

- **Deliverables:**
  1. `grep -c "createErrorResponse(" apps/admin/src/app/api/auth/refresh/route.ts` returns `5`

- **Validation:**
  - Count matches expected: 5 call sites for `createErrorResponse` in the refresh route

---

## Phase 5 — Validation

### Task 5.1 — Architecture compliance check

- **File:** N/A (cross-file review)
- **Type:** VERIFY
- **Layer:** architecture
- **Change:**

  Verify that the feature-based architecture is respected after all changes:

  1. `createErrorResponse.ts` is in `features/auth/errors/` — not in `app/`, not in `lib/`
  2. No import of `createErrorResponse` in `features/auth/components/`, `features/auth/hooks/`, or `features/auth/services/`
  3. No import of `createErrorResponse` in any feature other than `auth`
  4. `app/api/auth/refresh/route.ts` imports from `@/features/auth/errors/` — route delegates to feature module, not the reverse
  5. `login.handler.ts` imports from `../errors/createErrorResponse` — handler delegates to feature error module

- **Deliverables:**
  1. `grep -r "createErrorResponse" apps/admin/src/ --include="*.ts" --include="*.tsx"` returns only:
     - `features/auth/errors/createErrorResponse.ts` (definition)
     - `features/auth/server/login.handler.ts` (import + 4 call sites)
     - `app/api/auth/refresh/route.ts` (import + 5 call sites)

- **Validation:**
  - Zero unexpected import locations for `createErrorResponse`

---

### Task 5.2 — Blocking Issue #1: `logLevel` regression check in `refresh/route.ts` catch block

- **File:** `apps/admin/src/app/api/auth/refresh/route.ts`
- **Type:** VERIFY
- **Layer:** server
- **Change:**

  Explicitly verify that the `catch` block call to `createErrorResponse` in `refresh/route.ts` passes `logLevel: "error"`.

  **Why this matters:** `createErrorResponse` defaults `logLevel` to `"warn"`. The current catch block logs at `logger.error(...)`. If `logLevel: "error"` is omitted in the migration, the log level silently downgrades from `"error"` to `"warn"` with no TypeScript compile-time signal and no smoke test that would catch it. This is a silent observability regression (Debugger Issue #1 — Blocking).

  The expected catch block after refactor:
  ```ts
  } catch (error) {
    logger.error(observabilityEvents.authRefreshFailed, { ... });  // RETAINED
    captureException(error, { ... });                               // RETAINED
    return createErrorResponse({
      status: 503,
      title: "Service Unavailable",
      detail: "Unable to refresh session. Please try again.",
      event: observabilityEvents.authRefreshFailed,
      logLevel: "error"   // ← MUST BE PRESENT
    });
  }
  ```

- **Deliverables:**
  1. `grep -n "logLevel.*error" apps/admin/src/app/api/auth/refresh/route.ts` returns a match within the catch block

- **Validation:**
  - The `logLevel: "error"` is present on the catch-block `createErrorResponse` call
  - Mirrors the pattern already in `loginHandler`'s catch block (which was correct before this refactor)

---

### Task 5.3 — Blocking Issue #3: Event mapping check for all 5 refresh branches

- **File:** `apps/admin/src/app/api/auth/refresh/route.ts`
- **Type:** VERIFY
- **Layer:** server
- **Change:**

  Verify that each of the 5 error branches in `refresh/route.ts` uses the correct `observabilityEvents.*` constant. Without this check, an implementer could accidentally use `authLoginFailed` instead of `authRefreshFailed` or mix up `authRefreshMissingToken` (Debugger Issue #3 — Blocking).

  **Required event mapping:**

  | Branch | Required `event` value |
  |---|---|
  | Branch 1 — Missing `apiBaseUrl` | `observabilityEvents.authRefreshFailed` |
  | Branch 2 — Missing refresh token | `observabilityEvents.authRefreshMissingToken` |
  | Branch 3 — API error response (`"error" in normalizedRefreshResponse`) | `observabilityEvents.authRefreshFailed` |
  | Branch 4 — `isSuccess === false` | `observabilityEvents.authRefreshFailed` |
  | Branch 5 — `catch` block | `observabilityEvents.authRefreshFailed` |

  Verify each call site passes the exact constant listed above.

- **Deliverables:**
  1. `grep -n "authRefreshMissingToken" apps/admin/src/app/api/auth/refresh/route.ts` returns exactly 1 match (Branch 2)
  2. `grep -c "authRefreshFailed" apps/admin/src/app/api/auth/refresh/route.ts` returns exactly 4 matches (Branches 1, 3, 4, 5)
  3. No `authLoginFailed` or `authLoginValidationFailed` appears in `refresh/route.ts`

- **Validation:**
  - All 5 branches confirmed against the event mapping table above
  - `grep -n "authLogin" apps/admin/src/app/api/auth/refresh/route.ts` returns zero matches

---

### Task 5.4 — Middleware prerequisite resolved: session-strategy.js never reads refresh JSON body

- **File:** `apps/admin/src/lib/auth/session-strategy.js`
- **Type:** VERIFY
- **Layer:** infrastructure
- **Change:**

  Confirm that `session-strategy.js` never reads the JSON body of the refresh response. This resolves the open prerequisite from spec §7 that framed the `success → ok` rename as potentially blocking (Debugger Issue #4 — Non-blocking but should fix).

  **Finding (already confirmed by Debugger Review):** `session-strategy.js` checks only `refreshResponse.ok` (the HTTP `Response.ok` property, i.e. `response.status >= 200 && response.status < 300`) and `Set-Cookie` headers. It never calls `.json()` on the refresh response body. The `success → ok` change in the JSON body is therefore safe.

  Run the following verification:

  ```bash
  grep -n "\.success\b\|\.json()\|response\.body\|refreshResponse\." apps/admin/src/lib/auth/session-strategy.js
  ```

  Confirm that no line reads `.success` on the parsed refresh response JSON.

- **Deliverables:**
  1. `grep -n "refreshResponse\.success\|\.success\b" apps/admin/src/lib/auth/session-strategy.js` returns zero matches
  2. The middleware prerequisite is confirmed resolved — no consumer update required

- **Validation:**
  - Zero matches for JSON body parsing of refresh response in `session-strategy.js`
  - Middleware calls `refreshResponse.ok` (HTTP property) only

---

### Task 5.5 — Client contract regression check (`loginService` unaffected)

- **File:** `apps/admin/src/features/auth/services/login.service.ts`
- **Type:** VERIFY
- **Layer:** service (client)
- **Change:**

  Confirm that `loginService` is unmodified and its wire-format contract is preserved.

  Verify all of the following:

  1. `login.service.ts` is NOT modified (no diff from current HEAD)
  2. The wire format `{ ok: false, error: { detail, status, title, traceId?, fieldErrors? } }` is unchanged for `POST /api/auth/login`
  3. `LoginErrorPayload` is still importable from `features/auth/types/auth.types.ts` under the same exported name
  4. `loginErrorResponseSchema` (in `login.schema.ts`) does not need modification — it uses `.optional()` on all error fields; the new additive `type?` field on `AuthErrorEnvelope` is silently ignored by Zod during parsing

- **Deliverables:**
  1. `git diff apps/admin/src/features/auth/services/login.service.ts` returns empty (no changes)
  2. `git diff apps/admin/src/features/auth/schemas/login.schema.ts` returns empty (no changes)
  3. `grep -n "LoginErrorPayload" apps/admin/src/features/auth/types/auth.types.ts` confirms the export is present

- **Validation:**
  - `loginService` is structurally identical before and after
  - `LoginErrorPayload` exported name unchanged, backward-compatible shape

---

### Task 5.6 — TypeScript build passes with zero errors

- **File:** N/A (build check)
- **Type:** VERIFY
- **Layer:** infrastructure
- **Change:**

  Run the TypeScript type checker across the admin app to confirm zero errors after all phases are complete.

  ```bash
  pnpm --filter @cafedebug/admin typecheck
  ```

  Or equivalently:

  ```bash
  pnpm --filter @cafedebug/admin build
  ```

- **Deliverables:**
  1. Command exits with code 0
  2. Zero type errors reported
  3. No `@ts-ignore` or `@ts-expect-error` suppressions introduced in any modified file

- **Validation:**
  - Build/typecheck output shows no errors
  - Confirm no suppressions: `grep -rn "@ts-ignore\|@ts-expect-error" apps/admin/src/features/auth/ apps/admin/src/app/api/auth/` returns zero matches (or only pre-existing ones not introduced by this refactor)

---

## Phase 6 — Documentation

### Task 6.1 — Update spec.md status to "Implemented"

- **File:** `.specs/admin/auth-error-normalization/spec.md`
- **Type:** MODIFY
- **Layer:** documentation
- **Change:**

  After all phases are complete and Phase 5 validation passes, update the status header in `spec.md`:

  ```markdown
  | **Status** | Implemented |
  ```

  Change from `Draft` → `Implemented`.

- **Deliverables:**
  1. Status field updated in spec.md header table

- **Validation:**
  - `grep "Status.*Implemented" .specs/admin/auth-error-normalization/spec.md` returns a match

---

### Task 6.2 — Update Debugger Review status in spec.md

- **File:** `.specs/admin/auth-error-normalization/spec.md`
- **Type:** MODIFY
- **Layer:** documentation
- **Change:**

  Update the `## Debugger Review` section at the bottom of `spec.md` to reflect which issues were addressed during implementation:

  - Issue 1 (Blocking — logLevel regression): ✅ Resolved — catch block passes `logLevel: "error"`
  - Issue 2 (Non-blocking — four vs five): ✅ Resolved — Task 4.2 confirmed 5 branches normalized
  - Issue 3 (Blocking — event mapping): ✅ Resolved — Task 5.3 validated all event constants
  - Issue 4 (Non-blocking — middleware prerequisite): ✅ Resolved — Task 5.4 confirmed `session-strategy.js` never reads JSON body
  - Issues 5–7 (Non-blocking): Documented as resolved or deferred per spec scope

  Update the `**Status:**` line under `## Debugger Review`:

  ```markdown
  **Status:** ✅ Resolved — all blocking issues addressed in implementation
  ```

- **Deliverables:**
  1. Debugger Review section updated with resolution status for all 2 blocking issues
  2. Implementation confirmation noted for non-blocking items addressed in Phase 5 tasks

- **Validation:**
  - Spec reflects final implementation state; no open blocking issues remain

---

## Execution Order (Dependency Graph)

```
1.1 → 2.1 → 3.1 → 3.2 → 3.3
              ↓
             4.1 → 4.2
              ↓
             5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6
                                               ↓
                                          6.1 → 6.2
```

**Linear order (safe sequential execution):**

```
1.1 → 2.1 → 3.1 → 3.2 → 4.1 → 5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6 → 6.1 → 6.2
              ↑
              Phase 3 depends on Phase 2 (createErrorResponse.ts must exist before importing it)
                    ↑
                    Phase 4 depends on Phase 2 (same reason)
```

**Parallelizable after Phase 2:**
- Task 3.3 (verify login helpers) can be done in parallel with Phase 4
- Tasks 5.4 and 5.5 can be done in parallel (independent files)

---

## Definition of Done

All checkboxes must be checked before this feature is considered complete:

- [ ] `AuthErrorEnvelope`, `AuthErrorPayload`, and `LoginErrorPayload` types exported from `apps/admin/src/features/auth/types/auth.types.ts`
- [ ] `createErrorResponse` exported from `apps/admin/src/features/auth/errors/createErrorResponse.ts`
- [ ] `apps/admin/src/features/auth/errors/createErrorResponse.ts` contains no call to `captureException` or `addSentryBreadcrumb`
- [ ] `login.handler.ts` has zero local `createErrorResponse` definition
- [ ] `login.handler.ts` imports `createErrorResponse` from `../errors/createErrorResponse`
- [ ] `readLoginBody` and `readValidationFieldErrors` remain in `login.handler.ts` (not removed)
- [ ] `refresh/route.ts` uses `ok: false` (not `success: false`) on all error responses
- [ ] `refresh/route.ts` includes `status` field in all 5 error envelopes
- [ ] `refresh/route.ts` catch-block `createErrorResponse` call explicitly passes `logLevel: "error"`
- [ ] All 5 refresh error branches pass the correct `observabilityEvents.*` constant (see Task 5.3 mapping table)
- [ ] `session-strategy.js` confirmed to never read refresh JSON body — middleware prerequisite resolved
- [ ] `login.service.ts` is unmodified — wire contract unchanged, no client-side changes required
- [ ] TypeScript build (`pnpm --filter @cafedebug/admin typecheck`) passes with zero errors
- [ ] No `@ts-ignore` or `@ts-expect-error` suppressions introduced
- [ ] Spec status updated to "Implemented" in `.specs/admin/auth-error-normalization/spec.md`
- [ ] Debugger Review blocking issues #1 and #3 marked as resolved in spec.md
