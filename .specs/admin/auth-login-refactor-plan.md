# Admin Auth Login Refactor Implementation Plan

Source spec: .specs/admin/auth-login-refactor.md
Architecture references: AGENTS.md, .github/copilot-instructions.md

## 1) Phase 1: Structure setup (folders + files)

- [ ] Define and align auth feature folder boundaries
  - File path: apps/admin/src/features/auth/
  - Layer: docs
  - Expected result: Login flow scope is explicitly organized under components, hooks, services, server, schemas, and types, with no login business logic remaining in app route files.
  - Notes/dependencies: Depends on current auth file inventory and import mapping before moving logic.

- [ ] Create schema contract file
  - File path: apps/admin/src/features/auth/schemas/login.schema.ts
  - Layer: schema
  - Expected result: Zod schemas for login request payload and normalized error payload are defined for shared client/server usage.
  - Notes/dependencies: Must be the single validation source for login payload shape.

- [ ] Create shared auth types file
  - File path: apps/admin/src/features/auth/types/auth.types.ts
  - Layer: type
  - Expected result: Typed contracts exist for login request, success result, error result, and optional field-error map.
  - Notes/dependencies: Types must align with schema output and service/handler contracts.

- [ ] Scaffold hook file
  - File path: apps/admin/src/features/auth/hooks/use-login.ts
  - Layer: hook
  - Expected result: Hook contract skeleton is created for submit orchestration and mutation state, without direct fetch usage.
  - Notes/dependencies: Hook will depend on login service and schema/type contracts.

- [ ] Scaffold client service file
  - File path: apps/admin/src/features/auth/services/login.service.ts
  - Layer: service
  - Expected result: Service contract skeleton exists for calling internal app login route and returning normalized typed result.
  - Notes/dependencies: Must be the only client-side network call path used by login UI flow.

- [ ] Scaffold server handler file
  - File path: apps/admin/src/features/auth/server/login.handler.ts
  - Layer: server
  - Expected result: Server login handler contract exists and is ready to receive delegated route requests.
  - Notes/dependencies: Will depend on schema validation, backend auth client integration, and auth cookie/session helpers.

Validation checkpoint:

- Confirm all required feature files exist in their target layers.
- Confirm no business logic migration has been performed inside app route/page in this phase.

Architecture compliance note:

- Establishes feature-based placement before behavior refactor to prevent cross-layer leakage.

## 2) Phase 2: Extract UI (login-form)

- [ ] Move login presentation component into feature component layer
  - File path: apps/admin/src/features/auth/components/login-form.tsx
  - Layer: component
  - Expected result: Login form is purely presentational/orchestration via hook API, with no direct fetch, backend-client calls, or cookie logic.
  - Notes/dependencies: Depends on use-login hook contract from Phase 1.

- [ ] Keep login page as composition-only route entry
  - File path: apps/admin/src/app/(auth)/login/page.tsx
  - Layer: page
  - Expected result: Page only composes and renders LoginForm (route-level composition), with no business logic, no fetch, and no validation logic.
  - Notes/dependencies: Import path updated to components/login-form.

- [ ] Ensure form stack is React Hook Form + Zod-backed schema contract
  - File path: apps/admin/src/features/auth/components/login-form.tsx
  - Layer: component
  - Expected result: Form state uses React Hook Form and consumes Zod-driven validation wiring from the feature schema contract.
  - Notes/dependencies: Shared schema in schemas/login.schema.ts must remain canonical.

Validation checkpoint:

- Verify login page is routing/composition only.
- Verify no fetch appears in login-form or login page.
- Verify form-level validation uses React Hook Form + Zod integration.

Architecture compliance note:

- Enforces app as routing-only and keeps UI concerns inside feature components.

## 3) Phase 3: Extract logic (hook + service)

- [ ] Implement login mutation orchestration in hook
  - File path: apps/admin/src/features/auth/hooks/use-login.ts
  - Layer: hook
  - Expected result: Hook manages submit lifecycle (pending/success/error), maps field/form errors, and exposes a typed API for login-form.
  - Notes/dependencies: Must call login service only; no direct fetch.

- [ ] Implement service-based API call to internal route
  - File path: apps/admin/src/features/auth/services/login.service.ts
  - Layer: service
  - Expected result: Service calls /api/auth/login, parses response into normalized typed success/error union, and isolates transport details from UI.
  - Notes/dependencies: Must use shared auth types and schema-aligned payload/response handling.

- [ ] Centralize login request/result contracts used by hook and service
  - File path: apps/admin/src/features/auth/types/auth.types.ts
  - Layer: type
  - Expected result: Hook/service use shared types only; no ad hoc inline login DTOs remain.
  - Notes/dependencies: Keep type contract stable to avoid UI/service drift.

Validation checkpoint:

- Verify component consumes hook only.
- Verify hook consumes service only.
- Verify service is the single client network boundary for login.

Architecture compliance note:

