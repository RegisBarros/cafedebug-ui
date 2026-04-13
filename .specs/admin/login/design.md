# Design: Admin Login Feature

| Field | Value |
|---|---|
| **Status** | `Implemented` |
| **Approved by** | The Debugger (⚠️ APPROVED WITH NOTES) |
| **Domain** | `admin/auth` |
| **Spec** | `.specs/admin/login/spec.md` |
| **API endpoint** | `POST /api/v1/admin/auth/token` |

---

## 1. Full Data Flow

```
Browser (LoginForm)
  │ onSubmit (RHF handleSubmit)
  │
  ▼
useLogin (hook)
  │ calls loginService(payload)
  │
  ▼
loginService (service)
  │ POST /api/auth/login  (internal Next.js route)
  │ { email, password }
  │
  ▼
app/api/auth/login/route.ts  (thin delegator)
  │ loginHandler(request)
  │
  ▼
loginHandler (server)
  │ 1. parseBody → 400 if invalid JSON
  │ 2. loginSchema.safeParse → 400 + fieldErrors if invalid
  │ 3. check adminRuntimeEnv.apiBaseUrl → 500 if missing
  │ 4. adminApiClient.auth.token({ body: { email, password } })
  │
  ▼
Backend API
  POST /api/v1/admin/auth/token
  │
  ├── 200 OK → { accessToken, refreshToken, tokenType, expiresIn }
  │     │
  │     ▼
  │   loginHandler
  │     extractSetCookieHeaders(response)
  │     IF setCookieHeaders.length > 0:
  │       appendSetCookieHeaders(nextResponse, setCookieHeaders)
  │     ELSE (Strategy B — JSON body):
  │       setAccessTokenCookie(accessToken, expiresIn)
  │       setRefreshTokenCookie(refreshToken.token, refreshToken.expirationDate)
  │     setSessionCookie(cafedebug_admin_session)
  │     return NextResponse.json({ ok: true, redirectTo: "/episodes" })
  │
  │   Subsequent server-side admin proxy calls:
  │     read accessToken from HttpOnly cookie
  │     translate it to Authorization: Bearer <JWT>
  │     call protected backend admin endpoints
  │
  ├── 401 Unauthorized → { type, title, status, detail }
  │     normalizeApiError → { status: 401, title, detail, type? }
  │     createErrorResponse(401) + clearKnownAuthCookies
  │     return NextResponse.json({ ok: false, error: {...} }, { status: 401 })
  │
  └── Network error → catch → createErrorResponse(503) + captureException
        return NextResponse.json({ ok: false, error: {...} }, { status: 503 })
  │
  ▼
loginService
  IF response.ok:
    parse loginSuccessResponseSchema
    return { ok: true, redirectTo }
  ELSE:
    parse loginErrorResponseSchema
    return { ok: false, error: { kind: "response"|"transport", ... } }
  │
  ▼
useLogin
  IF result.ok:
    router.replace(redirectTo)
    router.refresh()
  ELSE:
    IF fieldErrors.email → form.setError("email", ...)
    IF fieldErrors.password → form.setError("password", ...)
    IF kind === "transport" → captureException + logger.error
    setFormError(result.error.detail)
  │
  ▼
LoginForm
  renders formError banner (role="alert")
  renders field errors via RHF formState.errors
  disables form while isSubmitting
```

---

## 2. Component Structure and Responsibilities

### `apps/admin/src/features/auth/`

| Path | Type | Responsibility |
|---|---|---|
| `components/login-form.tsx` | Client Component | Renders the login card UI; delegates all state to `useLogin`; no logic beyond presentation |
| `hooks/use-login.ts` | Client Hook | Orchestrates form state (RHF), calls `loginService`, handles result routing, sets form/field errors |
| `services/login.service.ts` | Client Service | Makes `fetch` call to `/api/auth/login`; parses response; returns `LoginServiceResult` |
| `server/login.handler.ts` | Server Handler | Validates request, calls backend API, handles all response cases, manages cookies |
| `schemas/login.schema.ts` | Schema | Zod validation for the login form (`loginSchema`) and API response shapes |
| `types/auth.types.ts` | Types | Domain types for the login flow |
| `errors/createErrorResponse.ts` | Utility | Builds standardized `NextResponse` error envelopes |

### `apps/admin/src/app/`

| Path | Type | Responsibility |
|---|---|---|
| `app/(auth)/login/page.tsx` | Page (Server) | Renders `<LoginForm />` — routing only |
| `app/api/auth/login/route.ts` | Route Handler | Thin delegator: `loginHandler(request)` — no logic |

---

## 3. API Contract Alignment

### Request (Handler → Backend)

| Frontend field | Backend field | Source |
|---|---|---|
| `parsedBody.data.email` | `email` | `loginSchema` field, from `LoginRequest.email` |
| `parsedBody.data.password` | `password` | `loginSchema` field, from `LoginRequest.password` |

### Success Response (Backend → Handler)

