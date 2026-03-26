# CafeDebug Admin Backoffice — Platform Specification

## 1. Overview

This specification defines the implementation-ready contract for `apps/admin` by merging:

- the architectural baseline from the previous admin platform spec
- the final UI/UX intent from Stitch artifacts (`specs/admin/stitch/cafedebug-admin/`)
- existing handoff guidance in `specs/admin/Design.md` and `specs/admin/DESIGN_SYSTEM.md`

The result is a single system definition for Next.js App Router + Tailwind + token-driven theming, with explicit UI, data, and behavior rules.

### 1.1 Source of Truth Hierarchy

1. Stitch visual artifacts (screens and layout intent)
2. This platform specification (engineering contract)
3. Design system tokens (`packages/design-tokens`) and shared primitives (`packages/ui`)
4. OpenAPI contract (`specs/admin/backend-openspec-api.json`) for API behavior

### 1.2 Primary Outcome

Implementation teams must be able to build login, dashboard, episodes list/edit, and settings with no design ambiguity while preserving platform qualities (auth, observability, typed API, monorepo standards).

---

## 2. Product Scope

### 2.1 In Scope (current phase)

- Authentication entry flow
  - Login
- Admin application shell and navigation
- Dashboard
- Episodes list
- Episode edit/create flow (shared editor architecture)
- Settings
- Theme switching (light/dark/system) with server-readable persistence

### 2.2 Platform Capabilities Preserved

- Cookie-based auth/session lifecycle with refresh strategy
- OpenAPI-generated contracts and TanStack Query usage
- Monorepo package boundaries (`apps/admin`, `packages/ui`, `packages/api-client`, `packages/design-tokens`)
- Structured logging and trace-aware error handling

### 2.3 Out of Scope (for this document revision)

- New business modules beyond Stitch-mapped screens
- Multi-role RBAC
- Redefining backend domain model outside explicit endpoint gaps already documented

---

## 3. Route & Screen Architecture (UI-aligned)

## 3.1 Route Map

- `/login`
- `/dashboard`
- `/episodes`
- `/episodes/new`
- `/episodes/[id]/edit`
- `/settings`

### 3.1.1 Route Grouping

- `(auth)` group: `/login` only, no admin shell
- `(admin)` group: authenticated shell for dashboard, episodes, settings

## 3.2 Screen Contracts

## 3.2.1 `/login`

### Layout zones

- top utility header (brand + optional help/theme action)
- centered authentication card (`max-width: 440px`)
- optional legal/footer links zone

### Key components

- brand lockup
- email input, password input, remember checkbox
- password visibility toggle
- primary submit button
- forgot password link action

### Data dependencies

- `POST /api/v1/admin/auth/token`
- optional post-login refresh bootstrap using `POST /api/v1/admin/auth/refresh-token`

### Interaction patterns

- inline validation for required fields
- clear auth failure message at form level
- submit disabled while request is pending
- Enter key submits
- successful login redirects to `/dashboard`

## 3.2.2 `/dashboard`

### Layout zones

- shell sidebar (left)
- top header (title + global actions)
- content container (`max-width: 1200px`)
- section stack:
  - metrics row (3 cards)
  - recent drafts
  - recent activity

### Key components

- metric cards
- draft list items with status chip + affordance
- activity feed with semantic dot markers
- header quick action: `New Episode`

### Data dependencies

- `GET /api/v1/admin/dashboard/summary` (required contract)
  - `totalEpisodes`
  - `totalListeners` or equivalent aggregate metric
  - `recentDrafts[]`
  - `recentActivities[]`

### Interaction patterns

- action click on draft routes to episode editor
- hover/focus row emphasis via tonal change
- “View all” actions route to list screens

## 3.2.3 `/episodes`

### Layout zones

- page header (title/subtitle + primary action)
- search/filter row
- table container
- table footer/pagination row

### Key components

- search input with leading icon
- episodes data table
- status badges (`Published`, `Draft`)
- pagination controls
- row action affordance

### Data dependencies

- `GET /api/v1/admin/episodes` with query params for pagination/search/filter/sort
- row navigation to `/episodes/[id]/edit`
- create CTA to `/episodes/new`

### Interaction patterns

- search input debounced query
- sortable or consistently ordered columns
- row hover/focus state
- empty list and error recovery actions

## 3.2.4 `/episodes/new` and `/episodes/[id]/edit`

### Layout zones

- sticky top context header (back action + state chip)
- split editor body:
  - left: title + rich/markdown notes editor
  - right: metadata panel
- sticky bottom action bar

### Key components

- large title field
- markdown editor toolbar + write/preview toggle
- cover upload tile
- audio URL input
- category select
- publish datetime input
- tag chips + tag input
- sticky actions (`Cancel`, `Save Draft`, `Publish`)

