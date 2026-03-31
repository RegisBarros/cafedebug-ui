# Admin Login Architecture

## Purpose and scope

This document explains the completed admin login refactor in `apps/admin`.

It covers:

- the login feature structure
- layer ownership and boundaries
- canonical data flow
- safe extension guidance
- common pitfalls
- validation checks for reviews

It does not define new behavior. The implementation source of truth remains:

- `.specs/admin/auth-login-refactor.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`

## File structure

The login feature follows the required feature-based layout:

```text
apps/admin/src/features/auth/
  components/
    login-form.tsx
  hooks/
    use-login.ts
  services/
    login.service.ts
  server/
    login.handler.ts
  schemas/
    login.schema.ts
  types/
    auth.types.ts
```

Related route entrypoints are intentionally thin:

```text
apps/admin/src/app/(auth)/login/page.tsx
apps/admin/src/app/api/auth/login/route.ts
```

## Layer responsibilities

### components

- File: `apps/admin/src/features/auth/components/login-form.tsx`
- Responsibility: render the form UI, read hook state, display field/form errors.
- Must not: call `fetch`, backend clients, or cookie/session utilities.

### hooks

- File: `apps/admin/src/features/auth/hooks/use-login.ts`
- Responsibility: orchestrate submit lifecycle, map service errors to form errors, trigger redirect behavior.
- Must call: service layer only.

### services

- File: `apps/admin/src/features/auth/services/login.service.ts`
- Responsibility: call internal route `POST /api/auth/login`, parse/normalize response contracts.
- Must not: contain rendering logic.

### server

- File: `apps/admin/src/features/auth/server/login.handler.ts`
- Responsibility: validate input, call backend admin auth token endpoint, map backend response, apply auth cookie/session side effects.
- Must own: auth business orchestration for login.

### schemas

- File: `apps/admin/src/features/auth/schemas/login.schema.ts`
- Responsibility: define Zod validation and response parsing contracts used across client/server flow.

### types

- File: `apps/admin/src/features/auth/types/auth.types.ts`
- Responsibility: define login DTO/result/error contracts and field error shapes.

### app route and page boundaries

- `apps/admin/src/app/(auth)/login/page.tsx` is composition only.
- `apps/admin/src/app/api/auth/login/route.ts` delegates directly to feature server handler.
- No login business logic should live under `src/app`.

## Data flow explanation (UI -> hook -> service -> route -> server)

1. User submits credentials in `components/login-form.tsx`.
2. `hooks/use-login.ts` runs React Hook Form + Zod validation and handles async submission lifecycle.
3. `services/login.service.ts` sends the request to `POST /api/auth/login` and normalizes response payloads.
4. `app/api/auth/login/route.ts` delegates immediately to `server/login.handler.ts`.
5. `server/login.handler.ts` validates payload again with schema, calls backend admin auth token API through the shared client, maps outcomes, and applies session/cookie side effects.
6. Service returns typed success/failure result.
7. Hook updates UI state and redirects on success.

Delegation pattern used by the API route:

```ts
import { loginHandler } from "@/features/auth/server/login.handler";

export async function POST(request: Request) {
  return loginHandler(request);
}
```

## How to extend safely

Use this checklist when adding login-adjacent functionality (for example: MFA prompt, lockout messaging, alternative auth errors).

1. Start from feature layering.
Place UI in `components/`, orchestration in `hooks/`, client HTTP calls in `services/`, server orchestration in `server/`, validation in `schemas/`, and contracts in `types/`.

1. Keep `src/app` thin.
`page.tsx` should compose feature components only, and `app/api/*/route.ts` should delegate to a handler only.

1. Evolve contracts before behavior.
Update Zod schemas and types first, then service and handler mapping logic, and finally hook/component behavior.

1. Preserve stable user-facing outcomes.
Keep success redirect behavior consistent unless explicitly changing product behavior, and preserve actionable field-level errors for the UI.

1. Add focused tests at each layer.
Cover schema parsing, service response normalization, hook submit/error lifecycle, handler mapping with cookie/session side effects, and route delegation thinness.

## Common mistakes and how to avoid them

1. Direct network calls in UI components.
Mistake: calling `fetch` in `login-form.tsx`. Avoid by routing all requests through `services/login.service.ts`.

1. Business logic in route handlers.
Mistake: adding validation/mapping/orchestration in `app/api/auth/login/route.ts`. Avoid by keeping route files as thin delegators to `server/login.handler.ts`.

1. Duplicated validation logic.
Mistake: separate ad hoc validation in hook, service, and handler. Avoid by using `schemas/login.schema.ts` as the canonical validation contract.

1. Contract drift between layers.
Mistake: changing error/success payload shape in one layer only. Avoid by updating `types/auth.types.ts`, schema parsing, service mapping, and handler responses together.

1. Cookie/session side effects outside server boundary.
Mistake: handling auth cookies in client-side code. Avoid by keeping all cookie/session side effects in `server/login.handler.ts` and `src/lib/auth` infrastructure.

## Validation checklist

Use this in PR review for login changes.

- [ ] Login files remain inside `features/auth/{components,hooks,services,server,schemas,types}`.
- [ ] `app/(auth)/login/page.tsx` contains composition only.
- [ ] `app/api/auth/login/route.ts` contains thin delegation only.
- [ ] No direct `fetch` in login components.
- [ ] Hook orchestrates submit lifecycle and consumes service.
- [ ] Service owns internal route request and response normalization.
- [ ] Handler owns server orchestration, backend mapping, and cookie/session side effects.
- [ ] Zod schema is used for validation and parsing contracts.
- [ ] Types are centralized in `types/auth.types.ts`.
- [ ] Tests cover schema, service, hook, handler, and route delegation behavior.
