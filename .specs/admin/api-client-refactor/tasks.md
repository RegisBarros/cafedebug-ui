# Tasks: API Client Refactor (Orval + Next.js Data Strategy)

**Status:** Implemented  
**Spec:** `spec.md`  
**Design:** `design.md`  
**Assigned to:** Architect Guardian + Frontend Blacksmith + The Debugger + Documentation Monk

---

## Phase 0 — Lifecycle Gate

1. Confirm `spec.md` approval.
2. Confirm `design.md` approval.
3. Confirm migration order and rollout scope (pilot first, then full migration).

---

## Phase 1 — Contract Layer (Orval)

1. Add Orval configuration in `packages/api-client/orval.config.ts`.
2. Update `packages/api-client/package.json` scripts:
   - `generate`
   - `contract:check`
   - `build` pipeline integration
3. Generate contract outputs from `.specs/admin/backend-openspec-api.json` into `src/generated`.
4. Ensure generated output is deterministic and committed according to repo policy.

Validation:

- `pnpm --filter @cafedebug/api-client generate`
- `pnpm --filter @cafedebug/api-client contract:check`

---

## Phase 2 — Shared Core in `@cafedebug/api-client`

1. Introduce core transport utilities (`src/core/*`) for:
   - fetch mutator
   - normalized error mapping
   - normalized result union
2. Keep/export a stable normalized error API for admin consumers.
3. Keep backward-compatible exports where migration is incremental.

Validation:

- `pnpm --filter @cafedebug/api-client typecheck`
- `pnpm --filter @cafedebug/api-client lint`

---

## Phase 3 — Domain API Modules

1. Create or refactor admin domain modules:
   - auth
   - episodes
   - banners
   - categories
   - team members
   - images
   - accounts
2. Create public domain modules required for `apps/web` server usage.
3. Ensure no app code needs to reference raw endpoint path strings.

Validation:

- Type-check all domain module exports and call signatures.

---

## Phase 4 — Admin Adoption (TanStack Query First)

1. Refactor `apps/admin/src/lib/api/admin-client.ts` to use the new `@cafedebug/api-client` structure.
2. Refactor backend adapters:
   - `apps/admin/src/lib/api/auth-admin-api.ts`
   - `apps/admin/src/lib/api/episodes-admin-api.ts`
   - supporting helpers in `apps/admin/src/lib/api/backend-api.utils.ts` where needed
3. Keep route handlers thin and server orchestration in feature/lib layers.
4. Preserve existing TanStack Query hooks and invalidation behavior.
5. Remove duplicated request/error parsing logic once replaced by shared helpers.

Validation:

- `pnpm --filter @cafedebug/admin typecheck`
- `pnpm --filter @cafedebug/admin lint`
- `pnpm --filter @cafedebug/admin test`

Smoke checks:

- login flow (token + refresh)
- episodes list load
- episode detail load
- create/update episode mutation

---

## Phase 5 — Web Conventions (Server-First)

1. Add usage examples for `apps/web` server-side fetching through public domain modules.
2. Document when client-side TanStack Query is allowed in `apps/web`.
3. Ensure the default guidance in code comments/docs reflects server-first behavior.

Validation:

- `apps/web` examples compile when web app scaffolding is expanded.

---

## Phase 6 — Documentation and Governance Sync

1. Update `README.md` API contract section to reflect Orval-based generation.
2. Update `.github/copilot-instructions.md` where it references contract tooling.
3. Ensure `.specs/README.md` includes this feature entry.
4. Record implementation status updates in this spec folder after rollout.

---

## Execution Order

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6

---

## Definition of Done

1. Orval contract generation is the active API-client contract workflow.
2. Shared normalized transport/error logic exists in one package layer.
3. Admin flows use migrated domain APIs without regressions.
4. Web strategy is documented as server-first with selective Query usage.
5. Lint/typecheck/tests pass for impacted packages/apps.
6. Spec/design/tasks and top-level docs are aligned with delivered behavior.
