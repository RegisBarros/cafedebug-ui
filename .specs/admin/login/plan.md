# Implementation Plan: Admin Login Feature

| Field | Value |
|---|---|
| **Status** | Ready for Implementation |
| **Domain** | `admin/auth` |
| **Spec** | `.specs/admin/login/spec.md` |
| **Design** | `.specs/admin/login/design.md` |
| **Draft Tasks** | `.specs/admin/login/tasks.md` |
| **Approved By** | Architect Guardian |
| **Planner** | Master Planner |

---

## Phase Overview

| Phase | Name | Gate Condition | Risk |
|---|---|---|---|
| **Phase 0** | Contract Verification | ⛔ BLOCKING — Phases 1–5 cannot begin with unverified strategy | 🔴 Critical |
| **Phase 1** | Types and Schema | Depends on Phase 0 confirmation of `TokenResponse` shape | 🟡 Medium |
| **Phase 2** | Handler Alignment | Depends on Phase 0 (strategy) + Phase 1 (types) | 🔴 Critical |
| **Phase 3** | Service and Hook Alignment | Depends on Phase 1 (schema + types) | 🟡 Medium |
| **Phase 4** | Component and UI Alignment | Depends on Phase 3 | 🟢 Low |
| **Phase 5** | Validation and Quality Gates | Depends on all prior phases | 🟢 Low |

> **Hard gate:** Phase 2 (`P2-T3`) must NOT be implemented before GAP-08 is resolved in
> Phase 0. The token cookie strategy depends on verified backend behavior.

---

## Phase 0 — Contract Verification

> **Goal:** Verify the OpenAPI generated types are current and confirm the exact
> backend behavior for token delivery (JSON body vs `Set-Cookie` headers).  
> This phase is a **hard gate** — no implementation work may begin until GAP-08 is resolved.

---

### P0-T1 — Run `pnpm gate:contract`

| Field | Value |
|---|---|
| **Task ID** | `P0-T1` |
| **File** | `packages/api-client/src/generated/schema.ts` (verified, not modified) |
| **Layer** | infrastructure |
| **Gap addressed** | RISK-01 |
| **Depends on** | — |

**What to do:**

Run the contract gate from the monorepo root:

```bash
pnpm gate:contract
```

This runs `openapi-typescript --check` against the backend OpenAPI/Swagger specification
and validates that `packages/api-client/src/generated/schema.ts` is up to date.

If the check fails, regenerate the client:

```bash
pnpm generate:api-client
```

Then re-run `pnpm gate:contract` to confirm it passes before proceeding.

**Validation step:**
- `pnpm gate:contract` exits with code `0`
- The generated schema contains the `POST /api/v1/admin/auth/token` → `200 OK` response
  body with fields: `accessToken`, `refreshToken`, `tokenType`, `expiresIn`
- Confirm the generated `components["schemas"]["Result"]` type matches:

```ts
{
  accessToken: string;
  refreshToken: { token: string; expirationDate: string };
  tokenType: "Bearer";
  expiresIn: number;
}
```

**Architecture note:** Never handwrite OpenAPI types — always regenerate from the source contract.

---

### P0-T2 — Verify Backend Token Delivery Strategy

| Field | Value |
|---|---|
| **Task ID** | `P0-T2` |
| **File** | None (investigation task — result documented in `P0-T3`) |
| **Layer** | infrastructure |
| **Gap addressed** | GAP-08 |
| **Depends on** | P0-T1 |

**What to do:**

Make a direct HTTP request to `POST /api/v1/admin/auth/token` with valid credentials
and inspect the raw response headers.

