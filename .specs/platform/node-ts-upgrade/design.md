# Design: Node.js & TypeScript Upgrade

## Change Map

### Node.js 22

Three files reference Node.js version:

1. `package.json` → `engines.node: ">=22.0.0"`
2. `.github/workflows/validation-gates.yml` → `node-version: 22`
3. `infra/docker/admin/Dockerfile` → `FROM node:22-alpine AS base`

### TypeScript 6.0

Two packages declare typescript as devDependency:

1. `apps/admin/package.json` → `typescript: "^6.0.0"`
2. `packages/api-client/package.json` → `typescript: "^6.0.0"`

### tsconfig adjustments

1. `apps/admin/tsconfig.json` → `ignoreDeprecations: "6.0"`
2. `packages/tsconfig/nextjs.json` → remove `DOM.Iterable` from lib
3. `packages/api-client/tsconfig.json` → remove `DOM.Iterable` from lib

### Lockfile

`pnpm install` to regenerate after dependency changes.

## Execution Order

1. Bump Node.js references (engine, CI, Docker)
2. Bump TypeScript version in both packages
3. Fix tsconfig files
4. Regenerate lockfile
5. Run full validation: lint → typecheck → build → test