| Backend field | Type | Frontend mapping |
|---|---|---|
| `accessToken` | `string` (JWT) | Stored as HttpOnly cookie `accessToken` (or forwarded via Set-Cookie), then translated server-side into `Authorization: Bearer <JWT>` for protected admin backend calls |
| `refreshToken.token` | `string` | Stored as HttpOnly cookie `refreshToken` (or forwarded via Set-Cookie) |
| `refreshToken.expirationDate` | `string` (ISO 8601 UTC) | Used as `expires` on the refresh token cookie |
| `tokenType` | `"Bearer"` | Not stored — informational only |
| `expiresIn` | `number` (seconds, 3600) | Used as `maxAge` on the access token cookie |

**Required type additions to `auth.types.ts`:**

```ts
export type RefreshTokenPayload = {
  token: string;
  expirationDate: string; // ISO 8601 UTC
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: RefreshTokenPayload;
  tokenType: "Bearer";
  expiresIn: number; // seconds
};
```

### Error Response (Backend → Handler, 401)

| Backend field | Type | Frontend mapping |
|---|---|---|
| `type` | `string` (URI) | `AuthErrorEnvelope.type` (currently lost — see GAP-06) |
| `title` | `string` | `AuthErrorEnvelope.title` |
| `status` | `number` | `AuthErrorEnvelope.status` |
| `detail` | `string` | `AuthErrorEnvelope.detail` — shown in `formError` |

### Internal Success Envelope (Handler → Service)

```json
{ "ok": true, "redirectTo": "/episodes" }
```

### Internal Error Envelope (Handler → Service)

```json
{
  "ok": false,
  "error": {
    "status": 401,
    "title": "Unauthorized",
    "detail": "User not found or invalid credentials.",
    "type": "https://tools.ietf.org/html/rfc7235#section-3.1"
  }
}
```

---

## 4. State Management

### Form State (managed by React Hook Form)

| State | Type | Source |
|---|---|---|
| `email` | `string` | RHF field, default `""` |
| `password` | `string` | RHF field, default `""` |
| `errors.email` | `FieldError \| undefined` | Zod (client) or server field error |
| `errors.password` | `FieldError \| undefined` | Zod (client) or server field error |
| `isSubmitting` | `boolean` | RHF — true during async `onSubmit` |

### Hook State (managed by `useLogin`)

| State | Type | Initial | Description |
|---|---|---|---|
| `formError` | `string \| undefined` | `undefined` | Top-level form error message (banner) |

### State Transitions

```
Initial
  │ user types → RHF tracks field values
  ▼
isSubmitting = true (form.handleSubmit called)
  │
  ├── Client validation fails
  │     isSubmitting = false
  │     formError = "Please review the highlighted fields."
  │     errors.email / errors.password set
  │
  └── Client validation passes → loginService called
        │
        ├── result.ok = true
        │     isSubmitting = false (router.replace navigates away)
        │
        └── result.ok = false
              isSubmitting = false
              IF fieldErrors: form.setError("email"|"password")
              formError = result.error.detail
```

### Form Reset Behaviour

- `formError` is cleared at the start of each submission attempt: `setFormError(undefined)`
- Field errors set via `form.setError` persist until the user modifies the field

---

## 5. Cookie and Session Strategy

### After a Successful Login

The handler must establish three things:

1. **Access token** — enables server-side API calls on behalf of the user
2. **Refresh token** — enables session renewal without re-authentication
3. **Session signal** — enables the middleware to detect an active session efficiently

### Strategy B (Recommended — JSON Body Token Extraction)

> ✅ **CONFIRMED (Phase 0):** Strategy B — Backend returns tokens in JSON body only.
> No `Set-Cookie` headers are emitted by the backend.
> The generated OpenAPI schema (`components["schemas"]["Result"]`) only contains
> `isSuccess`, `error`, and `isFailure` — the token payload (`accessToken`,
> `refreshToken`, `tokenType`, `expiresIn`) is not captured in the schema, confirming
> the backend sends all token data in the response body.
> Implementation must extract `accessToken` and `refreshToken.token` from the JSON body.

Since the API contract shows tokens in the JSON response body (not `Set-Cookie`), the
handler must manually set token cookies:

```ts
// After confirming success in loginHandler:
const tokenData = normalizedTokenResponse.data as TokenResponse;

// Access token cookie
response.cookies.set({
  name: adminRuntimeEnv.accessCookieName || "accessToken",
  value: tokenData.accessToken,
  httpOnly: true,
  secure: adminRuntimeEnv.cookieSecure,
  sameSite: adminRuntimeEnv.cookieSameSite,
  domain: adminRuntimeEnv.cookieDomain || undefined,
  path: "/",
  maxAge: tokenData.expiresIn  // 3600 seconds
});

// Refresh token cookie
response.cookies.set({
  name: adminRuntimeEnv.refreshCookieName || "refreshToken",
  value: tokenData.refreshToken.token,
  httpOnly: true,
  secure: adminRuntimeEnv.cookieSecure,
  sameSite: adminRuntimeEnv.cookieSameSite,
  domain: adminRuntimeEnv.cookieDomain || undefined,
  path: "/",
  expires: new Date(tokenData.refreshToken.expirationDate)
});
```

### Strategy A (Backend-Managed Cookies)