```bash
curl -v -X POST https://<api-host>/api/v1/admin/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

Check the response for one of two outcomes:

| Outcome | Indicator | Strategy |
|---|---|---|
| **Strategy A** | Response includes `Set-Cookie: accessToken=...; Set-Cookie: refreshToken=...` headers | Forward headers via `appendSetCookieHeaders` |
| **Strategy B** | Response body only: `{ "accessToken": "...", "refreshToken": {...}, ... }` — no `Set-Cookie` headers | Extract from JSON body and set HttpOnly cookies manually |

> Based on the provided OpenAPI contract, **Strategy B** (JSON body only) is the expected
> outcome. However, this MUST be confirmed before implementing `P2-T3`.

**Validation step:**
- Raw curl output reviewed
- Strategy confirmed (A or B)
- Decision documented in `P0-T3`

**Architecture note:** Never assume backend cookie behavior — verify against a running instance.

---

### P0-T3 — Document Confirmed Token Strategy

| Field | Value |
|---|---|
| **Task ID** | `P0-T3` |
| **File** | `.specs/admin/login/design.md` (update Section 5 — Cookie and Session Strategy) |
| **Layer** | documentation |
| **Gap addressed** | GAP-08 |
| **Depends on** | P0-T2 |

**What to do:**

Update Section 5 of `design.md` to mark the confirmed strategy:

```markdown
> ✅ CONFIRMED (Phase 0): Strategy B — Backend returns tokens in JSON body only.
> No `Set-Cookie` headers are emitted by the backend.
> Implementation must extract `accessToken` and `refreshToken.token` from the JSON body.
```

Or, if Strategy A is confirmed:

```markdown
> ✅ CONFIRMED (Phase 0): Strategy A — Backend emits `Set-Cookie` headers.
> `appendSetCookieHeaders` is sufficient. Strategy B fallback is not needed.
```

**Validation step:**
- `design.md` is updated before Phase 2 implementation begins
- The confirmed strategy is unambiguous and referenced in `P2-T3`

**Architecture note:** Design decisions with runtime dependencies must be confirmed, not assumed.

---

### ✅ Phase 0 Gate

Phase 1 may begin once **P0-T1** passes.  
Phase 2 (`P2-T3` specifically) must NOT begin until **P0-T3** is complete.

---

## Phase 1 — Types and Schema

> **Goal:** Establish correct TypeScript types for the backend success response and
> strengthen client-side Zod validation. All downstream layers (handler, service, hook)
> depend on these foundations.

---

### P1-T1 — Add `TokenResponse` and `RefreshTokenPayload` Types

| Field | Value |
|---|---|
| **Task ID** | `P1-T1` |
| **File** | `apps/admin/src/features/auth/types/auth.types.ts` |
| **Layer** | type |
| **Gap addressed** | GAP-03 |
| **Depends on** | P0-T1 (confirmed schema shape) |

**What to do:**

Add two new types to `auth.types.ts` immediately after the `LoginRequest` type:

```ts
export type RefreshTokenPayload = {
  token: string;
  expirationDate: string; // ISO 8601 UTC — used as cookie `expires`
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: RefreshTokenPayload;
  tokenType: "Bearer";
  expiresIn: number; // seconds — used as cookie `maxAge`
};
```

These types must align exactly with the `components["schemas"]["Result"]` shape confirmed
in `P0-T1`. Do not duplicate or diverge from the OpenAPI contract.

**Validation step:**
- `pnpm --filter @cafedebug/admin typecheck` passes with no errors
- `TokenResponse` and `RefreshTokenPayload` are exported from `auth.types.ts`
- No existing type references are broken

**Architecture note:** Domain types live in `features/<domain>/types/` — never in `app/` or `lib/`.

---

### P1-T2 — Strengthen Email Validation in `loginSchema`

| Field | Value |
|---|---|
| **Task ID** | `P1-T2` |
| **File** | `apps/admin/src/features/auth/schemas/login.schema.ts` |
| **Layer** | schema |
| **Gap addressed** | GAP-04 |
| **Depends on** | — |

**What to do:**

Update the `email` field in `loginSchema` from presence-only to format-validated:

```ts
// Before
email: z.string().trim().min(1, "Email is required.")

// After
email: z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")
```

The `.email()` check must come after `.trim()` so that whitespace-only inputs fail the
`min(1)` check first with "Email is required." and valid-looking strings fail `.email()`
with the format message.

**Validation step:**
- `z.parse({ email: "notanemail", password: "validpass123" })` → `email` error: "Please enter a valid email address."
- `z.parse({ email: "", password: "validpass123" })` → `email` error: "Email is required."
- `z.parse({ email: "admin@example.com", password: "validpass123" })` → passes
- Acceptance criterion AC-14 satisfied

**Architecture note:** Validation schemas live exclusively in `features/<domain>/schemas/` — never inside components or hooks.

---

### P1-T3 — Strengthen Password Validation in `loginSchema`

| Field | Value |
|---|---|
| **Task ID** | `P1-T3` |
| **File** | `apps/admin/src/features/auth/schemas/login.schema.ts` |
| **Layer** | schema |
| **Gap addressed** | GAP-05 |
| **Depends on** | — |

**What to do:**

Update the `password` field in `loginSchema` to enforce a minimum length:

```ts
// Before
password: z.string().min(1, "Password is required.")

