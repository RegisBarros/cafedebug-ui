# Design: Debuggers Page — Web Page Implementation Contract

| Field | Value |
| --- | --- |
| **Status** | `Implemented` |
| **Spec** | `.specs/web/debuggers-page/spec.md` |
| **Design source** | `cafedebug.pen` |
| **Desktop frames** | Dark `n4YNV`; Light `a0eA8` |
| **Responsive source** | Not represented by inspected Pencil frames |

## 1. Evidence ledger

### Direct Pencil evidence

| Surface | Dark node | Light node | Confirmed contract |
| --- | --- | --- |
| Page frame | `n4YNV` | `a0eA8` | `1440px` frame, `$--background`, vertical page composition. |
| Header | `IVrtQ` | `owHtO` | 72px high, 40px horizontal padding, Logo → Nav with 40px separation, Nav gap 28px, Search 40px and `Assinar` 40px action. |
| Intro | `zpNsT` | `VZL2a` | Eyebrow `COMUNIDADE`; 46/700 Geist title at 1.1; 17px Geist subtitle at 1.6; title width 820px, subtitle width 640px, 16px vertical gap. |
| Presenters | `jhQBT` | `Al6Ue` | First group; 26/700 title, 14px subtitle, 13px mono count; section/grid gap 28px. |
| First card | `g8MfmX` | `JW4sD` | `$--card`, `$--border` 1px inner stroke, `$--radius-m`, 28px padding, 14px vertical gap, centered content. |
| Contributors | `jooeF` | light equivalent exists within `a0eA8` | Second group with six members. |
| Community | `LCD3v` | light equivalent exists within `a0eA8` | Third group with three members. |
| Footer | `AO7S9` | `J0jnXN` | Shared multi-column footer, 56/40/32 padding and 40px main gap; its Comunidade entry currently says `Time`. |

Confirmed card anatomy is: 92px circular avatar (`fill` crop), 18/600 Geist name, 11/600 JetBrains Mono uppercase role with 1px tracking, centered 14px Geist biography at 1.55, then 8px top separation and a horizontal social row. Each visible social circle is 34x34 with 8px gap and a 15px icon. The Pencil reference shows GitHub, Twitter, and LinkedIn; the user-approved inventory additionally includes Instagram, X, and Bluesky. The desktop card grid uses three equal columns per row with 24px gaps. All three groups use this same anatomy in the inspected dark frame.

The exact evidence-backed copy/order is retained in `spec.md`; the implementation fixture must model it rather than independently hardcode group sections.

### Existing shared-system evidence

- `apps/web/src/app/(beta)/layout.tsx` owns the Beta layout composition with shared `Header` and `Footer`, passing the server-resolved theme preference.
- `Header` and `Footer` already expose Beta (theme-following) and fixed-dark variants. `MobileNav` is the sole compact-navigation interaction boundary at `< lg`; it has Escape, outside-click, breakpoint dismissal, and focus return behavior.
- `navigation-items.ts` is the one canonical primary-navigation model. `Footer` separately owns its visible column model; both must be updated as part of the shared rename.
- The root layout mounts `MiniPlayer`; `features/player/player-provider.tsx` owns the sole hidden audio element and shared playback state. No debugger component owns audio.
- `packages/web-design-tokens/styles.css` supplies semantic background/foreground/card/secondary/border/muted/primary tokens, Geist/JetBrains Mono aliases, `--radius-m` (16px), and `--radius-pill`.

### Resolved design decisions and recorded deltas

- No Pencil responsive artboards were available, so the delivered 2-column tablet and 1-column mobile grids are design-system decisions, not claimed Pencil pixel parity.
- The `Team Page` frame’s Portuguese people-page copy is retained; `Debuggers` is the shared navigation and route name.
- The delivered page intentionally uses the required Beta theme-toggle Header/Footer rather than forking the frame’s `Assinar` action.
- Existing `/mock/*` portraits replace the unshippable remote Pencil fills. The social row is visible even though no verified person destination was supplied: each requested platform renders a noninteractive 34px visual mark. `DebuggerCard` promotes only verified destinations to the approved accessible 40px target/34px visual treatment.

## 2. Captured evidence and deferred source material

The direct Pencil structural reads provide the desktop component contract. Runtime checks at 1440x1200, 768x1024, and 390x844 are recorded in `validation.md`, including the measured 72px Header, `[72,40,96,40]` main padding, 72px section gap, 24px desktop grid gap, 28px card padding, 14px card gap, and 92px avatars. The unchanged local-browser harness cannot change native zoom; visual reflow at 390px and absence of fixed text heights are the recorded automated resilience evidence. Future design work should still add Pencil tablet/mobile artboards and verified local asset/social source material.

## 3. Delivered page architecture

```text
apps/web/src/app/(beta)/debuggers/page.tsx       thin route + route metadata only
apps/web/src/features/debuggers/
  components/debuggers-page.tsx                  server-first page composition
  components/debugger-group.tsx                  group heading/count + card collection
  components/debugger-card.tsx                   one shared card visual responsibility
  mock/debuggers.mock.ts                         deterministic ordered fixtures
  types.ts                                       debugger/group/social contract
  services/list-debugger-groups.ts               local deterministic read seam
```

`DebuggerGroup` derives the displayed count from `members.length` and renders fixture order. `DebuggerCard` is the sole profile-card component and always renders the requested visual social inventory, promoting only declared URLs to links. No UI duplicate is introduced for presenters/contributors/community.

The `(beta)` route boundary does not compose Header/Footer itself; it inherits the shared route-group layout. The canonical Header/Footer models are the only place that changes `Time` to `Debuggers` and assigns `/debuggers`.

### Fixture contract

