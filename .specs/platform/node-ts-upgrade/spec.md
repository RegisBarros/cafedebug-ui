# Spec: Node.js & TypeScript Upgrade

| Field | Value |
|---|---|
| **Status** | `Implemented` |
| **Domain** | `platform` |
| **Spec path** | `.specs/platform/node-ts-upgrade/` |
| **Affected apps** | All (`apps/admin`, `packages/*`, CI, Docker) |

---

## 1. Problem Statement

The monorepo runs on Node.js 20 (EOL April 2026) and TypeScript 5.9.3. Node.js 20
has reached end-of-life, meaning no further security patches. TypeScript 6.0 is the
current stable release and acts as a bridge to the native TS 7.0 compiler — adopting
it now surfaces compatibility issues early while defaults are still manageable.

---

## 2. User and Business Context

| Dimension | Detail |
|---|---|
| **Audience** | Development team and CI/CD pipeline |
| **Business criticality** | Medium — Node 20 EOL means no security patches; TS 6.0 is the bridge to TS 7.0 |
| **Risk profile** | Low — shared tsconfigs already explicitly set most options whose defaults changed in TS 6.0 |

---

## 3. Scope

### In scope

| Area | Detail |
|---|---|
| Node.js engine bump | Root `engines.node` from `>=20.9.0` to `>=22.0.0` |
| CI Node.js version | `validation-gates.yml` from `node-version: 20` to `node-version: 22` |
| Docker base image | `node:20-alpine` to `node:22-alpine` |
| TypeScript upgrade | `typescript` from `^5.9.3` to `^6.0.0` in `apps/admin` and `packages/api-client` |
| tsconfig fixes | Bump `ignoreDeprecations` from `"5.0"` to `"6.0"` in `apps/admin/tsconfig.json` |
| tsconfig cleanup | Remove `DOM.Iterable` from `nextjs.json` lib (merged into `DOM` in TS 6.0) |
| Lockfile regen | `pnpm install` after dependency changes |
| Validation gates | lint, typecheck, build, tests must pass |

### Out of scope

| Area | Reason |
|---|---|
| Node.js 24 as minimum | Too aggressive — 22 provides good runway (EOL April 2027) |
| TS 7.0 native compiler | Not released yet |
| `target` bump to ES2025 | Separate evaluation — current ES2022 target is fine |
| `stableTypeOrdering` flag | Optional TS 7.0 prep — evaluate separately |

---

## 4. Breaking Changes Audit

### Node.js 20 → 22

| Change | Impact | Action |
|---|---|---|
| V8 engine upgrade (12.4 → 12.8) | None — ES2022 target is subset | None |
| `require(esm)` enabled by default | None — project uses `type: "module"` | None |
| `--experimental-*` flag removals | None — no experimental flags in scripts | None |
| `node --test` runner improvements | Positive — test runner used in `apps/admin` | None |

### TypeScript 5.9 → 6.0

| Change | Config Status | Action |
|---|---|---|
| `strict` defaults to `true` | Already `true` in `base.json` | None |
| `module` defaults to `esnext` | Already `ESNext` in `base.json` | None |
| `target` defaults to current-year ES | Already `ES2022` in `base.json` | None |
| `types` defaults to `[]` | Already `["node"]` in `nextjs.json` and `api-client/tsconfig.json` | None |
| `moduleResolution node` deprecated | Using `Bundler` | None |
| `esModuleInterop` can't be `false` | Already `true` | None |
| `dom.iterable` merged into `dom` | Listed in `nextjs.json` and `api-client/tsconfig.json` | Remove (cleanup) |
| `ignoreDeprecations` must match | Set to `"5.0"` in admin tsconfig | Bump to `"6.0"` |
| `baseUrl` deprecated | Not used | None |

---

## 5. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-01 | Root `engines.node` is `>=22.0.0` |
| AC-02 | CI uses `node-version: 22` |
| AC-03 | Docker base image is `node:22-alpine` |
| AC-04 | `typescript` resolves to 6.x in lockfile |
| AC-05 | `ignoreDeprecations` is `"6.0"` in `apps/admin/tsconfig.json` |
| AC-06 | `DOM.Iterable` removed from tsconfig lib arrays |
| AC-07 | `pnpm lint` passes |
| AC-08 | `pnpm typecheck` passes |
| AC-09 | `pnpm build` passes |
| AC-10 | `pnpm test` passes |

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| TS 6.0 type inference changes break typecheck | Low | Shared configs already explicit; fix errors as they appear |
| Docker `node:22-alpine` image compatibility | Low | Well-established LTS image |
| `ignoreDeprecations` bump misses removed features | Low | Only `exactOptionalPropertyTypes` was behind this flag; still supported |
