# Spec: Next.js 16 Migration

| Field | Value |
|---|---|
| **Status** | `Implemented` |
| **Domain** | `platform` |
| **Spec path** | `.specs/platform/nextjs-16-migration/` |
| **Affected apps** | `apps/admin` (primary), `apps/web` (baseline readiness only) |

---

## 1. Problem Statement

The admin application (`apps/admin`) runs on Next.js 15.x. Next.js 16 introduces
significant improvements — Cache Components, stable Turbopack, `proxy.ts` (replacing
deprecated `middleware.ts`), improved caching APIs, and React 19.2 features — that the
project should adopt to remain on the supported upgrade path.

This spec covers the **framework upgrade itself**: dependency bumps, breaking change
remediation, and the middleware-to-proxy migration. It does **not** adopt new features
like Cache Components or View Transitions — those are follow-up work.

---

## 2. User and Business Context

| Dimension | Detail |
|---|---|
| **Audience** | Development team and CI/CD pipeline |
| **Business criticality** | Medium — staying on a deprecated major blocks future feature adoption and security patches |
| **Risk profile** | Low-medium — the admin app is already compliant with most Next 16 breaking changes (async params, async cookies, no parallel routes) |

---

## 3. Scope

### In scope

| Area | Detail |
|---|---|
| Dependency upgrades | `next` ^15.3.3 → ^16.2.3, `@next/eslint-plugin-next` ^15.5.14 → ^16.2.3, `@sentry/nextjs` ^9.47.1 → ^10.48.0 |
| Engine constraint | Root `package.json` `engines.node` from `>=20.0.0` to `>=20.9.0` |
| Middleware → Proxy migration | Rename `middleware.ts` → `proxy.ts`, rename export `middleware` → `proxy` (default export) |
| Observability event names | Update `middlewareSessionRedirect` and `middlewareSessionValidationError` to `proxySessionRedirect` and `proxySessionValidationError` (cosmetic) |
| Lockfile regeneration | `pnpm install` after dependency changes |
| Validation gates | lint, typecheck, build, tests must pass after each phase |

### Out of scope

| Area | Reason |
|---|---|
| Cache Components adoption | New feature — separate spec when ready |
| View Transitions | New feature — separate spec |
| Turbopack filesystem caching | Beta feature — evaluate separately |
| React Compiler enablement | Requires Babel — evaluate build time impact separately |
| `apps/web` migration | Placeholder scaffold with no Next.js runtime deps |
| `revalidateTag` signature change | No `revalidateTag` usage in admin app |
| `next/image` config changes | No `next/image` usage in admin app |
| Parallel routes `default.js` | No parallel routes in admin app |

---

## 4. Breaking Changes Audit

| Breaking Change | Admin App Status | Action Required |
|---|---|---|
| Async `params` / `searchParams` | Already compliant (`await params` used) | None |
| Async `cookies()` / `headers()` | Already compliant (`await cookies()` used) | None |
| `next lint` removed | Admin uses `eslint .` directly | None |
| `@next/eslint-plugin-next` flat config default | Already using flat config | None |
| Node.js 20.9+ minimum | Local: v25.9.0, CI: node 20 (compatible) | Tighten root engine |
| `middleware.ts` deprecated → `proxy.ts` | `middleware.ts` exists (194 lines) | Rename + re-export |
| Turbopack default bundler | New default | Verify build works |
| `@sentry/nextjs` peer dep | v9.x does NOT support Next 16 | Upgrade to ^10.48.0 |
| Parallel routes require `default.js` | No parallel routes | None |

---

## 5. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-01 | `next` version in lockfile resolves to 16.x |
| AC-02 | `@sentry/nextjs` version in lockfile resolves to 10.x |
| AC-03 | `apps/admin/src/proxy.ts` exists with `export default function proxy` |
| AC-04 | `apps/admin/src/middleware.ts` no longer exists |
| AC-05 | `pnpm --filter @cafedebug/admin lint` passes |
| AC-06 | `pnpm --filter @cafedebug/admin typecheck` passes |
| AC-07 | `pnpm --filter @cafedebug/admin build` passes |
| AC-08 | `pnpm --filter @cafedebug/admin test` passes |
| AC-09 | Root `engines.node` is `>=20.9.0` |

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `@sentry/nextjs` v10 API breakage | Medium | Check Sentry v10 migration guide; `withSentryConfig` API may differ |
| Turbopack default causes build issues | Low | Can fall back to `--webpack` flag |
| `proxy.ts` Node.js runtime vs Edge | Low | Sentry edge config becomes unused but harmless; proxy logic is Node-compatible |
| Lockfile conflicts with other branches | Low | Merge lockfile after all other changes land |
