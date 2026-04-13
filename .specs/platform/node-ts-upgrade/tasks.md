# Tasks: Node.js & TypeScript Upgrade

## Phase 1: Node.js 22

- [x] Bump `engines.node` to `>=22.0.0` in root `package.json`
- [x] Update `node-version: 22` in `.github/workflows/validation-gates.yml`
- [x] Update `FROM node:22-alpine` in `infra/docker/admin/Dockerfile`

## Phase 2: TypeScript 6.0

- [x] Bump `typescript` to `^6.0.0` in `apps/admin/package.json`
- [x] Bump `typescript` to `^6.0.0` in `packages/api-client/package.json`
- [x] Bump `ignoreDeprecations` to `"6.0"` in `apps/admin/tsconfig.json`
- [x] Remove `DOM.Iterable` from lib in `packages/tsconfig/nextjs.json`
- [x] Remove `DOM.Iterable` from lib in `packages/api-client/tsconfig.json`

## Phase 3: Lockfile & Validation

- [x] Run `pnpm install` to regenerate lockfile
- [x] `pnpm lint` passes
- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [x] `pnpm test` passes