// After
password: z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.")
```

> ⚠️ **Open Decision:** Coordinate the minimum length (currently `8`) with the backend's
> actual enforcement. If the backend enforces a different minimum, align this value
> accordingly before implementation. Default: `8`.

**Validation step:**
- `z.parse({ email: "admin@example.com", password: "short" })` → `password` error: "Password must be at least 8 characters."
- `z.parse({ email: "admin@example.com", password: "" })` → `password` error: "Password is required."
- `z.parse({ email: "admin@example.com", password: "validpass123" })` → passes
- Acceptance criterion AC-15 satisfied

**Architecture note:** Both `P1-T2` and `P1-T3` may be completed in a single commit — they affect the same file at non-overlapping lines.

---

### P1-T4 — Add `type` Field to `loginErrorResponseSchema`

| Field | Value |
|---|---|
| **Task ID** | `P1-T4` |
| **File** | `apps/admin/src/features/auth/schemas/login.schema.ts` |
| **Layer** | schema |
| **Gap addressed** | GAP-09 |
| **Depends on** | — |

**What to do:**

Extend the `loginErrorResponseSchema` to parse the RFC 7807 `type` field:

```ts
export const loginErrorResponseSchema = z.object({
  error: z
    .object({
      detail: z.string().optional(),
      status: z.number().int().optional(),
      title: z.string().optional(),
      type: z.string().optional(),      // ← ADD THIS
      traceId: z.string().optional(),
      fieldErrors: z.record(z.string(), z.array(z.string())).optional()
    })
    .optional()
});
```

**Validation step:**
- `loginErrorResponseSchema.parse({ error: { status: 401, title: "Unauthorized", detail: "...", type: "https://..." } })` → succeeds, `type` is present in result
- TypeScript compilation passes

**Architecture note:** GAP-09 is a schema-layer fix. The type field propagation through the service (GAP-06) is handled separately in `P3-T1`.

---

### P1-T5 — Add `type` Field to `NormalizedApiError` and `normalizeApiError`

| Field | Value |
|---|---|
| **Task ID** | `P1-T5` |
| **File** | `packages/api-client/src/errors.ts` |
| **Layer** | service / infrastructure |
| **Gap addressed** | GAP-06 |
| **Depends on** | — |

**What to do:**

1. Extend the `NormalizedApiError` interface to carry the optional `type` field:

```ts
// Before
export interface NormalizedApiError {
  status: number;
  title: string;
  detail: string;
  fieldErrors?: ApiFieldErrors;
  traceId?: string;
}

// After
export interface NormalizedApiError {
  status: number;
  title: string;
  detail: string;
  type?: string;           // ← ADD: RFC 7807 type URI
  fieldErrors?: ApiFieldErrors;
  traceId?: string;
}
```

2. Extract the `type` field in `normalizeApiError` (after the `traceId` extraction):

```ts
const type = toNonEmptyString(source.type);

return {
  status,
  title,
  detail,
  ...(type ? { type } : {}),         // ← ADD
  ...(fieldErrors ? { fieldErrors } : {}),
  ...(traceId ? { traceId } : {})
};
```

**Validation step:**
- `normalizeApiError({ type: "https://...", status: 401, title: "Unauthorized", detail: "..." })` → result includes `type`
- `pnpm --filter @cafedebug/api-client typecheck` passes
- `isNormalizedApiError` type guard is unaffected (it does not check `type`)
- This is a non-breaking additive change — no existing consumers break

**Architecture note:** `packages/api-client` is shared across `apps/admin` and `apps/web`. Changes here must be backward-compatible.

---

### ✅ Phase 1 Validation Checkpoint

- `pnpm gate:quality` passes across all packages
- `auth.types.ts` exports `TokenResponse` and `RefreshTokenPayload`
- `loginSchema` rejects invalid email format and short passwords
- `loginErrorResponseSchema` parses `type` field
- `NormalizedApiError` carries `type?: string`

---

## Phase 2 — Handler Alignment

> **Goal:** Fix the two critical handler defects — the dead `isSuccess` check (GAP-02)
> and the broken token storage strategy (GAP-01). This phase MUST NOT begin until Phase 0
> confirms the token strategy.

---

### P2-T1 — Remove Dead `isSuccess` Check

| Field | Value |
|---|---|
| **Task ID** | `P2-T1` |
| **File** | `apps/admin/src/features/auth/server/login.handler.ts` |
| **Layer** | server |
| **Gap addressed** | GAP-02 |
| **Depends on** | P1-T1 |

**What to do:**

Remove the entire dead-code block that checks `normalizedTokenResponse.data.isSuccess === false`:

```ts
// REMOVE — this entire block:
if (normalizedTokenResponse.data.isSuccess === false) {
  const fallbackErrorDetail =
    normalizedTokenResponse.data.error?.message?.trim() ||
    "Authentication failed. Check your credentials and try again.";

  return createErrorResponse({
    detail: fallbackErrorDetail,
    status: 401,
    title: "Authentication Failed",
    setCookieHeaders,
    clearAuthCookies: true,
    event: observabilityEvents.authLoginFailed
  });
}
```

This block evaluates `undefined === false` permanently (the API contract has no `isSuccess`
field) and is dead code. Removing it closes GAP-02 without affecting runtime behavior.

**Validation step:**
- Block no longer exists in `login.handler.ts`
- TypeScript compilation passes
- Handler logic still correctly falls through to the success path

**Architecture note:** Dead code paths that can never be reached are worse than no guard — they mislead future maintainers.

---

### P2-T2 — Apply Typed `TokenResponse` Guard in Success Branch

| Field | Value |
|---|---|
| **Task ID** | `P2-T2` |
| **File** | `apps/admin/src/features/auth/server/login.handler.ts` |
| **Layer** | server |
| **Gap addressed** | GAP-03 (handler side) |
| **Depends on** | P1-T1, P2-T1 |

**What to do:**

After the `"error" in normalizedTokenResponse` guard (i.e., in the success branch),
cast the response data to the new `TokenResponse` type and add a runtime guard:

```ts
import type { TokenResponse } from "../types/auth.types";

// In the success branch, after the error check:
const tokenData = normalizedTokenResponse.data as TokenResponse;

