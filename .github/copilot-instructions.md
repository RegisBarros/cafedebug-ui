# GitHub Copilot Instructions

- Read `README.md`, `AGENTS.md`, and the relevant file under `specs/` before generating non-trivial code.
- This repository is a monorepo with `apps/web`, `apps/admin`, `services/api`, and shared `packages/*`.
- Use Next.js App Router and TypeScript for frontend work.
- Default to Server Components in `apps/web`.
- Prefer `TanStack Query` for async state in `apps/admin`.
- Use generated API contracts from the backend OpenAPI schema.
- Do not hardcode colors, logos, or API base URLs in components.
- Use the design tokens from `packages/design-tokens`.
- Update the spec when behavior changes.
- Add or update tests for behavior changes.
