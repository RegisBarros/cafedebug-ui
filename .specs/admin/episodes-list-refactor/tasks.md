# Tasks: Episodes List — Stitch Fidelity Refactor

| Field | Value |
|---|---|
| **Status** | `Implemented` |
| **Spec** | `.specs/admin/episodes-list-refactor/spec.md` |
| **Design** | `.specs/admin/episodes-list-refactor/design.md` |

---

## Phase 1 — Spec & Design (✅ Complete)

- [x] Gap analysis between current implementation and Stitch reference
- [x] Write `spec.md`
- [x] Write `design.md`
- [x] Write `tasks.md`

---

## Phase 2 — Component Decomposition (✅ Complete)

- [x] `use-debounced-search.ts` — debounce + filter hook
- [x] `episode-status-badge.tsx` — Published / Draft chip
- [x] `episodes-search-bar.tsx` — search input with icon
- [x] `episodes-pagination.tsx` — icon buttons + "Showing X to Y"
- [x] `episodes-empty-state.tsx` — empty state UI
- [x] `episodes-error-state.tsx` — error state UI
- [x] `episodes-table.tsx` — full table with skeleton; uses badge component
- [x] Refactored `episodes-list-page.tsx` to thin orchestrator

---

## Phase 3 — Visual Fidelity Fixes (✅ Complete)

- [x] Header typography (`text-headline-lg font-display font-bold`) + subtitle + CTA `add` icon

---

## Phase 4 — Validation (✅ Complete)

- [x] TypeScript typecheck passes (exit 0)
- [x] ESLint passes (0 errors, pre-existing warnings only)
- [x] No hardcoded hex colors in any new component
- [x] `aria-label` on icon-only pagination buttons
- [x] Published/Draft badges include text label (not color-only)
- [x] Row click navigates to `/episodes/[id]/edit`
- [x] Search debounce: 300ms via `use-debounced-search`
- [x] Loading skeleton: 4-column layout
- [x] Error state: `role="alert"`, retry button
- [x] Empty state: search-aware copy + Clear search button

---

## Phase 5 — Documentation (✅ Complete)

- [x] `spec.md` status updated to `Implemented`
- [x] `tasks.md` updated with final checklist

Break `episodes-list-page.tsx` (400-line God Component) into the following:

### 2.1 `use-debounced-search.ts` (new hook)

**File:** `features/episodes/hooks/use-debounced-search.ts`

Responsibility:
- Accepts `searchInput: string` and `episodes: EpisodeRecord[]`
- Internally debounces input (300ms)
- Returns `filteredItems: EpisodeRecord[]` and `searchTerm: string`
- Contains `filterEpisodes` and `toSearchCandidate` logic (moved from page)

### 2.2 `episode-status-badge.tsx` (new component)

**File:** `features/episodes/components/episode-status-badge.tsx`

Responsibility:
- Props: `active: boolean`
- Renders "Published" (neutral, `rounded-[4px]`) or "Draft" (heat, `rounded-[4px]`) badge
- Uses only design-token Tailwind classes

### 2.3 `episodes-search-bar.tsx` (new component)

**File:** `features/episodes/components/episodes-search-bar.tsx`

Responsibility:
- Props: `value: string`, `onChange: (value: string) => void`
- Renders full-width search bar with `search` Material Symbol icon
- Focus ring via `focus-within` on container

### 2.4 `episodes-pagination.tsx` (new component)

**File:** `features/episodes/components/episodes-pagination.tsx`

Responsibility:
- Props: `page`, `pageSize`, `totalCount`, `hasPrevious`, `hasNext`, `isFetching`, `onPrevious`, `onNext`
- Renders "Showing X to Y of Z episodes" text
- Renders icon-only `chevron_left` / `chevron_right` buttons with `aria-label`

### 2.5 `episodes-empty-state.tsx` (new component)

**File:** `features/episodes/components/episodes-empty-state.tsx`

Responsibility:
- Props: `searchTerm: string`, `onClearSearch: () => void`
- Renders correct title/description/CTAs based on whether search is active

