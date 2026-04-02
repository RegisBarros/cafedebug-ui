# AI Agent Instructions

This file is the shared working agreement for agent-based development in CafeDebug Platform.

## Mission

Modernize CafeDebug into a maintainable monorepo with:

- a public website in Next.js
- an admin backoffice in Next.js
- a .NET REST API in the same repository

## Read This First

Before making non-trivial changes, read:

1. `README.md`
2. the relevant spec under `.specs/`
3. `.specs/admin/DESIGN_SYSTEM.md` for UI work
4. `.github/copilot-instructions.md` if you are running inside GitHub Copilot

## Core Rules

- Website work is SEO-first and server-first.
- Admin work is workflow-first and should optimize for clarity and data operations.
- Shared logic belongs in packages, not duplicated across apps.
- API contracts should come from the backend OpenAPI contract.
- Colors, radii, spacing, logos, and typography decisions should come from the design system and theme tokens.
- If a feature changes behavior, update the spec.

## Architecture Rules

### `apps/web`

- default to Server Components
- use client components only when interactivity needs them
- implement metadata, canonical URLs, and social tags as part of route work
- prefer static generation or incremental revalidation for content-driven pages

### `apps/admin`

- use authenticated routes and clear CRUD workflows
- prefer `TanStack Query` for async state
- use `React Hook Form` and `Zod` for form-heavy features
- keep business rules out of page components

### Shared packages

- `packages/ui` for reusable primitives and shared composition patterns
- `packages/api-client` for generated types and shared API helpers
- `packages/design-tokens` for brands, themes, and visual tokens

## Specs-Driven Development

Non-trivial work should start with or update a spec.

Examples of work that require specs:

- new pages or routes
- episode detail changes
- banner placement rules
- admin CRUD flows
- authentication or session changes
- deployment architecture changes

Use the format described in `.specs/README.md`.

## Design System Rules

- no hardcoded hex colors in feature components
- no direct logo references outside brand config or token packages
- keep the current CafeDebug identity recognizable
- modernize by improving spacing, hierarchy, accessibility, and responsiveness
- do not import random UI kits or page templates that break the brand
- use .specs/admin/DESIGN_SYSTEM.md as the source of truth for design decisions
- use .specs/admin/stitch/cafedebug-admin/code/* for the source of truth for implementation html and CSS patterns
- use .specs/admin/stitch/cafedebug-admin/images/* to compare the implementation with the design mockups

## Figma MCP Workflow

When Figma assets exist:

1. use Figma to confirm finalized layouts and tokens
2. map colors, typography, spacing, and component states into code tokens
3. keep code tokens as the implementation source of truth
4. record relevant Figma links in the corresponding spec

Use Figma MCP for design inspection and validation, not as a replacement for architecture decisions.

## Definition of Done

- the relevant spec is aligned with the implementation
- tests were added or updated, or the gap was explicitly documented
- responsive behavior was considered
- accessibility was considered
- SEO and analytics were considered for user-facing route changes
- docs were updated when the architecture or workflow changed
