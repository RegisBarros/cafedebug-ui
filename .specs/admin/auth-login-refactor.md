# Admin Auth Login Refactor Specification

## 1) Summary

This specification defines a focused refactor of the admin login flow in `apps/admin` to enforce strict feature-based architecture boundaries.

Source of truth path: `.specs/admin/auth-login-refactor.md`.

This spec is scoped to login authentication only and aligns with:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `.github/instructions/nextjs-tailwind.instructions.md`

Documentation quality and structure should follow the `documentation-writer` skill in `.github/skills/documentation-writer/SKILL.md`.

## 2) Problem

Current login code works functionally, but architecture boundaries are inconsistent with strict feature-layer rules.

Observed issues:

- API route includes substantial business and orchestration logic instead of delegating to a feature server handler.
- Login component performs network calls directly (`fetch`) instead of using a feature hook + service.
- Client validation and server validation are not centralized in a single feature schema contract.
- Feature folder does not yet follow the target layered shape (`components`, `hooks`, `services`, `server`, `schemas`, `types`).
- Route-level code has too much responsibility for auth behavior, error mapping, and flow control.

Impact:

- Lower maintainability and testability.
- Harder to evolve auth flows consistently.
- Increased risk of duplicated logic and regressions.

## 3) Goals

- Enforce strict feature-based architecture for admin login.
- Keep `src/app` focused on routing and thin route handlers only.
- Move login business logic and orchestration to `src/features/auth/server`.
- Move client-side request logic to `src/features/auth/services`.
- Move UI orchestration and async state to `src/features/auth/hooks`.
- Centralize validation with feature schemas using Zod.
- Define explicit types for auth/login contracts in feature types.
- Preserve existing user-visible login behavior unless explicitly changed in this spec.

## 4) Non-Goals

- No redesign of login visual identity or design-token system.
- No expansion to forgot password, reset password, logout, refresh, or session routes beyond login touchpoints.
- No backend API contract changes.
- No RBAC or multi-role auth redesign.
- No monorepo-wide auth restructuring outside `apps/admin` login flow.

## 5) Architecture Definition (REQUIRED)

### 5.1 Layered File Structure Contract

All login-related code in `apps/admin` must follow:

```text
src/features/auth/
  components/
  hooks/
  services/
  server/
  schemas/
  types/
```

### 5.2 Layer Responsibilities

Components:

- Render UI and bind user interactions.
- Consume feature hooks.
- Must not call `fetch` or backend clients directly.

Hooks:

- Manage submission lifecycle, local interaction state, and mutation orchestration.
- Call services only.
- Expose typed UI-facing API for components.

Services:

- Perform client-side API calls to internal app routes.
- Normalize client-side response shape for hooks.
- No rendering logic.

Server:

- Own login business orchestration for route handlers.
- Validate request input with schemas.
- Call backend admin auth endpoint through shared API client.
- Map backend outcomes to stable HTTP + payload contract for app routes.
- Set/clear cookies and session side effects via auth/lib infrastructure.

Schemas:

- Define request and response validation schemas for login.
- Shared by server handler and client validation where appropriate.

Types:

- Define feature-level auth contracts (DTOs, result unions, field error maps).
- Avoid ad hoc inline types in route/component layers.

### 5.3 App and Lib Boundaries

`src/app`:

- Routing and delegation only.
- No auth business logic.

`src/lib`:

- Infrastructure helpers only (cookies, env, observability, route constants, API client integration helpers).
- No feature workflow decisions.

## 6) Target File Structure for Auth/Login Feature

Required files for this refactor:

- `src/features/auth/components/login-form.tsx`
- `src/features/auth/hooks/use-login.ts`
- `src/features/auth/services/login.service.ts`
- `src/features/auth/server/login.handler.ts`
- `src/features/auth/schemas/login.schema.ts`
- `src/features/auth/types/auth.types.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/api/auth/login/route.ts`

Expected ownership per required file:

`src/features/auth/components/login-form.tsx`

- Presentation and form rendering.
- Uses hook outputs/handlers only.

`src/features/auth/hooks/use-login.ts`

- Submission flow state and interaction behavior.
- Calls `login.service.ts`.

`src/features/auth/services/login.service.ts`

- Calls `/api/auth/login`.
- Parses typed response and returns normalized results.

`src/features/auth/server/login.handler.ts`

- Receives request payload from route.
- Validates payload with schema.
- Calls backend auth token endpoint and maps response.
- Handles cookie/session side effects through infrastructure helpers.

