# Spec: API Client Refactor (Orval Contract Layer + Next.js Data Strategy)

**Status:** Implemented  
**Scope:** Monorepo (`packages/api-client`, `apps/admin`, `apps/web`)  
**Primary Goal:** Type-safe, simple, and scalable API access with clear app-specific fetching rules

---

## 1. Problem Statement

The current API integration works, but it is split across multiple layers and duplicates concerns:

- contract generation is `openapi-typescript` only, while endpoint usage is still partially hand-wired
- admin feature services still implement repeated request/envelope/error parsing logic
- there is no formal contract for when to use TanStack Query vs server-side data fetching across apps
- the monorepo lacks a single documented approach for adding new backend endpoints safely

This increases maintenance cost and makes it easy to drift from architecture rules in `README.md` and `.github/copilot-instructions.md`.

---

## 2. Adopted Direction

This refactor adopts the following project-wide strategy:

1. Use **Orval as the contract generation layer** in `packages/api-client`.
2. Keep **TanStack Query primarily in `apps/admin`** for CRUD, invalidation, optimistic updates, and client-heavy workflows.
3. Use **Next.js server-side fetching by default in `apps/web`**, backed by Orval-generated fetch clients.
4. Add TanStack Query in `apps/web` only for truly interactive client-side sections.

This is intentionally repository-like in organization, but without introducing a heavy generic repository abstraction.

---

## 3. Scope

### In Scope

- Introduce Orval generation pipeline and output organization in `packages/api-client`.
- Define shared API error/result normalization in one place.
- Define domain-oriented API modules for admin and public backend areas.
- Refactor admin backend adapters to use the new package organization.
- Document and enforce app-specific data-fetching rules (`admin` vs `web`).

### Out of Scope

- Backend API schema or endpoint changes.
- Full redesign of admin feature UIs.
- Replacing all admin internal `/api/*` route handlers.
- Generating React Query hooks directly in the shared package.
- Building all `apps/web` pages in this iteration.

---

## 4. Functional Requirements

### FR-1: Contract Generation

- `@cafedebug/api-client` must generate typed artifacts from `.specs/admin/backend-openspec-api.json` using Orval.
- Generated outputs must be deterministic and safe to run in CI.
- Contract-check command must fail if generated files are stale.

### FR-2: Shared Core Transport

- A single core transport/error layer must exist in `packages/api-client`.
- Normalized success/error shape must be consistent across admin/public modules.
- Base URL and `fetch` injection must remain configurable.

### FR-3: Domain-Oriented API Modules

- API access must be grouped by domain (auth, episodes, banners, categories, team members, images, accounts).
- Domain modules must expose clear methods for app usage and avoid raw path strings in app code.

### FR-4: Admin Data Strategy

- `apps/admin` must continue to use TanStack Query in feature hooks for list/detail/mutation flows.
- Route files remain thin; server orchestration remains in `features/*/server` or `lib/api`.
- No direct backend `fetch` in client components.
- Protected admin backend calls must translate the HttpOnly access-token cookie into backend bearer auth at the server/lib boundary.
- Refresh requests must use body-token exchange (`{ refreshToken }`) without backend cookie forwarding or bearer auth.

### FR-5: Web Data Strategy

- `apps/web` defaults to Server Components/server-side data fetching.
- Public endpoints are consumed through Orval-generated client adapters.
- Client-side query state is introduced only where interaction requires it.

### FR-6: Simplicity Over Pattern Weight

- The architecture must not introduce generic repository interfaces that obscure endpoint behavior.
- Prefer small, explicit adapters over inheritance-heavy abstractions.

---

## 5. Non-Functional Requirements

- Strong end-to-end type safety for request params, body, and response data.
- Clear separation of concerns: contract, transport, domain adapters, app orchestration.
- Backward-compatible migration path for existing admin flows.
- Low cognitive load for adding new endpoints.

---

## 6. Source of Truth

- Product and stack: `README.md`
- Architecture rules: `.github/copilot-instructions.md`
- Agent lifecycle governance: `AGENTS.md`
- Spec workflow: `.specs/README.md`
- Backend contract input: `.specs/admin/backend-openspec-api.json`

---

## 7. Acceptance Criteria

1. `packages/api-client` uses Orval-generated contract output and passes generation + typecheck.
2. Admin backend adapters consume the new API-client organization without behavior regressions, including server-side cookie-to-bearer translation for protected backend calls.
3. Admin TanStack Query flows (listing, detail, create, update) remain functional.
4. A documented default exists for `apps/web`: server-side data fetching first, Query only when needed.
5. Error normalization and result handling no longer duplicate logic across feature services.
6. Updated docs clearly describe how to add a new backend endpoint end-to-end.