// Runtime guard — protects against unexpected empty/null access token
if (!tokenData.accessToken || typeof tokenData.accessToken !== "string") {
  logger.error(observabilityEvents.authLoginFailed, {
    module: "auth",
    action: "login",
    status: 200,
    issue: "missing-access-token"
  });

  return createErrorResponse({
    detail: "Authentication response was incomplete. Please try again.",
    status: 502,
    title: "Upstream Error",
    clearAuthCookies: true,
    event: observabilityEvents.authLoginFailed,
    logLevel: "error"
  });
}
```

**Validation step:**
- TypeScript no longer uses implicit `any` when accessing `normalizedTokenResponse.data.accessToken`
- Compilation passes without `@ts-ignore` suppressions
- The runtime guard triggers a 502 if `accessToken` is missing

**Architecture note:** Never access fields from untyped API responses — use the generated types via `packages/api-client`.

---

### P2-T3 — Implement Token Cookie Strategy (Strategy A/B)

| Field | Value |
|---|---|
| **Task ID** | `P2-T3` |
| **File** | `apps/admin/src/features/auth/server/login.handler.ts` |
| **Layer** | server |
| **Gap addressed** | GAP-01, GAP-08 |
| **Depends on** | P0-T3 (confirmed strategy), P2-T2 |

**What to do:**

Replace the current success path (which only forwards `Set-Cookie` headers) with the
dual-strategy approach. This is the most critical change in the entire plan.

Replace the current success response block:

```ts
// REMOVE (current implementation — breaks if backend sends JSON body only):
const response = NextResponse.json({ ok: true, redirectTo: postLoginRedirectRoute });
appendSetCookieHeaders(response, setCookieHeaders);
setSessionCookie(response);
return response;
```

With the following dual-strategy implementation:

```ts
// ADD — Dual-strategy token cookie establishment
const response = NextResponse.json({
  ok: true,
  redirectTo: postLoginRedirectRoute
});

if (setCookieHeaders.length > 0) {
  // Strategy A: Backend emits Set-Cookie headers — forward them unchanged
  appendSetCookieHeaders(response, setCookieHeaders);
} else {
  // Strategy B: Backend returns tokens in JSON body only — set HttpOnly cookies manually
  const accessCookieName = adminRuntimeEnv.accessCookieName || "accessToken";
  const refreshCookieName = adminRuntimeEnv.refreshCookieName || "refreshToken";

  const cookieBase = {
    httpOnly: true,
    secure: adminRuntimeEnv.cookieSecure,
    sameSite: adminRuntimeEnv.cookieSameSite as "lax" | "strict" | "none",
    domain: adminRuntimeEnv.cookieDomain || undefined,
    path: "/"
  } as const;

  response.cookies.set({
    ...cookieBase,
    name: accessCookieName,
    value: tokenData.accessToken,
    maxAge: tokenData.expiresIn  // seconds (e.g., 3600)
  });

  response.cookies.set({
    ...cookieBase,
    name: refreshCookieName,
    value: tokenData.refreshToken.token,
    expires: new Date(tokenData.refreshToken.expirationDate)
  });
}

