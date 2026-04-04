# Spec: Episodes List — Stitch Fidelity Refactor

| Field | Value |
|---|---|
| **Status** | `Implemented` |
| **Domain** | `admin/episodes` |
| **Spec path** | `.specs/admin/episodes-list-refactor/` |
| **Affected app** | `apps/admin` |
| **API endpoint** | `GET /api/v1/admin/episodes` |
| **Source of truth** | `.specs/admin/stitch/cafedebug-admin/code/themes/*/episode-list.html` |
| **Design system** | `.specs/admin/DESIGN_SYSTEM.md` |

---

## 1. Problem Statement

The current `/episodes` page (`features/episodes/episodes-list-page.tsx`) deviates from the Stitch design reference in multiple areas: typography, badge shape/color, table column names, row interaction model, pagination controls, and search bar layout.

Additionally, the single 400-line component violates the feature-based architecture by mixing state management, data fetching, error handling, and all UI rendering in one file.

This spec defines the **full correction** targeting pixel-level fidelity to Stitch while enforcing design tokens and component decomposition.

---

## 2. Scope

### In scope

| Area | Detail |
|---|---|
| Page header | Typography (`text-headline-lg`), subtitle copy, CTA button with `+` icon |
| Search bar | Full-width single input with `search` icon; debounced client-side filter |
| Table structure | Column rename, remove "Edit" link, make rows navigable |
| Status badges | `EpisodeStatusBadge` component with correct token-based variants |
| Date formatting | Date-only display (`Oct 24, 2023`), em-dash (`—`) for unpublished |
| Row interaction | Entire row navigates to edit page (`/episodes/[id]/edit`) |
| Pagination footer | Icon-only prev/next buttons; "Showing X to Y of Z episodes" copy |
| Component decomposition | Extract sub-components per feature architecture rules |
| Loading skeleton | Aligned with new 4-column layout |

### Out of scope

| Area | Reason |
|---|---|
| Sort controls | Stitch does not show sort controls on the list page; hidden as secondary concern |
| Episode creation flow | Separate feature |
| Episode editor | Separate feature |
| Sidebar / shell layout | Out of scope for this refactor |

---

## 3. User Context

| Dimension | Detail |
|---|---|
| **Audience** | Admin users managing podcast content |
| **Entry point** | `/episodes` |
| **Primary action** | Browse, search, and navigate to edit an episode |
| **Secondary action** | Create a new episode |

---

## 4. Functional Requirements

### 4.1 Page Header

- Title: `"Episodes"` — rendered with `font-display text-headline-lg font-bold text-on-surface`
- Subtitle: `"Manage, edit, and publish your podcast content."` — `text-body-md text-on-surface-variant`
- CTA button: `"New Episode"` — primary variant with `add` Material Symbol icon (18px), links to `/episodes/new`

### 4.2 Search Bar

- Full-width, standalone, height `h-12`
- Left-aligned `search` Material Symbol icon (`text-on-surface-variant`)
- Input: borderless, transparent background, `font-body text-base text-on-surface`, placeholder: `"Search episodes by title, guest, or keyword..."`
- Container: `bg-surface-container-lowest rounded-lg shadow-ambient border border-outline-variant/60 focus-within:ring-2 focus-within:ring-focus-ring`
- Debounce: 300ms before applying client-side filter
- Filter criteria: `title + shortDescription + description + episode.number`

### 4.3 Data Table

#### Column layout

| Column | Width | Content |
|---|---|---|
| Number | `w-16` | Episode number as `#42` (`text-on-surface font-medium`) or `—` |
| Title | auto | Title (primary) + subtitle line (`shortDescription` or guest hint) |
| Status | `w-1/6` | `EpisodeStatusBadge` |
| Publish Date | `w-1/6` | Formatted date or `—` |

#### Table header row

- Background: `bg-surface-container-low` (tonal, no hard border)
- Typography: `font-display font-semibold text-sm text-on-surface`
- Bottom separator: `border-b border-outline-variant/60`

#### Table body rows

- Divide: `divide-y divide-outline-variant/40`
- Row hover: `hover:bg-surface-container transition-colors cursor-pointer`
- Clicking any row navigates to `/episodes/[id]/edit`
- Title cell hover: title text transitions to `text-primary`

#### Title cell layout

```
Episode Title (font-medium text-on-surface group-hover:text-primary)
Subtitle/guest line (text-body-sm text-on-surface-variant)
```

#### Number format

- Rendered as `#42` with `text-on-surface font-medium text-sm`

#### Date format

- `Intl.DateTimeFormat("en-US", { dateStyle: "medium" })` — date only
- Unpublished: renders `—`

### 4.4 Status Badge

Component: `EpisodeStatusBadge`

| State | Background | Text | Border | Radius |
|---|---|---|---|---|
| Published | `bg-surface-container-high` | `text-on-surface` | none | `rounded-[4px]` |
| Draft | `bg-primary-container/20` | `text-primary` | `border border-primary/30` | `rounded-[4px]` |

- Padding: `px-2.5 py-1`
- Font: `text-xs font-semibold`
- Must include visible text label (never color alone)

### 4.5 Pagination Footer

- Container: `px-6 py-4 border-t border-outline-variant/60 bg-surface-container-low flex items-center justify-between`
- Left: `"Showing {from} to {to} of {total} episodes"` — `text-sm text-on-surface-variant`
  - `from = (page - 1) * pageSize + 1`
  - `to = min(page * pageSize, totalCount)`
- Right: icon-only button group
  - Previous: `chevron_left` icon, `disabled` when `!hasPrevious || isFetching`
  - Next: `chevron_right` icon, `disabled` when `!hasNext || isFetching`
  - Button: `p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-50 transition-colors`

### 4.6 Loading State

- 5 skeleton rows aligned to the new 4-column layout
- Skeleton pulse: `animate-pulse rounded bg-surface-container-high`

### 4.7 Empty State

- Title: `"No episodes match your search"` (with search) / `"No episodes available yet"` (without)
- Description: appropriate helper copy
- CTAs: "Create first episode" (primary) + "Clear search" (secondary, only when search active)

### 4.8 Error State

- `role="alert"` container
- Error title and detail
- Optional traceId display
- "Retry fetch" primary button

---

## 5. Component Structure

```
features/episodes/
  components/
    episodes-list-page.tsx         ← thin orchestrator ("use client")
    episodes-search-bar.tsx        ← search input with icon
    episodes-table.tsx             ← table + skeleton/empty/error states
    episode-status-badge.tsx       ← Published / Draft chip
    episodes-pagination.tsx        ← footer with prev/next
    episodes-empty-state.tsx       ← empty state UI
    episodes-error-state.tsx       ← error state UI
  hooks/
    use-episodes-list.ts           ← TanStack Query (already exists)
    use-debounced-search.ts        ← debounce + client-side filter (new)
  services/
    episodes.service.ts            ← (no changes needed)
  types/
    episode.types.ts               ← (no changes needed)
```

---

## 6. API Contract

```
GET /api/admin/episodes?page={n}&pageSize={n}&sortBy={field}&descending={bool}
```

Response shape (via `EpisodesPageData`):

```ts
{
  items: EpisodeRecord[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
```

No changes needed to the API route or service layer.

---

## 7. Non-functional Requirements

- No hardcoded hex colors or arbitrary spacing in any new component
- All token references from `packages/design-tokens` via Tailwind class aliases
- `aria-label` on icon-only pagination buttons
- `aria-current="page"` not needed (table row context, not navigation)
- Keyboard: tab order preserved through search → table rows → pagination