`src/features/auth/schemas/login.schema.ts`

- Zod schema for login request (email/password).
- Optional schema for normalized error payload.

`src/features/auth/types/auth.types.ts`

- Shared feature-level types for request/result/error/field errors.

`src/app/(auth)/login/page.tsx`

- Route page composition only.
- No data fetching or auth orchestration.

`src/app/api/auth/login/route.ts`

- Thin handler that delegates to feature server handler.

## 7) API Delegation Pattern (Thin Route -> Feature Server Handler)

### 7.1 Contract

All login HTTP entrypoints under `app/api` must delegate immediately to a feature server handler.

Pattern:

```ts
import { loginHandler } from "@/features/auth/server/login.handler";

export async function POST(req: Request) {
  return loginHandler(req);
}
```

### 7.2 Data Contracts (API Mapping)

Inbound app route:

- `POST /api/auth/login`
- Request body: login credentials (`email`, `password`)

Outbound backend dependency:

- `POST /api/v1/admin/auth/token`

Feature handler responsibilities for contract mapping:

- Validate and normalize inbound payload.
- Translate backend success/error envelopes to stable app-route response shape.
- Preserve actionable field-level errors.
- Include trace/diagnostic metadata where available.

## 8) Validation Rules

- No business logic inside `src/app/**`.
- No direct `fetch` in feature components.
- Login schema validation is required (Zod) before backend calls.
- Form validation must not be duplicated in uncontrolled ad hoc logic.
- Route handlers must be thin and delegate to feature server handlers.
- Hooks orchestrate client flow; services execute requests; components render only.
- Use design tokens and existing shared UI patterns; no hardcoded brand values.
- Keep auth cookie/session side effects in server/infrastructure layers only.

## 9) Data Flow (UI -> Hook -> Service -> API Route -> Server Handler)

Canonical flow:

1. User submits login form in `components/login-form.tsx`.
2. `hooks/use-login.ts` validates UI intent and triggers async mutation.
3. `services/login.service.ts` sends request to `POST /api/auth/login`.
4. `src/app/api/auth/login/route.ts` delegates directly to `server/login.handler.ts`.
5. `server/login.handler.ts` validates input schema and calls backend auth token API.
6. Handler maps backend response, applies auth cookie/session effects, and returns app-route response.
7. Hook interprets normalized result and updates UI state/redirect behavior.

## 10) Acceptance Criteria

- Login feature matches strict feature-based folder structure for required files.
- `src/app/api/auth/login/route.ts` contains delegation only.
- `src/app/(auth)/login/page.tsx` contains route composition only.
- Login component has no direct network calls.
- Login hook exists and owns submit-state orchestration.
- Login service exists and owns `/api/auth/login` request logic.
- Login server handler exists and owns backend auth orchestration.
- Zod login schema is used by server handler validation.
- Auth types are centralized in `types/auth.types.ts`.
- Existing successful login redirect behavior remains intact.
- Error handling preserves field-level feedback and user-friendly messaging.

## 11) Test Plan

Unit tests:

- Schema tests for valid/invalid credential payloads.
- Service tests for success, validation failure, auth failure, and transport failure parsing.
- Hook tests for submitting, error states, and success transition.
- Server handler tests for:
  - bad payload -> 400
  - invalid credentials mapping
  - backend unavailable mapping
  - successful login with expected response shape and cookie/session effects

Route tests:

- Verify `POST /api/auth/login` route delegates to handler (thin-route behavior).

Component tests:

- Login form renders field errors and form errors from hook output.
- Submit button disabled/pending behavior while submitting.

Regression checks:

- Keep existing auth-related tests passing.
- Add focused tests for newly introduced layers.

## 12) Rollout/Risks

Rollout approach:

- Perform refactor in a single feature branch scoped to admin login.
- Keep route path and client-visible contracts stable.
- Validate with unit + route + component tests before merge.

Primary risks:

- Error contract drift between old and new layering.
- Cookie/session side-effect regressions after handler extraction.
- Duplicate validation logic reintroduced across layers.

Mitigations:

- Define and test a stable response contract in types/schemas.
- Add explicit tests around cookie/session behavior.
- Enforce thin-route pattern and no-fetch-in-component review checks.

Out-of-scope path note:

- If `specs/admin/auth-login-refactor.md` is requested elsewhere, `.specs/admin/auth-login-refactor.md` remains the source of truth.
