# CafeDebug Admin Design Handoff (Figma -> Frontend)

> Note: `.specs/admin/DESIGN_SYSTEM.md` is the canonical design-system specification. This file is a Figma implementation handoff/reference document.

## Summary

This document is the admin-only frontend design handoff for the CafeDebug Figma file.

It translates the Figma source into implementation guidance for `apps/admin`, aligned with:

- `.specs/admin/admin-plan.md`
- `docs/design-system.md`
- token-first rules (`packages/design-tokens`)

## Design Source of Truth

- Figma file: `https://www.figma.com/design/5xFIjg0G3RK5mKspENQ5VI/CafeDebug`
- File key: `5xFIjg0G3RK5mKspENQ5VI`
- Primary implementation references:
  - `Login - Light Mode (Updated)` (`1:2`)
  - `Login - Dark Mode (CafeDebug)` (`1:856`)
  - `Home (Dashboard) - Updated Activity` (`1:1072`)
  - `Home (Dashboard) - Dark Mode` (`1:372`)
  - `Episodes List - Updated Columns` (`1:1257`)
  - `Episodes List - Dark Mode - Updated Columns` (`1:75`)
  - `Episode Editor - Updated Layout` (`1:557`)
  - `Episode Editor - Dark Mode - Updated Layout` (`1:705`)
  - `Settings` (`1:934`)
  - `Settings - Dark Mode` (`1:234`)
- Additional visual validation references (provided during planning):
  - Settings light screenshot (profile + podcast metadata + theme section)
  - Dashboard light screenshot (overview metrics + drafts + activity)

## Route to Frame Mapping

| Admin Route | Light Frame | Dark Frame |
| --- | --- | --- |
| `/login` | `1:2` | `1:856` |
| `/dashboard` | `1:1072` | `1:372` |
| `/episodes` | `1:1257` | `1:75` |
| `/episodes/new` and `/episodes/[id]/edit` | `1:557` | `1:705` |
| `/settings` | `1:934` | `1:234` |

## Layout System

### Desktop base (all referenced admin screens)

- Main artboards are `1280x1024`.
- Two shell variants exist:
  - Sidebar `240px` (`Dashboard`, `Episodes`).
  - Sidebar `256px` (`Settings`).
- Header/top bar height:
  - Dashboard shell: `80px`.
  - Episode editor header: `69px`.
- Content containers:
  - Dashboard content wrapper: max width `1200px`, inner padding `32px`.
  - Settings form wrapper: max width `600px`, centered with side gutters.
  - Episodes list table area: content width ~`960px`.

### Grid and section rhythm

- Dashboard metrics: 3-column grid with `24px` column gaps.
- Large vertical section rhythm commonly uses `32px` or `48px`.
- Form sections (Settings): grouped cards with `24px` internal spacing.

## Token Extraction (from Figma references)

Use semantic tokens in `packages/design-tokens`; do not hardcode these in feature components.

### Colors observed in light mode references

- Page background: `#fafafa`
- Surface/card: `#ffffff`
- Primary text: `#1a1a1a`
- Secondary text: `#878787`
- Border/default stroke: `#eaeaea`
- Brand orange (settings variant): `#ff6b35`
- Brand orange (dashboard variant): `#f56e3d`
- Brand tint bg (active row/card): `rgba(255,107,53,0.05)` and `rgba(245,110,61,0.05)`
- Draft badge bg/border: `rgba(245,110,61,0.1)` / `rgba(245,110,61,0.2)`
- Success accent: `#10b981`

### Shadows observed

- Card/elevated panel: `0px 8px 30px 0px rgba(0, 0, 0, 0.04)`
- Small button shadow: `0px 1px 2px 0px rgba(0, 0, 0, 0.05)`
- Avatar/button micro-elevation: `0px 4px 6px -1px rgba(0,0,0,0.1)` + `0px 2px 4px -2px rgba(0,0,0,0.1)`

### Radius scale observed

- `4px`: small icon tiles, compact badges
- `6px`: inputs and secondary action buttons
- `8px`: primary app controls and cards in dashboard
- `16px`: settings cards and theme-option cards
- `9999px`: circular avatar and icon surfaces

### Spacing scale observed

Core values used repeatedly: `4, 6, 8, 10, 12, 16, 18, 24, 25, 32, 48`.

## Typography System (observed in references)

### Heading family

- `Space Grotesk` is used for major headings and high-emphasis labels.
- Typical heading sizes:
  - Page title: `24/32` or `30/36`
  - Section title: `18/28` or `20/28`
  - Metric values: `32/32`

### Body and UI text

- Body and forms appear with `Liberation Sans` in settings/login references.
- Dashboard/list variants include `Cabinet Grotesk` for data labels and metadata.
- Common sizes:
  - Primary body/label: `14/20`
  - Supporting metadata: `12/16`
  - Sidebar minor label: `10/15` to `12/16`