If it is confirmed that the backend also emits `Set-Cookie` headers alongside the JSON
body, the existing `appendSetCookieHeaders` mechanism is sufficient and Strategy B is not
needed. This must be verified before implementation.

**Decision rule:**
```
IF extractSetCookieHeaders(response).length > 0
  → use Strategy A (forward Set-Cookie headers)
ELSE
  → use Strategy B (extract from JSON body)
```

### Session Signal Cookie

Always set after successful token establishment:

```ts
// cafedebug_admin_session=active; httpOnly; maxAge=28800 (8h)
setSessionCookie(response);
```

This cookie is what the middleware reads (`hasSessionSignalCookie`) to quickly determine
whether to attempt session validation. It is independent of the actual auth tokens.

### Cookie-to-Bearer Translation for Backend Calls

Protected admin backend calls stay server-side. The auth helper reads the incoming cookie header, resolves the access token from the known access-cookie names, and builds an Authorization bearer header for protected backend requests. Resource requests send only the bearer header. Refresh requests use body-token exchange (`{ refreshToken }`) and do not forward auth cookies or bearer auth to the backend. After refresh rotation, the session probe retry rebuilds the bearer header from the refreshed token payload before calling the backend again.

### Cookie Security Settings

Controlled by `adminRuntimeEnv`:

| Setting | Env var | Dev default | Prod requirement |
|---|---|---|---|
| `secure` | `ADMIN_COOKIE_SECURE` | `false` | `true` |
| `sameSite` | `ADMIN_COOKIE_SAMESITE` | `"Lax"` | `"Lax"` or `"Strict"` |
| `domain` | `ADMIN_COOKIE_DOMAIN` | `localhost` | production domain |

All auth cookies must use `httpOnly: true` without exception.

---

## 6. Error Handling Strategy

### By HTTP Status

| Status | Source | Handler Action | Service Result | Hook Action |
|---|---|---|---|---|
| `400` (body parse) | Handler | `createErrorResponse(400, "Bad Request")` | `{ ok: false, error: { kind: "response", status: 400 } }` | `setFormError(detail)` |
| `400` (schema) | Handler | `createErrorResponse(400, "Validation Failed", fieldErrors)` | `{ ok: false, error: { ..., fieldErrors } }` | `form.setError` per field |
| `401` | Backend | `createErrorResponse(401, "Unauthorized") + clearKnownAuthCookies` | `{ ok: false, error: { kind: "response", status: 401 } }` | `setFormError(detail)` |
| `500` (config) | Handler | `createErrorResponse(500, "Configuration Error")` | `{ ok: false, error: { kind: "response", status: 500 } }` | `setFormError(detail)` |
| `503` | Network catch | `createErrorResponse(503) + captureException` | `{ ok: false, error: { kind: "transport", status: 503 } }` | `captureException + setFormError` |

### Error Envelope Shape (Internal Contract)

All error responses from `loginHandler` follow this shape:

```json
{
  "ok": false,
  "error": {
    "status": 401,
    "title": "Unauthorized",
    "detail": "User not found or invalid credentials.",
    "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
    "traceId": "optional-correlation-id",
    "fieldErrors": { "email": ["message"] }
  }
}
```

Fields `type`, `traceId`, and `fieldErrors` are optional and omitted when not applicable.

### Error Display in the UI

```
LoginForm
  │
  ├── formError (top-level) → <div role="alert" class="...danger...">
  │     Shows: detail string from the error result
  │     Examples:
  │       "User not found or invalid credentials."
  │       "Unable to reach the authentication service. Please try again."
  │       "Please review the highlighted fields."
  │
  └── Field errors (per-field) → <p id="email-error" class="text-danger">
        Sourced from: RHF formState.errors[fieldName].message
        Set by: form.setError("email"|"password", { type: "server", message })
```

### Status Message Banner

A separate `initialStatusMessage` (from URL `?reason=` param) is shown above the error
banner when redirected from a protected route:

| `reason` query param | Message shown |
|---|---|
| `session-required` | "Please sign in to access the admin area." |
| `session-expired` | "Your session expired. Sign in again to continue." |
| `session-check-failed` | "We couldn't validate your session. Sign in to continue." |

This is rendered by `resolveLoginStatusMessage` and is separate from `formError`.

---

## 7. Observability Events Reference

| Event | Where fired | Level |
|---|---|---|
| `authLoginValidationFailed` | Handler (schema fail), Hook (client validation fail) | `warn` |
| `authLoginFailed` | Handler (401/4xx from backend) | `warn` |
| `authLoginSuccess` | Handler (200 OK), Hook (success) | `info` |
| `authLoginServiceUnavailable` | Handler (catch, config missing), Hook (transport error) | `error` |
| `apiRequestFailed` | Handler (non-success from normalizedResponse) | `warn` |

Sentry:
- `addSentryBreadcrumb("Admin login attempt", ...)` — before backend call (handler)
- `addSentryBreadcrumb("Admin login success", ...)` — after success (handler)
- `addSentryBreadcrumb("Admin login form failed", ...)` — after service failure (hook)
- `captureException(error, ...)` — only on transport errors (handler catch + hook transport branch)