### Data dependencies

- `GET /api/v1/admin/episodes/{id}` (edit only)
- `POST /api/v1/admin/episodes` (new)
- `PUT /api/v1/admin/episodes/{id}` (edit)
- `POST /api/v1/admin/images/upload` (cover)
- optional `POST /api/v1/admin/images/delete` for replacement cleanup

### Interaction patterns

- dirty-state tracking
- unsaved-changes prompt before leaving
- save/publish actions with pending and result states
- field-level validation with inline errors

## 3.2.5 `/settings`

### Layout zones

- shell sidebar (left)
- centered content column (`max-width: 600px`)
- section stack:
  - profile
  - podcast metadata / SEO defaults
  - theme preferences
  - form action footer

### Key components

- avatar/profile editor row
- text and textarea fields
- copyable readonly feed/config fields
- radio-card theme selector (System/Light/Dark)
- form actions (`Discard`, `Save Changes`)

### Data dependencies

- `GET /api/v1/admin/settings/profile`
- `PUT /api/v1/admin/settings/profile`
- `GET /api/v1/admin/settings/seo`
- `PUT /api/v1/admin/settings/seo`
- `GET /api/v1/admin/settings/analytics` (if section is exposed in UI)
- `PUT /api/v1/admin/settings/analytics`

### Interaction patterns

- segmented save behavior or unified save per form contract
- pending state on save button
- success confirmation feedback
- theme preference persisted immediately and also saved server-side

---

## 4. Layout System

## 4.1 App Shell

### Desktop

- left sidebar width: `240px` (settings variants may render `256px`; contract default is `240px`, allow token override)
- fixed vertical shell with:
  - brand block
  - primary navigation list
  - user identity footer
- top header for content screens: `80px` standard height

### Mobile/Tablet

- sidebar becomes overlay drawer
- top header keeps primary actions accessible
- content area keeps minimum `16px` horizontal padding

## 4.2 Content Containers

- dashboard content max width: `1200px`
- episodes list content max width: `1024px`
- settings content max width: `600px` centered
- editor content max width: `1600px` with split columns

## 4.3 Spacing Rhythm

Use tokenized spacing; observed Stitch rhythm maps to:

- micro: `4, 6, 8`
- control/layout: `10, 12, 16, 24`
- section/page: `32, 40, 48`

Rules:

- intra-card spacing: 16–24
- inter-section spacing: 32+
- page vertical padding: 32–48

## 4.4 Section Composition

- default separation is tonal surface layering, not hard borders
- cards and table shells may use subtle outline only when needed for clarity
- avoid stacked heavy shadows; use soft ambient elevation only for floating/sticky regions

## 4.5 Responsive Behavior

- tables: horizontal scroll first, card fallback if required by feature
- split editor: collapses to single column on narrow screens; metadata panel follows content
- sticky action bars must not obstruct primary fields on smaller viewports

---

## 5. Component System

All components must be implemented as reusable contracts in `packages/ui` (or app-level composition wrappers) and consume semantic tokens from `packages/design-tokens`.

## 5.1 Sidebar

### Variants

- `expanded` (desktop default)
- `overlay` (mobile)

### States

- active item: tinted background + left accent + emphasized icon/text
- hover item: subtle tonal highlight
- focus-visible item: high-contrast ring/outline

### Behavior rules

- active state derived from route segment
- keyboard-navigable links
- collapsed/overlay retains route parity and accessibility labels

## 5.2 Header

### Variants

- shell header (dashboard/list pages)
- editor context header (episode editor)

### States

- sticky on editor routes
- action buttons have pending/disabled states

## 5.3 Card

### Variants

- metric card
- list section card
- form section card

### States

- default, hover (interactive only), loading skeleton

### Rules

- elevate with tonal contrast first
- keep text hierarchy explicit (label, value, helper/meta)

## 5.4 Table (Episodes list)

### Variants

- default data table
- compact table (if needed for denser modules)

### Required states

- loading (skeleton rows)
- empty (no results or no data yet)
- error (inline recoverable error with retry)
- row hover/focus

### Behavior rules

- columns: number, title/meta, status, publish date/actions
- status badge rendering from domain status
- pagination controls disabled at boundaries

## 5.5 Form (Episode edit, Settings)

### Variants

- standard stacked form
- split editor form with metadata aside

### Required states

- pristine, dirty, submitting, success, validation error, server error

### Behavior rules

- inline field validation (Zod + RHF contract)
- helper and error text zones fixed per field
- primary action and secondary action semantics stable across forms

## 5.6 Buttons

### Variants

- primary (filled accent)
- secondary (tonal)
- tertiary (ghost/text)
- destructive

### Required states

- default, hover, active, focus-visible, disabled, loading