setSessionCookie(response);
return response;
```

> 🔴 **CRITICAL NOTE:** The strategy used (A or B) must match the confirmed outcome of
> `P0-T3`. If Strategy A is confirmed, the `else` branch is a safe no-op. If Strategy B
> is confirmed (expected), the `if` branch is the no-op. Both branches must remain in
> the code to gracefully handle either backend configuration.

**Validation step:**
- On successful login (manual smoke test with running backend):
  - Browser devtools show `Set-Cookie` response headers for `accessToken`, `refreshToken`, `cafedebug_admin_session`
  - All three cookies have `HttpOnly` flag set
  - `accessToken` cookie has `Max-Age: 3600`
  - `refreshToken` cookie has an `Expires` date in the future
  - After redirect to `/episodes`, subsequent API calls succeed (no 401)
- Acceptance criterion AC-05 and AC-13 satisfied

**Architecture note:**
- Cookie security settings come exclusively from `adminRuntimeEnv` — never hardcoded
- `setSessionCookie` must always be called AFTER token cookies to avoid partial state
- This change does NOT modify `next-response-cookies.ts` — it uses the existing cookie API directly on the `NextResponse` instance

---

### P2-T4 — Audit Duplicate Observability Logging

| Field | Value |
|---|---|
| **Task ID** | `P2-T4` |
| **File** | `apps/admin/src/features/auth/hooks/use-login.ts` (possible modification) |
| **Layer** | hook |
| **Gap addressed** | RISK-02 |
| **Depends on** | — |

**What to do:**

Review the `logger.warn(observabilityEvents.authLoginFailed, ...)` call in `use-login.ts`
(inside the `result.error.kind !== "transport"` branch).

Context already logged by the handler (server-side):
- `module: "auth"`, `action: "login"`, `status`, `traceId`

Context logged by the hook (client-side):
- `module: "auth"`, `action: "login-form-submit"`, `status`, `traceId`

**Decision:** The two log entries carry different `action` values (`"login"` vs
`"login-form-submit"`), making them distinguishable. However, for a standard 401 failure,
the signal is the same event. Apply this rule:

- **Keep** the `addSentryBreadcrumb("Admin login form failed", ...)` call — it captures
  the client-side context (form submission trace) not available in the server log
- **Remove** the `logger.warn(observabilityEvents.authLoginFailed, ...)` call from the
  hook — the handler already emits this event with full server context
- **Keep** the `logger.error` + `captureException` for transport errors — these are
  client-initiated and not visible to the server

Add a comment explaining the decision:

```ts
// NOTE: authLoginFailed is already logged by loginHandler on the server.
// We emit only the Sentry breadcrumb here to capture the client-side form context.
// Avoid double-logging the same event with logger.warn.
```

**Validation step:**
- A single 401 login attempt produces exactly ONE `authLoginFailed` log entry (server-side)
- A Sentry breadcrumb is still emitted from the hook
- `captureException` is still called for transport errors

**Architecture note:** Server-side observability is authoritative for API errors. Client-side hooks should emit breadcrumbs and capture transport exceptions only.

---

### ✅ Phase 2 Validation Checkpoint

- `pnpm gate:quality` passes
- Handler success branch uses typed `TokenResponse`
- Dead `isSuccess` block is removed
- Both cookie strategies (A and B) are present in the handler
- No duplicate `authLoginFailed` log entry on a single failure

---

## Phase 3 — Service and Hook Alignment

> **Goal:** Ensure `loginService` propagates the `type` field from the updated error
> schema, and `useLogin` is correctly wired to surface all error states.

---

### P3-T1 — Propagate `type` Field in `loginService`

| Field | Value |
|---|---|
| **Task ID** | `P3-T1` |
| **File** | `apps/admin/src/features/auth/services/login.service.ts` |
| **Layer** | service |
| **Gap addressed** | GAP-06 (service layer) |
| **Depends on** | P1-T4, P1-T5 |

**What to do:**

In the error branch of `loginService`, extract and propagate the `type` field from the
parsed error envelope:

```ts
// In the !response.ok branch, update the return statement:
return {
  ok: false,
  error: {
    kind: "response",
    detail:
      errorPayload?.detail ??
      "Unable to sign in. Check your credentials and try again.",
    status: errorPayload?.status ?? response.status,
    title: errorPayload?.title ?? "Authentication Failed",
    ...(errorPayload?.type ? { type: errorPayload.type } : {}),       // ← ADD
    ...(errorPayload?.traceId ? { traceId: errorPayload.traceId } : {}),
    ...(errorPayload?.fieldErrors
      ? { fieldErrors: errorPayload.fieldErrors }
      : {})
  }
};
```

Confirm that `LoginServiceFailureResult.error` already carries `type?: string` via the
`AuthErrorEnvelope` base type in `auth.types.ts`. No type change is needed — `AuthErrorEnvelope`
already has `type?: string`.

**Validation step:**
- A mock 401 response with `type: "https://..."` in the body is correctly parsed and
  propagated to `LoginServiceFailureResult.error.type`
- TypeScript compilation passes
- Acceptance criterion AC-12 satisfied

**Architecture note:** Services are responsible for parsing response shapes — they must not drop fields. All fields from `loginErrorResponseSchema` must flow through to the result type.

---

### P3-T2 — Verify `useLogin` Handles All Error Scenarios Correctly

| Field | Value |
|---|---|
| **Task ID** | `P3-T2` |
| **File** | `apps/admin/src/features/auth/hooks/use-login.ts` |
| **Layer** | hook |
| **Gap addressed** | — (correctness verification) |
| **Depends on** | P3-T1, P2-T4 |

**What to do:**

Review `use-login.ts` against the full error scenario matrix from the spec.

For each scenario, confirm the hook behavior:

| Scenario | Expected hook action |
|---|---|
| `result.ok = true` | `router.replace(redirectTo)` + `router.refresh()` |
| `result.ok = false`, `kind: "transport"` | `logger.error` + `captureException` + `setFormError(detail)` |
| `result.ok = false`, `kind: "response"`, has `fieldErrors.email` | `form.setError("email", ...)` |
| `result.ok = false`, `kind: "response"`, has `fieldErrors.password` | `form.setError("password", ...)` |
| `result.ok = false`, `kind: "response"`, 401 | `setFormError(detail)` (no field errors) |
| Client validation failure | `setFormError("Please review the highlighted fields.")` |

Confirm `setFormError(undefined)` is called at the start of every submission.

No code changes are expected unless a gap is found during review. If changes are needed,
document them explicitly before modifying the file.

**Validation step:**
- All six scenarios confirmed via code review
- `setFormError(undefined)` call present at submission start
- `form.setError` is only called when `fieldErrors` contains the corresponding key

**Architecture note:** Hooks orchestrate — they do not validate business rules. All validation lives in `schemas/`.

---

### ✅ Phase 3 Validation Checkpoint

- `pnpm gate:quality` passes
- `loginService` propagates `type` field in error results
- `useLogin` correctly handles all five error scenarios

---

## Phase 4 — Component and UI Alignment

> **Goal:** Address the "Remember Me" accessibility concern (GAP-07) and confirm the
> component surfaces all error states correctly with design token compliance.

---

### P4-T1 — Remove "Remember Me" Checkbox

| Field | Value |
|---|---|
| **Task ID** | `P4-T1` |
| **File** | `apps/admin/src/features/auth/components/login-form.tsx` |
| **Layer** | component |
| **Gap addressed** | GAP-07 |
| **Depends on** | — |

**What to do:**

Remove the "Remember me" checkbox and its associated label from `login-form.tsx`. This
interactive element has no wired behavior and creates an accessibility trust gap.

Replace the current "Remember me + Forgot Password row" block:

```tsx
{/* Remember me + Forgot Password row */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <input
      id="remember-me"
      name="remember-me"
      type="checkbox"
      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-focus-ring"
    />
    <label htmlFor="remember-me" className="text-sm text-on-surface-variant">
      Remember me
    </label>
  </div>
  {/* TODO: Forgot Password — requires backend password reset flow (out of scope V1) */}
  <a
    href="#"
    className="text-sm font-medium text-primary transition-colors hover:text-primary-strong"
  >
    Forgot Password?
  </a>
</div>
```

With the reduced version (checkbox removed, Forgot Password link retained):

```tsx
{/* TODO: Remember Me — requires backend session duration support (out of scope V1) */}
<div className="flex items-center justify-end">
  {/* TODO: Forgot Password — requires backend password reset flow (out of scope V1) */}
  <a
    href="#"
    className="text-sm font-medium text-primary transition-colors hover:text-primary-strong"
  >
    Forgot Password?
  </a>
</div>
```

**Validation step:**
- No `<input type="checkbox" name="remember-me">` exists in the rendered output
- No RHF `register("remember-me")` call exists anywhere in the hook or form
- The "Forgot Password?" link is still present
- The TODO comment is present at the removal site
- Accessibility: no interactive element without behavior

**Architecture note:** Components must not render interactive elements without wired behavior. Decorative UI elements that imply user action are an accessibility violation.

---

### P4-T2 — Verify Design Token Compliance in `login-form.tsx`

| Field | Value |
|---|---|
| **Task ID** | `P4-T2` |
| **File** | `apps/admin/src/features/auth/components/login-form.tsx` |
| **Layer** | component |
| **Gap addressed** | — (compliance verification) |
| **Depends on** | P4-T1 |

**What to do:**

Audit every Tailwind class in `login-form.tsx` for hardcoded color values.

**Prohibited patterns (must not appear):**
- Raw Tailwind color scale: `text-red-500`, `bg-orange-500`, `border-gray-300`
- Hex values: `text-[#ff0000]`, `bg-[#1a1a1a]`
- Opacity modifiers on raw colors: `bg-red-500/10`

**Required patterns (must use):**
- Design token aliases: `text-danger`, `bg-primary`, `text-on-surface`, `border-outline-variant`
- Token opacity modifiers: `text-on-surface-variant/50`, `bg-danger/10`

**Accessibility audit (simultaneous):**

Confirm the following ARIA attributes are correctly wired:
- `aria-describedby={errors.email ? "email-error" : undefined}` on the email `<input>`
- `aria-describedby={errors.password ? "password-error" : undefined}` on the password `<input>`
- `role="alert"` on the `formError` error banner
- `role="status"` on the `initialStatusMessage` paragraph
- `aria-busy={isSubmitting}` on the submit button

No code changes are expected if the current implementation is compliant. Document any
violations found and fix them before proceeding.

**Validation step:**
- Zero hardcoded color values in `login-form.tsx`
- All five ARIA attributes confirmed present and conditional
- `pnpm lint` passes with no warnings

**Architecture note:** Visual values come from `packages/design-tokens` CSS variables mapped as Tailwind aliases. Components must never own color decisions.

---

### P4-T3 — Validate All Error UI States Render Correctly

| Field | Value |
|---|---|
| **Task ID** | `P4-T3` |
| **File** | `apps/admin/src/features/auth/components/login-form.tsx` (read-only verification) |
| **Layer** | component |
| **Gap addressed** | — (end-to-end scenario verification) |
| **Depends on** | P4-T1, P4-T2, P3-T2 |

**What to do:**

Manually or via test (Vitest + React Testing Library + MSW) trigger each scenario and
confirm the component renders the correct UI state:

| Scenario | Input | Expected UI |
|---|---|---|
| Empty submission | Click Sign In with empty fields | Email error below field + Password error below field + "Please review the highlighted fields." form banner |
| Invalid email format | Submit `notanemail` + `validpass123` | Email field error: "Please enter a valid email address." |
| Short password | Submit `admin@example.com` + `short` | Password field error: "Password must be at least 8 characters." |
| 401 Unauthorized | Submit wrong credentials | Form banner (role=alert): "User not found or invalid credentials." |
| 503 Transport error | Simulate network failure | Form banner (role=alert): "Unable to reach the authentication service. Please try again." |
| Submitting state | Form submission in progress | Button text "Signing in...", inputs disabled, "Validating session..." status text |

**Validation step:**
- All six scenarios produce the expected UI without JavaScript errors in the console
- No hardcoded test data left in production code
- `formError` clears between submission attempts

---

### ✅ Phase 4 Validation Checkpoint

- "Remember Me" checkbox removed from the DOM
- Zero hardcoded colors in `login-form.tsx`
- All five ARIA attributes confirmed
- All six error scenarios render correctly

---

## Phase 5 — Validation and Quality Gates

> **Goal:** Run all automated gates, perform a manual smoke test against the running
> backend, and confirm the login feature satisfies all acceptance criteria.

---

### P5-T1 — Run `pnpm gate:quality`

| Field | Value |
|---|---|
| **Task ID** | `P5-T1` |
| **File** | All modified files (no new modifications) |
| **Layer** | infrastructure |
| **Gap addressed** | — (final quality gate) |
| **Depends on** | All prior tasks |

**What to do:**

Run the quality gate from the monorepo root:

```bash
pnpm gate:quality
```

This runs `lint`, `typecheck`, and `build` across all workspaces in parallel via Turborepo.

If any step fails:
- **Lint failure:** Address ESLint warnings/errors in the reported file before proceeding
- **Typecheck failure:** Fix TypeScript errors — do NOT suppress with `@ts-ignore`
- **Build failure:** Resolve compilation or import errors

**Validation step:**
- `pnpm gate:quality` exits with code `0`
- Zero TypeScript errors
- Zero ESLint errors
- Build artifacts produced successfully

---

### P5-T2 — Run `pnpm gate:contract` (Final Verification)

| Field | Value |
|---|---|
| **Task ID** | `P5-T2` |
| **File** | `packages/api-client/src/generated/schema.ts` (verified) |
| **Layer** | infrastructure |
| **Gap addressed** | RISK-01 (final) |
| **Depends on** | P5-T1 |

**What to do:**

Run the contract gate a final time to confirm no drift occurred during implementation:

```bash
pnpm gate:contract
```

**Validation step:**
- `pnpm gate:contract` exits with code `0`
- The generated schema has not diverged from the backend contract

---

### P5-T3 — Manual Smoke Test: Login Flow

| Field | Value |
|---|---|
| **Task ID** | `P5-T3` |
| **File** | — (runtime verification) |
| **Layer** | — |
| **Gap addressed** | AC-01 through AC-15 |
| **Depends on** | P5-T1, P5-T2 |

**What to do:**

With both the admin app and backend API running locally, execute these manual scenarios:

**Scenario 1 — Happy Path (AC-01, AC-05, AC-13)**
1. Navigate to `/login`
2. Enter valid admin credentials
3. Click "Sign In"
4. Confirm:
   - Redirect to `/episodes`
   - Browser cookies contain `cafedebug_admin_session`, `accessToken`, `refreshToken`
   - All three are HttpOnly (not readable via `document.cookie`)
   - `accessToken` cookie has `Max-Age=3600` (or configured value)

**Scenario 2 — Client Validation (AC-02, AC-14, AC-15)**
1. Submit with empty fields → field errors shown, no HTTP call
2. Submit with `notanemail` → "Please enter a valid email address." under email field
3. Submit with 5-char password → "Password must be at least 8 characters." under password field

**Scenario 3 — 401 Invalid Credentials (AC-03, AC-06)**
1. Submit with wrong password
2. Confirm: form banner shows "User not found or invalid credentials."
3. Confirm: no stale auth cookies remain in browser

**Scenario 4 — Network/Transport Error (AC-04)**
1. Stop the backend API
2. Submit valid credentials
3. Confirm: form banner shows "Unable to reach the authentication service. Please try again."

**Scenario 5 — Architecture Compliance (AC-07, AC-08, AC-10)**
1. Inspect `app/api/auth/login/route.ts` — confirm ≤ 6 lines, delegator only
2. Inspect `login-form.tsx` and `use-login.ts` — confirm no `fetch()` calls
3. Confirm handler uses `adminApiClient.auth.token()` for the backend call

**Validation step:**
- All 5 scenarios pass
- All 15 acceptance criteria (AC-01 through AC-15) confirmed

---

### ✅ Phase 5 Validation Checkpoint (Definition of Done)

The login feature is **complete** when ALL of the following are true:

- [ ] `pnpm gate:contract` passes (RISK-01 closed)
- [ ] `pnpm gate:quality` passes (lint + typecheck + build)
- [ ] `TokenResponse` and `RefreshTokenPayload` are exported from `auth.types.ts` (GAP-03)
- [ ] `loginSchema` validates email format and password minimum length (GAP-04, GAP-05)
- [ ] `loginErrorResponseSchema` parses the `type` field (GAP-09)
- [ ] `NormalizedApiError` includes `type?: string` (GAP-06)
- [ ] Dead `isSuccess` check is removed from the handler (GAP-02)
- [ ] Handler implements dual-strategy token cookie logic (GAP-01)
- [ ] Token strategy confirmed from Phase 0 and aligned with implementation (GAP-08)
- [ ] `loginService` propagates the `type` field in error results
- [ ] "Remember Me" checkbox is removed; TODO comment is present (GAP-07)
- [ ] No hardcoded colors in `login-form.tsx`
- [ ] All ARIA attributes wired correctly on the form
- [ ] All 15 acceptance criteria verified in the smoke test

---

## Gap Resolution Index

| Gap ID | Severity | Resolved In | Task(s) |
|---|---|---|---|
| **GAP-01** | 🔴 Critical | Phase 2 | `P2-T3` — dual-strategy cookie implementation |
| **GAP-02** | 🟡 Medium | Phase 2 | `P2-T1` — remove dead `isSuccess` check |
| **GAP-03** | 🟡 Medium | Phase 1 + 2 | `P1-T1` (type definition) + `P2-T2` (typed handler guard) |
| **GAP-04** | 🟡 Medium | Phase 1 | `P1-T2` — email `.email()` validation |
| **GAP-05** | 🟡 Medium | Phase 1 | `P1-T3` — password `min(8)` validation |
| **GAP-06** | 🟢 Low | Phase 1 + 3 | `P1-T5` (api-client) + `P3-T1` (service propagation) |
| **GAP-07** | 🟢 Low | Phase 4 | `P4-T1` — remove checkbox, add TODO |
| **GAP-08** | 🔴 Critical | Phase 0 | `P0-T2` (verify) + `P0-T3` (document) → unblocks `P2-T3` |
| **GAP-09** | 🟢 Low | Phase 1 | `P1-T4` — add `type` to `loginErrorResponseSchema` |
| **RISK-01** | 🟡 Medium | Phase 0 + 5 | `P0-T1` (initial) + `P5-T2` (final) |
| **RISK-02** | 🟢 Low | Phase 2 | `P2-T4` — remove duplicate `logger.warn` from hook |

---

## File Change Summary

| File | Phase | Tasks | Type |
|---|---|---|---|
| `apps/admin/src/features/auth/types/auth.types.ts` | 1 | P1-T1 | Addition |
| `apps/admin/src/features/auth/schemas/login.schema.ts` | 1 | P1-T2, P1-T3, P1-T4 | Modification |
| `packages/api-client/src/errors.ts` | 1 | P1-T5 | Modification |
| `apps/admin/src/features/auth/server/login.handler.ts` | 2 | P2-T1, P2-T2, P2-T3 | Modification |
| `apps/admin/src/features/auth/hooks/use-login.ts` | 2, 3 | P2-T4, P3-T2 | Modification |
| `apps/admin/src/features/auth/services/login.service.ts` | 3 | P3-T1 | Modification |
| `apps/admin/src/features/auth/components/login-form.tsx` | 4 | P4-T1, P4-T2, P4-T3 | Modification |
| `apps/admin/src/app/api/auth/login/route.ts` | 5 | P5-T3 (verify only) | Verification |
| `.specs/admin/login/design.md` | 0 | P0-T3 | Documentation update |

**Files confirmed unchanged (verification only):**
- `apps/admin/src/lib/auth/next-response-cookies.ts` — existing cookie helpers are sufficient
- `apps/admin/src/lib/auth/session-constants.ts` — `knownAuthCookieNames` already covers known token names
- `apps/admin/src/lib/env.ts` — `accessCookieName` and `refreshCookieName` already exposed

---

## Open Decisions Requiring Human Input

The following decisions must be confirmed before implementation begins:

| ID | Decision | Owner | Blocking |
|---|---|---|---|
| **OD-01** | Password minimum length: is `8` characters the correct value aligned with the backend's actual enforcement? | Backend team | `P1-T3` |
| **OD-02** | Token strategy confirmation (Strategy A vs B): verified via `P0-T2` curl test against a running backend | Developer / Backend team | `P2-T3` |
| **OD-03** | "Remember Me" V1 decision: confirmed as **remove** (decorative, no backend support). If requirements change, this reopens `P4-T1` | Product | `P4-T1` |

> OD-01 and OD-02 are the only decisions that can delay implementation. OD-03 is already
> resolved in the spec as "remove for V1."

---

## Architecture Compliance Summary

Every task in this plan enforces the following invariants:

| Rule | Enforced by |
|---|---|
| `app/api/auth/login/route.ts` stays thin (delegator only) | `P5-T3` verification |
| No `fetch()` inside components or hooks | `P5-T3` verification |
| No business logic in `app/` | Architecture enforced throughout — no app-layer tasks |
| All logic in `features/auth/` subdirectories | All tasks target `features/auth/*` |
| `packages/api-client` used exclusively — no handwritten HTTP | `P2-T3` uses `adminApiClient.auth.token()` |
| Design tokens only — no hardcoded colors | `P4-T2` verification |
| React Hook Form + Zod for forms | Maintained — no changes to RHF wiring |
| Cookie security settings from `adminRuntimeEnv` | `P2-T3` uses `adminRuntimeEnv.cookieSecure`, `.cookieSameSite`, `.cookieDomain` |
