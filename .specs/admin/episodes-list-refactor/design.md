# Design: Episodes List — Stitch Fidelity Refactor

| Field | Value |
|---|---|
| **Status** | `In Progress` |
| **Source of truth** | `.specs/admin/stitch/cafedebug-admin/code/themes/*/episode-list.html` |
| **Visual reference** | `.specs/admin/stitch/cafedebug-admin/images/themes/*/episodes-list.png` |
| **Token source** | `.specs/admin/DESIGN_SYSTEM.md` + `packages/design-tokens/styles.css` |

---

## 1. Layout Structure

```
[Sidebar (AdminShellSidebar)]  [Main Content]
                                ┌──────────────────────────────┐
                                │  Header (title + CTA)        │
                                │  Search Bar                  │
                                │  Data Table                  │
                                │    └─ Pagination Footer      │
                                └──────────────────────────────┘
```

- Content max-width: `max-w-[1024px]` centered, `px-8 py-10`
- Vertical gap between sections: `gap-8` (flex column)

---

## 2. Page Header

```
[Episodes]                              [+ New Episode ▶]
[Manage, edit, and publish...]
```

| Element | Token / Class |
|---|---|
| Title | `font-display text-headline-lg font-bold text-on-surface` |
| Subtitle | `font-body text-body-md text-on-surface-variant` |
| CTA surface | `bg-primary hover:bg-primary-strong` (gradient optional per DESIGN_SYSTEM §5.1) |
| CTA text | `text-on-primary font-display font-semibold text-sm` |
| CTA height | `h-10` |
| CTA padding | `px-5` |
| CTA radius | `rounded-lg` |
| Icon | `add` Material Symbol, `text-[18px]` |

---

## 3. Search Bar

```
[🔍 Search episodes by title, guest, or keyword...         ]
```

| Element | Token / Class |
|---|---|
| Container | `bg-surface-container-lowest rounded-lg shadow-ambient border border-outline-variant/60` |
| Container height | `h-12` |
| Focus ring | `focus-within:ring-2 focus-within:ring-focus-ring focus-within:border-primary` |
| Transition | `transition-shadow transition-border duration-200` |
| Icon | `search` Material Symbol, `text-on-surface-variant mr-3` |
| Input | `bg-transparent border-none outline-none font-body text-base text-on-surface placeholder:text-on-surface-variant focus:ring-0 w-full h-full` |

---

## 4. Data Table

### Table Container

| Element | Token / Class |
|---|---|
| Wrapper | `bg-surface-container-lowest rounded-lg border border-outline-variant/60 shadow-ambient overflow-hidden` |
| Table | `w-full text-left border-collapse` |

### Table Header Row

| Element | Token / Class |
|---|---|
| Row bg | `bg-surface-container-low` |
| Bottom border | `border-b border-outline-variant/60` |
| Cell | `py-4 px-6 font-display font-semibold text-sm text-on-surface` |
| `Number` col | `w-16` |
| `Status` col | `w-1/6` |
| `Publish Date` col | `w-1/6` |

### Table Body Rows

| Element | Token / Class |
|---|---|
| Divide | `divide-y divide-outline-variant/40` |
| Row base | `group cursor-pointer transition-colors duration-150` |
| Row hover | `hover:bg-gray-50` |
| Number cell | `py-4 px-6 text-on-surface font-medium text-sm` |
| Title (primary) | `text-on-surface font-medium group-hover:text-primary transition-colors` |
| Title (subtitle) | `text-on-surface-variant text-sm mt-0.5` |
| Date cell | `text-on-surface-variant text-sm` |

### Status Badge Variants

**Published:**
```html
<span class="inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-gray-100 text-on-surface">
  Published
</span>
```

**Draft:**
```html
<span class="inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-orange-50 text-primary border border-orange-100">
  Draft
</span>
```

> Note: These token aliases (`bg-surface-container-high`, `text-primary`, etc.) map to the CSS custom properties in `packages/design-tokens/styles.css` and are available via Tailwind config in `apps/admin`.

---

## 5. Pagination Footer

```
[Showing 1 to 10 of 44 episodes]       [◀] [▶]
```

| Element | Token / Class |
|---|---|
| Container | `px-6 py-4 border-t border-outline-variant/60 bg-surface-container-low flex items-center justify-between` |
| Copy | `text-sm text-on-surface-variant` |
| Icon button base | `p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors` |
| Disabled state | `disabled:opacity-50` |
| Icon | `chevron_left` / `chevron_right`, `text-[20px]` Material Symbol |

---

## 6. Loading Skeleton (5 rows)

```
[████████]  [████████████████████████]  [████████]  [████████████]
```

| Element | Token / Class |
|---|---|
| Skeleton pulse | `inline-block animate-pulse rounded bg-surface-container-high` |
| Number skeleton | `h-3 w-10` |
| Title skeleton | `h-3 w-56` |
| Status skeleton | `h-5 w-20 rounded-[4px]` |
| Date skeleton | `h-3 w-24` |

---

## 7. Empty State

```
[No episodes available yet]
[Create your first episode to populate this table.]
[Create first episode]  [Clear search (conditional)]
```

| Element | Token / Class |
|---|---|
| Container | `rounded-lg border border-outline-variant/60 bg-surface-container p-6 space-y-3` |
| Title | `text-lg font-semibold text-on-surface` |
| Description | `text-sm text-on-surface-variant` |
| Primary CTA | `inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary` |
| Secondary CTA | `inline-flex h-10 items-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface` |

---

## 8. Error State

| Element | Token / Class |
|---|---|
| Container | `rounded-lg border border-danger bg-surface-container p-4 space-y-3` |
| Title | `text-sm font-semibold text-danger` |
| Detail | `text-sm text-on-surface-variant` |
| TraceId | `text-xs text-on-surface-variant` + `<code>` for the value |
| Retry button | `inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary` |

---

## 9. Light vs Dark Theme Mapping

The Stitch HTML uses custom color names (`background-light`, `surface-light`, etc.) which are approximations.
The production implementation uses the unified token system from `DESIGN_SYSTEM.md`:

| Stitch (light) | Stitch (dark) | Production token |
|---|---|---|
| `#FAFAFA` bg | `#0F0F11` bg | `bg-surface` |
| `#FFFFFF` surface | `#18181B` surface | `bg-surface-container-lowest` |
| `#EAEAEA` border | `#27272A` border | `border-outline-variant/60` |
| `#1A1A1A` text | `#F4F4F5` text | `text-on-surface` |
| `#878787` muted | `#A1A1AA` muted | `text-on-surface-variant` |
| `#f56e3d` primary | `#FF6B35` primary | `text-primary` / `bg-primary` |
| `bg-gray-50/50` thead | `bg-white/5` thead | `bg-surface-container-low` |
| `bg-gray-100` published badge | `bg-white/10` published badge | `bg-surface-container-high` |
| `bg-orange-50` draft badge | `bg-primary/10` draft badge | `bg-primary/10` |

> The production tokens automatically adapt to light/dark via CSS custom properties.
> No `dark:` Tailwind prefix is needed when using the token alias classes.