### Rules

- primary reserved for single dominant action per zone
- loading buttons preserve width to avoid layout shift

## 5.7 Inputs

### Variants

- text
- password with visibility toggle
- textarea
- select
- search input with leading icon

### Required states

- default, focus, filled, invalid, disabled

### Rules

- control height baseline around `42px` for standard fields
- focus ring color derived from accent token
- labels always visible; placeholder is never label substitute

---

## 6. Visual & Theme System

## 6.1 Visual Principles (Stitch-aligned)

1. No heavy separator lines as primary structure mechanism.
2. Elevation by surface tone shifts before shadows.
3. Spacing and typography define hierarchy.
4. Accent color is sparse and intentional (actions, active nav, chips, focus).

## 6.2 Light/Dark Parity

Each screen must preserve:

- identical layout and interaction structure in both themes
- equivalent hierarchy contrast
- equivalent state distinguishability (hover/focus/disabled/error)

## 6.3 Surface Layer Model

Required semantic layers:

- `background` (page canvas)
- `container` (main shell and cards)
- `elevated` (floating/sticky elements, overlays)

These map to theme tokens and must not be hardcoded in feature components.

## 6.4 Text Hierarchy

- `text/primary`: page and control content
- `text/secondary`: helper and metadata
- `text/inverse`: on accent/high emphasis surfaces

## 6.5 Accent Usage

Accent (`primary`) is allowed for:

- primary CTA backgrounds
- active navigation markers
- focus and selection indicators
- draft/state chips (tinted)

Not allowed for:

- large area backgrounds
- body text defaults
- repeated decorative accents that reduce signal clarity

## 6.6 Token Enforcement

- all colors, radii, spacing, and typography are token-backed
- Tailwind config maps to semantic CSS variables
- no direct brand/logo hardcoding in component implementations

---

## 7. Data & API Integration

## 7.1 API Strategy

- OpenAPI contract is single source for request/response types
- client generated and centralized in `packages/api-client`
- UI modules consume typed hooks/adapters

## 7.2 Screen-to-API Mapping

## Login

- `POST /api/v1/admin/auth/token`
- optional background refresh: `POST /api/v1/admin/auth/refresh-token`

UI mapping:

- form submit -> auth mutation
- field errors -> inline messages
- credential failure -> form-level error callout

## Dashboard

- `GET /api/v1/admin/dashboard/summary` (required)

UI mapping:

- metric cards bind summary counters
- drafts list binds `recentDrafts[]`
- activity feed binds `recentActivities[]`

## Episodes List

- `GET /api/v1/admin/episodes`

UI mapping:

- table rows map paginated `items[]`
- status chip maps `active/published` fields
- pagination controls map cursor/page metadata

## Episode Edit/New

- `GET /api/v1/admin/episodes/{id}`
- `POST /api/v1/admin/episodes`
- `PUT /api/v1/admin/episodes/{id}`
- `POST /api/v1/admin/images/upload`
- optional `POST /api/v1/admin/images/delete`

UI mapping:

- left editor fields map content payload
- right metadata fields map `EpisodeRequest` attributes
- sticky footer actions trigger save/publish mutations

## Settings

- `GET/PUT /api/v1/admin/settings/profile`
- `GET/PUT /api/v1/admin/settings/seo`
- `GET/PUT /api/v1/admin/settings/analytics` (if visible)

UI mapping:

- section forms map to endpoint slices
- theme selection maps to preference write + local immediate apply

## 7.3 Loading, Empty, Error Contracts

Every data screen must define:

- loading skeleton state
- empty state with explanatory copy + next action
- error state with actionable retry

Required by screen:

- dashboard widgets: partial failure tolerant (one widget can fail without blanking page)
- episodes table: full-state empty/error rows
- settings sections: per-section save and error feedback

## 7.4 Error Normalization

Normalize backend errors into a UI-safe shape:

- `status`
- `title`
- `detail`
- `fieldErrors?`
- `traceId?`

Mapping rules:

- validation errors -> field-level messages
- auth errors -> session handling/redirect
- system/network errors -> retry surface + telemetry event

---

## 8. State Management

## 8.1 Server State

TanStack Query is mandatory for async server state in admin.

Standard query keys:

- `["dashboard","summary"]`
- `["episodes", params]`
- `["episode", id]`
- `["settings","profile"]`
- `["settings","seo"]`
- `["settings","analytics"]`

Mutation rules:

- targeted invalidation only
- preserve optimistic updates for low-risk interactions
- rollback required when optimistic update used

## 8.2 Form State

- React Hook Form + Zod for schema validation
- inline error rendering at field level
- dirty state used to guard navigation and destructive dismissals

## 8.3 UI State

Local/shared UI state includes:

