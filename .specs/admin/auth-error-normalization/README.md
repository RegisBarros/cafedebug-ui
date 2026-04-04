# Spec: Auth Handler Error Normalization

| Field | Value |
|---|---|
| **Status** | Draft |
| **Domain** | `admin/auth` |
| **App** | `apps/admin` |
| **Related spec** | `.specs/admin/login-refactor/` (UI only — separate concern) |

---

## What This Spec Covers

The `login.handler.ts` file contains a private `createErrorResponse` closure that simultaneously builds a JSON response, orchestrates cookies, and emits observability events — three distinct responsibilities in one untestable function. Meanwhile, `refresh/route.ts` handles errors entirely inline, using a different discriminant key (`success` vs. `ok`) and omitting `status` from the error body. This spec addresses both problems: extracting `createErrorResponse` into a shared, importable module and enforcing a single error shape contract across all auth API routes.

---

## Why It Exists

Auth routes must be independently testable and consistent. Without a shared `createErrorResponse` module, every new auth route either re-implements error building inline or copies the private closure — both patterns accumulate drift. A dedicated `features/auth/errors/` module gives all auth handlers a single, typed entry point for error response construction, and a shared `AuthErrorPayload` type enforces the wire format at compile time.

---

## Document Map

| File | Purpose |
|---|---|
| `spec.md` | Problem statement, functional requirements, error contract, and acceptance criteria |
| `design.md` | Module structure, `createErrorResponse` TypeScript interface, type changes in `auth.types.ts`, and route-level changes to `refresh/route.ts` |
| `tasks.md` | Phased implementation plan assigned to Frontend Blacksmith, with per-task validation steps |

---

## Key Decisions

- **Option B chosen for `createErrorResponse`** — The function retains cookie orchestration (`appendSetCookieHeaders`, `clearKnownAuthCookies`) and structured logging (`logger[logLevel]`) internally, matching the FR-3 contract exactly. Testability is achieved through module-level imports that Jest can mock. A pure builder (Option A) is deferred until handler decomposition is in scope.
- **`LoginErrorPayload` preserved as an alias** — `auth.types.ts` introduces `AuthErrorEnvelope` and `AuthErrorPayload` as the canonical types while re-exporting `LoginErrorPayload = AuthErrorEnvelope` to avoid breaking `login.service.ts`.
- **`success` → `ok` rename in `refresh/route.ts`** — The `success` discriminant key is replaced with `ok` to unify the error shape across all auth routes. Clients may currently rely on `success`; the tasks include a search step to identify any callsites before renaming.
- **`status` added to `refresh/route.ts` error body** — The HTTP status code is now included inside the JSON error envelope (`error.status`), matching the contract established by `login.handler.ts` and required by FR-1.

---

## How to Extend

To add a new auth error type (e.g., a new `detail` variant for MFA failures), add a constant or helper in `features/auth/errors/` and pass it through the existing `AuthErrorPayload` fields — no changes to `createErrorResponse` itself are needed. To add `createErrorResponse` to a new auth route handler, import it from `@/features/auth/errors/createErrorResponse` and pass an `AuthErrorPayload`-conforming object; the function handles response construction, cookies, and logging internally.

---

## Planned Inline Documentation

Once the refactor is implemented, the following JSDoc block MUST be added immediately before `export async function loginHandler` in `apps/admin/src/features/auth/server/login.handler.ts`:

```ts
/**
 * Handles the admin login POST request.
 *
 * Responsibilities:
 * - Request body parsing and schema validation
 * - Backend token API call via adminApiClient
 * - Cookie orchestration (via lib/auth/next-response-cookies)
 * - Observability (inline — requires request/endpoint context)
 *
 * Error response building is delegated to:
 * @see features/auth/errors/createErrorResponse
 */
```

The comment is intentionally deferred — `features/auth/errors/createErrorResponse` does not yet exist. Adding it before the module is created would reference a non-existent path and mislead contributors.

---

## Related Specs

- **`.specs/admin/login-refactor/`** — UI-only login page redesign (Stitch theme alignment). Fully separate concern; no overlap with this spec.