- Separates UI orchestration (hook) from transport concerns (service) and prevents fetch-in-component/page anti-pattern.

## 4) Phase 4: Server handler refactor

- [ ] Implement request validation and orchestration in feature server handler
  - File path: apps/admin/src/features/auth/server/login.handler.ts
  - Layer: server
  - Expected result: Handler validates payload with Zod schema, calls backend admin auth token endpoint via infrastructure client, and maps backend outcomes to stable app response contract.
  - Notes/dependencies: Depends on schemas/login.schema.ts, types/auth.types.ts, and lib auth/cookie helpers.

- [ ] Keep auth side effects in server/infrastructure boundary
  - File path: apps/admin/src/features/auth/server/login.handler.ts
  - Layer: server
  - Expected result: Cookie/session side effects are executed only in server handler via existing auth/lib helpers, not in route/page/component layers.
  - Notes/dependencies: Reuse existing helpers under apps/admin/src/lib/auth/.

- [ ] Align schema and types with handler response mapping
  - File path: apps/admin/src/features/auth/schemas/login.schema.ts
  - Layer: schema
  - Expected result: Input/output validation contracts reflect actual normalized handler responses for consistent client handling.
  - Notes/dependencies: Keep backward-compatible user-visible behavior and error messaging.

Validation checkpoint:

- Verify bad payload returns validation-safe response contract.
- Verify success/failure contracts are stable and typed.
- Verify cookie/session behavior remains in server/infrastructure only.

Architecture compliance note:

- Concentrates business orchestration in feature server layer and preserves lib as infrastructure-only.

## 5) Phase 5: API route cleanup

- [ ] Refactor login API route to thin delegation only
  - File path: apps/admin/src/app/api/auth/login/route.ts
  - Layer: route
  - Expected result: Route exports a thin POST handler that delegates directly to login.handler with no business logic, mapping branches, or validation logic inline.
  - Notes/dependencies: Depends on completed server handler from Phase 4.

- [ ] Remove legacy login orchestration from route file
  - File path: apps/admin/src/app/api/auth/login/route.ts
  - Layer: route
  - Expected result: Route file contains only request pass-through/delegation and minimal framework glue.
  - Notes/dependencies: Ensure no regression in HTTP status and payload contract exposed to client service.

Validation checkpoint:

- Verify route.ts has thin delegation pattern only.
- Verify no duplicated business logic remains in app/api/auth/login route.

Architecture compliance note:

- Enforces strict app/api thin-route requirement.

## 6) Phase 6: Validation (architecture compliance)

- [ ] Add/adjust schema unit tests for login payload contracts
  - File path: apps/admin/tests/auth-login-schema.test.mjs
  - Layer: test
  - Expected result: Valid/invalid payload paths are covered for Zod contract behavior.
  - Notes/dependencies: Uses schemas/login.schema.ts as source of truth.

- [ ] Add/adjust service tests for normalized client result mapping
  - File path: apps/admin/tests/auth-login-service.test.mjs
  - Layer: test
  - Expected result: Service success, validation error, auth failure, and transport error mappings are verified.
  - Notes/dependencies: Uses services/login.service.ts and types/auth.types.ts contracts.

- [ ] Add/adjust hook tests for submit lifecycle and error propagation
  - File path: apps/admin/tests/auth-login-hook.test.mjs
  - Layer: test
  - Expected result: Hook pending, success transition, form error, and field error behavior are validated.
  - Notes/dependencies: Hook should be tested via public API consumed by login-form.

- [ ] Add/adjust server handler tests for validation, backend mapping, and side effects
  - File path: apps/admin/tests/auth-login-handler.test.mjs
  - Layer: test
  - Expected result: Handler tests cover bad payload -> 400 mapping, invalid credentials, backend failure mapping, and successful response including auth side effects.
  - Notes/dependencies: Mock infrastructure client and cookie/session helpers.

- [ ] Add/adjust route thinness regression test
  - File path: apps/admin/tests/auth-login-route-delegation.test.mjs
  - Layer: test
  - Expected result: Route-level test verifies delegation contract and guards against reintroduction of route business logic.
  - Notes/dependencies: Optional snapshot/assertion on route behavior shape.

- [ ] Update refactor spec implementation status/checklist
  - File path: .specs/admin/auth-login-refactor.md
  - Layer: docs
  - Expected result: Spec reflects completed refactor scope and architecture compliance evidence.
  - Notes/dependencies: Update only after implementation and test verification are complete.

Validation checkpoint:

- app/ contains routing only for login page and login API route.
- No fetch usage exists in login component/page files.
- route.ts is thin delegation.
- React Hook Form + Zod is used for login form validation flow.
- Service-based API calls are used by hook; no direct component networking.
- Feature-based placement is preserved across components/hooks/services/server/schemas/types.

Architecture compliance note:

- Final gate to ensure all architectural constraints from AGENTS.md and .github/copilot-instructions.md are met before merge.