- sidebar open/collapse
- theme preference UI
- transient component UI (dialogs, inline editors, toasts)

No broad global state library required beyond Query + lightweight context/hooks.

---

## 9. Authentication & Security

## 9.1 Session Architecture

- access token: short-lived, httpOnly cookie
- refresh token: rotating httpOnly cookie
- secure cookie attributes (`Secure`, appropriate `SameSite`, scoped domain/path)

## 9.2 Route Protection

- middleware protects all `(admin)` routes
- unauthenticated access redirects to `/login`
- authenticated access to `/login` redirects to `/dashboard`

## 9.3 Security UX Rules

- no token storage in localStorage/sessionStorage
- auth failures are explicit and user-readable (no silent loops)
- destructive actions (delete/publish override) require confirmation dialog
- future-sensitive settings may require re-auth gate (planned extension)

---

## 10. UX Rules

These rules are mandatory and testable.

1. Tables must implement loading, empty, and error states.
2. Forms must validate inline and show field-level errors.
3. Destructive actions must require explicit confirmation.
4. Primary action per zone must be visually dominant and unique.
5. Keyboard navigation and focus-visible states are required on all interactive controls.
6. Status cannot rely on color only; include text/icon semantics.
7. Save actions must show pending and completion feedback.
8. Theme switch must update UI immediately and persist preference.
9. Row/card hover styles must be subtle tonal shifts, not abrupt color inversions.
10. Layout changes across breakpoints must preserve action discoverability.

---

## 11. Observability

## 11.1 Logging

Use structured logging abstraction with levels:

- `debug` (dev)
- `info`
- `warn`
- `error`

## 11.2 Telemetry Events (minimum)

- login success/failure
- dashboard load failure
- episodes fetch failure
- save draft/publish success/failure
- settings save success/failure

## 11.3 Traceability

Error surfaces should carry/record trace correlation (`traceId`) when available from API responses.

## 11.4 UX + Observability Link

Each error UI shown to users must have a corresponding logged event with module/action context.

---

## 12. Monorepo & Architecture

## 12.1 Package Responsibilities

- `apps/admin`: route composition and feature orchestration
- `packages/ui`: reusable components (table/form/card/shell primitives)
- `packages/design-tokens`: semantic visual tokens and theme files
- `packages/api-client`: generated contracts + typed API helpers

## 12.2 Frontend Architecture Rules

- App Router route groups for `(auth)` and `(admin)`
- business logic in feature modules, not page files
- no duplicated API mapping logic across screens
- no hardcoded design constants in features

## 12.3 Implementation Readiness for Next.js + Tailwind

- server-aware theme bootstrap using cookie to prevent flash/mismatch
- Tailwind theme values map to semantic CSS variables
- client components used only where interactivity requires

---

## 13. Edge Cases & Risks

1. **Dashboard endpoint gap**
   - Risk: client aggregation complexity and inconsistent metrics.
   - Mitigation: require dedicated `/admin/dashboard/summary` endpoint.

2. **Settings endpoint maturity**
   - Risk: missing or fragmented backend settings APIs.
   - Mitigation: formalize profile/seo/analytics endpoint slices as required contracts.

3. **Theme drift between screens**
   - Risk: light/dark mismatch and visual inconsistency.
   - Mitigation: enforce semantic token usage and parity checks across all mapped routes.

4. **OpenAPI schema inconsistencies**
   - Risk: generated type mismatch and runtime errors.
   - Mitigation: treat generated contracts as source, patch backend schema issues quickly.

5. **Responsive table/editor complexity**
   - Risk: reduced usability on narrow screens.
   - Mitigation: explicit responsive fallback rules and accessibility verification.

6. **Unsaved edits loss in editor/settings**
   - Risk: accidental navigation data loss.
   - Mitigation: dirty-state route guards and explicit confirm dialogs.

---

## 14. Acceptance Criteria

This specification is accepted when all criteria below are true:

1. The document follows the exact 14-section structure defined in the request.
2. Route definitions fully cover login, dashboard, episodes list/edit/new, and settings.
3. Layout system rules define shell, container widths, spacing rhythm, section composition, and responsive behavior.
4. Component contracts define variants, states, token usage, and behavior for table, form, card, sidebar, header, buttons, and inputs.
5. Visual and theme rules enforce Stitch-aligned principles (tonal layering, spacing hierarchy, light/dark parity, controlled accent usage).
6. Data integration maps screen UI elements to concrete API endpoints including loading/empty/error behavior.
7. Existing strengths are preserved and connected to UI behavior (auth/session, OpenAPI + TanStack Query, observability, monorepo architecture).
8. UX rules are explicit, testable, and implementation-ready.
9. The specification removes ambiguity between design intent and engineering implementation for the scoped screens.