### Implementation note (important)

Figma currently mixes `Liberation Sans` and `Cabinet Grotesk` for body text across frames.  
Before broad implementation, align on a single body font token for admin to avoid inconsistent rendering and style drift.

## Component Inventory and States

### App shell

- Sidebar with brand block, nav list, and bottom user identity.
- Active nav item:
  - left border `2px`
  - tinted background
  - orange text/icon.
- Inactive nav item:
  - neutral text (`#878787` in dashboard references).

### Header actions

- Theme toggle/icon button.
- Primary CTA (`New Episode`) with icon + label.

### Cards

- Metrics cards: title + icon + main value + secondary context line.
- Content cards: bordered white surface with subtle shadow.

### Form fields

- Text input standard height: `42px`.
- Textarea variant in settings metadata section.
- Leading icon input variants in login/editor sidebars.
- Label spacing pattern: label + `6px` gap + input control.

### Buttons

- Primary: filled brand orange, white text.
- Secondary/tertiary: neutral backgrounds (`#f3f4f6` / transparent) with dark text.
- Footer action pairs in settings/editor: discard + save/publish.

### Data table (episodes list)

- Header row with 4 columns:
  - episode number
  - title/guest
  - status
  - published date/actions
- Rows include status badges (`Published`, `Draft`) and right-side action affordance.
- Pagination footer with previous/next icon controls.

### Status badges

- Draft badge: orange tint background + orange text.
- Published badge: neutral/filled variant depending on frame.

### Activity feed

- Dot-based status marker with semantic colors:
  - orange
  - gray
  - green
- Item includes title, actor/source, and relative timestamp.

## Screen-Level Guidance

### Login (`1:2`, `1:856`)

- Centered auth card with:
  - email input
  - password input with visibility action
  - remember-me checkbox
  - forgot-password link
  - primary sign-in button.
- Keep auth layout independent from admin shell (`(auth)` route group).

### Dashboard (`1:1072`, `1:372`)

- 3 metric cards at top.
- Recent Drafts section as list/card rows with small status badge.
- Recent Activity section with semantic status dots.
- Top-right quick actions: theme button + `New Episode`.

### Episodes list (`1:1257`, `1:75`)

- Header with title/subtitle and `New Episode` CTA.
- Search input spans row below header.
- Bordered data table with compact row rhythm.
- Status chip and row action affordance are mandatory elements.

### Episode editor (`1:557`, `1:705`)

- Two-column layout:
  - left: large title input + markdown editor
  - right: metadata controls (cover, audio URL, category, publish date, tags).
- Sticky action footer contains draft/save/publish patterns.
- Preserve the editor toolbar grouping with separators.

### Settings (`1:934`, `1:234`)

- Centered content column (`max-width: 600px`) inside app shell.
- Sections:
  - Profile
  - Podcast Metadata
  - Theme Preferences
  - Footer form actions.
- Theme preference uses three option cards (System/Light/Dark).

## Responsive and Interaction Expectations

### Responsive

- Mobile/tablet comps are not explicitly defined in the referenced admin frames.
- Implement using admin-plan shell rules:
  - sidebar collapse/drawer behavior for narrow viewports
  - preserve table usability via horizontal overflow or adaptive list fallback
  - keep footer actions reachable without overlap.

### Interaction states to implement (not fully shown in Figma)

- Inputs: hover, focus-visible, error, disabled.
- Buttons: hover, pressed, disabled.
- Table rows: hover/focus and keyboard navigation support.
- Async states: loading skeletons and empty states for dashboard lists/tables.
- Error states: inline form errors + page-level retrieval failure states.

## Accessibility Requirements

- Ensure WCAG-compliant contrast for orange-on-light and gray-on-light text.
- Add visible `:focus-visible` rings for all keyboard targets.
- Ensure semantic form labeling and error association (`aria-describedby`).
- Keep minimum interactive hit area at least `40x40` where possible.
- Avoid color-only status communication (badge text + marker shape).

## Frontend Implementation Checklist

- Map colors/typography/spacing into semantic tokens in `packages/design-tokens`.
- Keep implementation in shared primitives (`packages/ui`) for:
  - shell/sidebar item
  - metric card
  - status badge
  - table row/cell patterns
  - settings form card.
- Use generated API contracts from `packages/api-client` for data screens.
- Keep business logic in feature modules, not route page files.
- Avoid hardcoded values for colors/logo/base URLs.

## Known Gaps / Clarifications Needed

- Body font usage is inconsistent across frames (`Liberation Sans` vs `Cabinet Grotesk`).
- Orange token appears as two close values (`#ff6b35` and `#f56e3d`).
- Dark mode token extraction should be verified against Figma variables before final token freeze.
- If a final design-system node exists in Figma, map it directly to `packages/design-tokens` in a follow-up pass.
