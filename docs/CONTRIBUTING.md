# Contributing to CafeDebug Platform

Thanks for helping modernize CafeDebug.

This repository is expected to become a public monorepo with three major surfaces:

- `apps/web` for the public website
- `apps/admin` for the admin backoffice
- `services/api` for the .NET REST API

## Current Stage

Right now the repository is still in the architecture and planning phase. Until the apps are scaffolded, the most valuable contributions are:

- documentation improvements
- architecture decisions
- specs
- design-system definitions
- deployment planning

## Working Agreement

- Keep changes small and focused.
- Start non-trivial work with a spec or update an existing one.
- Preserve the CafeDebug brand while modernizing the experience.
- Prefer shared packages over copy-paste between apps.
- Do not hardcode colors, logos, or API base URLs in UI code.
- Keep accessibility, responsive behavior, SEO, and tests in scope.

## Suggested Contribution Flow

1. Open or pick an issue.
2. Confirm whether a spec already exists under `.specs/`.
3. Create or update the relevant spec before implementation.
4. Align design and API assumptions.
5. Implement the smallest useful change.
6. Add or update tests.
7. Open a pull request with context, screenshots, and tradeoffs.

## Specs First

Use specs for any work that changes behavior, layout, or architecture.

Examples:

- a new home page section
- episode filtering
- banner placement rules
- admin CRUD workflows
- deployment changes
- auth/session flows

Use [.specs/README.md](../.specs/README.md) as the format reference.

## Branches and Commits

Suggested branch prefixes:

- `feat/`
- `fix/`
- `docs/`
- `chore/`
- `refactor/`

Use Conventional Commits when possible:

- `feat: add episode details spec`
- `fix: normalize banner card spacing`
- `docs: clarify monorepo structure`

## Pull Request Checklist

- The change is linked to an issue, discussion, or spec.
- The impacted spec was created or updated.
- UI changes include screenshots or a short screen recording.
- Responsive behavior was considered.
- SEO metadata was considered for route changes.
- Analytics impact was considered for user-facing flows.
- Tests were added or updated when behavior changed.
- Documentation was updated if the architecture or workflow changed.

## Monorepo Boundaries

When the repository is scaffolded:

- `apps/web` should only contain public website concerns
- `apps/admin` should only contain authenticated backoffice concerns
- shared UI primitives belong in `packages/ui`
- API contract and generated types belong in `packages/api-client`
- branding and theme tokens belong in `packages/design-tokens`

Avoid duplicating the same component or request type in multiple apps.

## AI-Assisted Contributions

AI tooling is welcome, including GitHub Copilot and agent-based workflows, but:

- humans stay responsible for correctness
- generated code must still follow repository conventions
- specs remain the source of truth for non-trivial work
- design tokens and accessibility rules still apply

See [AGENTS.md](../AGENTS.md) and [.github/copilot-instructions.md](../.github/copilot-instructions.md).