### 2.6 `episodes-error-state.tsx` (new component)

**File:** `features/episodes/components/episodes-error-state.tsx`

Responsibility:
- Props: `error: AdminRouteError`, `onRetry: () => void`
- Renders error title, detail, optional traceId, retry button

### 2.7 `episodes-table.tsx` (new component)

**File:** `features/episodes/components/episodes-table.tsx`

Responsibility:
- Props: `items: EpisodeRecord[]`
- Renders table with correct 4 columns
- Rows are clickable (`useRouter`) and navigate to edit page
- Uses `EpisodeStatusBadge`
- Date formatted as date-only with `—` fallback

### 2.8 Refactor `episodes-list-page.tsx` (thin orchestrator)

**File:** `features/episodes/episodes-list-page.tsx` (kept at same path per architecture)

Responsibility after refactor:
- Holds pagination state (`page`, `pageSize`, `sortBy`, `descending`) — or move to `use-episodes-list.ts`
- Holds `searchInput` state
- Calls `useEpisodesList` hook
- Delegates to sub-components for all rendering
- Uses `normalizedError` from a small inline helper or a shared utility
- Logs error events (observability concern stays in orchestrator)

---

## Phase 3 — Visual Fidelity Fixes

Apply design corrections per `design.md`:

| Fix | Where | Token/class to use |
|---|---|---|
| Page title typography | `episodes-list-page.tsx` header | `font-display text-headline-lg font-bold text-on-surface` |
| Subtitle copy | `episodes-list-page.tsx` header | `"Manage, edit, and publish your podcast content."` |
| CTA: add `+` icon | `episodes-list-page.tsx` header | `add` Material Symbol `text-[18px]`, layout `flex items-center gap-2` |
| Search bar | `episodes-search-bar.tsx` | Per design §3 |
| Column names | `episodes-table.tsx` | `Number`, `Title`, `Status`, `Publish Date` |
| Table header bg | `episodes-table.tsx` | `bg-surface-container-low border-b border-outline-variant/60` |
| Status badge shape | `episode-status-badge.tsx` | `rounded-[4px]` not `rounded-full` |
| Published badge | `episode-status-badge.tsx` | `bg-gray-100 text-on-surface` |
| Draft badge | `episode-status-badge.tsx` | `bg-orange-50 text-primary border border-orange-100` |
| Date format | `episodes-table.tsx` | `dateStyle: "medium"` (date only, no time) |
| Date fallback | `episodes-table.tsx` | `—` (em-dash) not `"Not published"` |
| Row interaction | `episodes-table.tsx` | `cursor-pointer` + `useRouter().push()` |
| Remove "Edit" link | `episodes-table.tsx` | Row click replaces separate edit link |
| Pagination text | `episodes-pagination.tsx` | `"Showing X to Y of Z episodes"` |
| Pagination buttons | `episodes-pagination.tsx` | Icon-only with `aria-label` |
| Pagination disabled | `episodes-pagination.tsx` | `disabled:opacity-50` + `aria-disabled` |
| Skeleton columns | `episodes-table.tsx` (loading branch) | 4-column skeleton aligned with new layout |

---

## Phase 4 — Validation

Checklist before marking implementation done:

- [ ] No hardcoded hex colors in any new component
- [ ] No arbitrary spacing values (use token scale only)
- [ ] `font-body` / `font-display` used instead of raw font names
- [ ] All interactive elements have `:focus-visible` style
- [ ] Icon-only buttons have `aria-label`
- [ ] Published/Draft badges are distinguishable without color alone (text label present)
- [ ] Row click navigates correctly to `/episodes/[id]/edit`
- [ ] Search debounce works (300ms delay)
- [ ] Loading skeleton renders while query is fetching
- [ ] Error state renders with retry
- [ ] Empty state renders with and without search term
- [ ] TypeScript: no `any` types introduced
- [ ] Existing behavior unchanged: pagination, sort, API calls

---

## Phase 5 — Documentation

- [ ] Update this tasks file with final status
- [ ] Mark spec status as `Implemented`