```ts
type DebuggerSocialLinks = {
  github?: string;
  twitter?: string;
  linkedin?: string;
};

type Debugger = {
  id: string;
  name: string;
  roles: readonly string[];
  biography: string;
  avatar: { src: string; alt: string };
  socialLinks: DebuggerSocialLinks;
};

type DebuggerGroup = {
  id: "presenters" | "contributors" | "community";
  title: string;
  description: string;
  members: readonly Debugger[];
};
```

`src` points to a checked-in local asset, never the remote Pencil image-fill URL. The fixture list provides ordering. Roles render as the Pencil-style uppercase joined label.

## 4. Visual and token contract

| Concern | Contract | Evidence state |
| --- | --- | --- |
| Page/main | Theme background; desktop main padding `[72,40,96,40]`, 72px section gap. | Pencil-confirmed |
| Outer content | 40px desktop gutters across Header, main, Footer; Debuggers page content is constrained to the Pencil-derived 1360px desktop area and centered above that width. | Pencil-confirmed geometry plus parity correction |
| Intro | Orange semantic primary eyebrow, 46px title, 17px muted subtitle, confirmed 820/640 width limits. | Pencil-confirmed |
| Group head | Title/subtitle stack with 6px gap; count aligned at section-head end. | Pencil-confirmed |
| Grid | Three equal cards per desktop row; 24px inter-card and row gap. | Pencil-confirmed |
| Card | `bg-card`, `border-border`, `rounded-[var(--radius-m)]`, semantic foreground/muted/primary copy. | Pencil-confirmed + existing tokens |
| Avatar | 92px circular local image, cover crop. | Pencil geometry confirmed; local mock provenance is an accepted content-source delta. |
| Socials | Secondary pill treatment with muted 15px icon and 34px visual circles. GitHub, Instagram, LinkedIn, X, and Bluesky are visible; verified URLs receive a 40px accessible target. | Pencil geometry plus user-approved platform extension |
| Fonts | Headings/body `font-secondary` (Geist); eyebrow/roles/count `font-primary` (JetBrains Mono). | Pencil-confirmed + existing tokens |
| Header/Footer | Reuse, not redesign. Beta follows root theme; fixed-dark remains dark. | Delivered shared-component contract. |

No token discrepancy was observed for the confirmed dark/light card surface, border, semantic text, muted text, primary accent, fonts, or radii. Do not create a debugger-specific token without re-measuring and approving a real discrepancy.

## 5. Viewport contracts

### Desktop — 1440x1200

Pencil-confirmed page structure is Header → main intro → Presenters → Contributors → Community → Footer. The first group is a three-card row; six contributors form two three-card rows; community is a three-card row. Use the three-column grid with 24px gaps inside the 1,360px content area derived from the 1,440px frame's 40px gutters; center that area at wider viewports. Intro copy is left-aligned; group title/subtitle are left-aligned and the zero-padded count sits right-aligned. Each card centers avatar, name, role, biography, and social actions. Text must wrap within its existing width, never force a fourth column, and no page-level clipping or horizontal scroll is permitted.

Dark `n4YNV` and light `a0eA8` both confirm token-driven page/card content and the same structure. The required Beta theme-toggle shell is the selected, delivered shared-shell decision.

### Tablet — 768x1024

No inspected Pencil tablet artboard establishes this geometry. The delivered design-system decision is two equal columns at `md`, 24px gaps, inherited compact navigation and 40px shared gutters. It is runtime-validated in both themes with no horizontal overflow, but is not presented as Pencil pixel parity.

### Mobile — 390x844

No inspected Pencil mobile artboard establishes this geometry. The delivered design-system decision is one column below `md`, 16px outer gutters, inherited compact navigation, and intrinsic card text height. It is runtime-validated in both themes with no horizontal overflow, clipping, or overlap, but is not presented as Pencil pixel parity.

## 6. Accessibility and resilience contract

- `main` contains the page `h1`; each group is a labelled `section` with an `h2`, description, and derived count announced in meaningful proximity.
- Use `article` semantics for debugger cards if each member is independently self-contained; otherwise use semantic list/list-item grouping. The implementation plan must choose one after checking project patterns, without nesting invalid landmarks.
- Avatar `alt` is the member name; decorative social SVGs use `aria-hidden`. Social links include the platform and name in their accessible label, while visual-only social marks are hidden from assistive technology.
- Keep DOM order as fixture order and visible order. Keyboard focus reaches Header, main content, verified social links, Footer, and player controls without dead controls for URL-less marks.
- Visible focus uses the existing semantic ring in both themes. Preserve reduced-motion handling for any future transitions; Pencil supplies no animation requirement.
- Long names, multiple roles, biographies, platform labels, zoomed text, and narrow windows must wrap/reflow. Avoid fixed text heights and horizontal scrolling.
- Resolve the visual-34px/social-40px target conflict before build. A visually preserved 34px circle may need a larger transparent hit target only if approved and compatible with the design system.

## 7. Visual acceptance and evidence log

`validation.md` compares each visible component against Pencil at 1440x1200 and records the tablet/mobile source as a documented responsive decision, not a supplied Pencil artboard.

Use one actionable row per discrepancy:

| Component/section | Viewport | Theme | Pencil expectation | Browser result | Difference | Severity | Required correction | Resolution status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DebuggerCard` social row | 1440x1200 | Both | Three 34px visual circles | Five requested 34px visual circles; only verified URLs are interactive | User-approved Instagram/X/Bluesky extension; original row was absent | Required correction | Render visual-only marks, retain conditional external-link behavior | Pending validation |

Validation confirms the delivered shared Header/Footer, compact navigation, theme switching, no-overflow behavior, and preserved player architecture. The only remaining visual delta is the accepted local-asset provenance; the former absent social row is resolved, with the Instagram/X/Bluesky inventory explicitly recorded as a user-approved extension.
