# Spec: Debuggers Page

| Field | Value |
| --- | --- |
| **Status** | `Implemented` |
| **Route** | `/debuggers` |
| **Domain** | `web/debuggers` |
| **Affected app** | `apps/web` |
| **Design source** | `cafedebug.pen`: dark `n4YNV`, light `a0eA8` |
| **Lifecycle** | `specification -> planning -> implementation -> debug/validation -> documentation` |

## Objective and purpose

Create a route where visitors can learn who makes CaféDebug happen. The page presents the designed, ordered groups of people with a consistent profile-card treatment. It must use the existing Beta shared shell and its theme behavior, not a separate site chrome.

## Scope

- Serve the page at `/debuggers` through a thin route and metadata boundary under `apps/web/src/app`.
- Render the three Pencil-confirmed groups in this order: `Apresentadores`, `Contribuidores`, `Comunidade`.
- Use deterministic local mock fixtures and local avatar assets for all visible profile content.
- Reuse the existing shared Header, Footer, theme system, responsive navigation, persistent player, and `EpisodeCard` responsibilities unchanged.
- Change the canonical shared navigation label from `Time` to `Debuggers` and its destination to `/debuggers` in both the Header’s primary navigation and Footer’s Comunidade list.

## Explicit non-goals

- API integration, `fetch`, remote runtime data/assets, or network behavior.
- Editing `cafedebug.pen`.
- A second Header, Footer, navigation model, player state/audio owner, or episode-card implementation.
- Profile detail routes, filtering, pagination, search, CMS/admin workflow, profile editing, analytics, or social-link tracking.
- Inventing social URLs, responsive artboards, images, or visual values not represented by Pencil or the existing shared system.

## Functional requirements

### FR-1 — Page and groups

- The route has one `main` landmark with an introductory region followed by three group sections.
- Render group order and member order exactly as evidenced by Pencil: Apresentadores (Ana Ribeiro, Bruno Carvalho, Marina Costa); Contribuidores (Diego Almeida, Letícia Souza, Rafael Lima, Camila Nunes, Pedro Henrique, Juliana Reis); Comunidade (Thiago Martins, Fernanda Dias, Lucas Pereira).
- Each group renders its designed title, subtitle, and a zero-padded derived count in the confirmed presentation: `03 pessoas`, `06 pessoas`, `03 pessoas`.
- All groups use one `DebuggerCard` visual responsibility unless future Pencil inspection proves a structural difference.

### FR-2 — Deterministic local data

- The feature domain is `apps/web/src/features/debuggers/`; its fixtures/types/services/components remain there. `apps/web/src/app` is limited to route and metadata composition.
- Fixture data is deterministic and local. It contains a stable ID, name, one or more roles, short biography, local avatar reference, optional GitHub URL, optional X/Twitter URL, optional LinkedIn URL, group identity, and ordering.
- Card content shown by Pencil must be represented by the fixture contract. Group counts are derived from fixture members, never copied as display literals.
- Render the Pencil-style social row on every card. The user-approved platform inventory is GitHub, Instagram, LinkedIn, X, and Bluesky; Pencil supplies the original three-circle visual reference, while the two additional brands are an approved extension. A platform becomes a focusable external link only when its corresponding fixture URL exists; no URL may be guessed.
- No API call, remote dependency, `fetch`, or network behavior is permitted.

### FR-3 — Shared shell and navigation

- The route inherits the existing Homepage Beta layout, including its theme-following Header/Footer, theme toggle, Search control, responsive navigation, and accessibility behavior.
- Update the single canonical navigation source/configuration: Header desktop, compact navigation, and Footer must say `Debuggers` and navigate to `/debuggers`. Do not make page-specific shell variants.
- This shared rename affects every route that renders the shared Header/Footer; it replaces the prior `Time` label everywhere, including fixed-dark variants. Existing users/bookmarks for `/` and `/episodes` are not otherwise changed.
- Do not compose an episode card or player in this feature. The existing root `PlayerProvider`, sole hidden audio element, and `MiniPlayer` continue to own persistent playback outside the page.

### FR-4 — Theme, responsive behavior, and tokens

- Match dark `n4YNV` and light `a0eA8` at the confirmed 1440px reference using `packages/web-design-tokens` semantic values only.
- Preserve identical information hierarchy, group/member order, interaction semantics, and layout behavior in both themes.
- No raw visual colors or arbitrary visual values may be introduced when an existing token represents the Pencil value. A mismatch must be recorded for approval before a token change.
- At 1440px, preserve the confirmed 1,360px content area inside the 72px header, 40px horizontal outer gutters, 72px main top/96px bottom padding, 72px major-section gap, 28px section-to-grid gap, and 24px desktop card gap. Above that desktop width, keep the 1,360px content area centered rather than stretching the three cards.
- Tablet (`768x1024`) and mobile (`390x844`) must have no clipped content or horizontal page overflow, preserve Header/Footer interaction, readable wrapping, and usable cards. Their exact visual geometry is unresolved because no corresponding Pencil artboards were inspected.

### FR-5 — Accessibility

- Use semantic `header`, `nav`, `main`, `section`, and `footer` landmarks inherited from the shell, with one page `h1`, group `h2`s, and no skipped heading level.
- Profile images have meaningful alt text based on the debugger name; decorative icon SVGs are hidden from assistive technology.
- Social actions are external links only when URLs exist, open safely according to the project convention, and have accessible names such as `GitHub de Ana Ribeiro`.
- Keyboard order follows visual/DOM order. Verified native links are focusable, focus remains visible in both themes, and visual-only social marks without a URL do not occupy tab order.
- Preserve 40px-or-larger touch targets where existing shared button/link primitives require them; the 34px Pencil social circles need an approved accessible target treatment before implementation.
- Support `prefers-reduced-motion`, 200% zoom, long names/roles/biographies, wrapping, and horizontal-overflow prevention.

## Resolved implementation decisions

- The implementation goal authorizes `debuggers` as the feature domain and `(beta)` as the route group. This retains the existing theme-following shared shell instead of forking the Pencil frame’s fixed-dark `Assinar` header.
- Existing checked-in `/mock/*` portrait assets are the deterministic local-fixture provenance. They replace Pencil’s remote image fills; no remote asset is used at runtime.
- Pencil supplies no member social URLs. Every shipped fixture has an empty social-link map, so the five requested social marks render as noninteractive visuals rather than dead or invented links. `DebuggerCard` promotes an individual mark to a platform-plus-name, safely external link whenever a future verified URL is supplied.
- The absent responsive artboards are resolved as a documented system decision: two columns at the existing `md` breakpoint and one column below it. This is validated responsive behavior, not claimed Pencil pixel parity.
- The designed Portuguese people-page copy is preserved, while the canonical navigation and route name is `Debuggers`.
- The social-link component has a 40px focusable target around the Pencil 34px visual circle when a URL exists. The same 34px visual circle remains visible without a URL, but is noninteractive.

## Evidence gaps / open questions

| ID | Resolution | Validation status |
| --- | --- | --- |
| EG-01 | Existing local `/mock/*` images are used for deterministic fixtures; the remote Pencil fills are deliberately not copied. | Accepted content-source delta; verified local at runtime. |
| EG-02 | No social URL is invented. The Pencil-style row remains visible as visual-only marks until a verified fixture URL exists. | Resolved by the parity correction; visual-only and accessible-link behavior are covered by tests. |
| EG-03 | The current system’s 2-column `md` and 1-column mobile rules are used. | Responsive behavior validated; no Pencil parity claim outside desktop. |
| EG-04 | Keep Pencil’s Portuguese page content and use `Debuggers` only for the canonical route/navigation. | Implemented and runtime-verified. |
| EG-05 | Reuse the required `(beta)` Header/Footer with its theme toggle. | Implemented and dark/light runtime-verified. |
| EG-06 | Use a 40px future link target with a 34px visual circle. | Implemented and source-tested for future verified links. |

## Acceptance criteria

- **AC-01:** `/debuggers` is a thin route/metadata boundary and feature UI/data lives under `features/debuggers`.
- **AC-02:** Dark and light 1440px output matches the approved measurable geometry/copy/order of `n4YNV` and `a0eA8`; every accepted content-source delta is logged in `validation.md`.
- **AC-03:** Header and Footer are reused, remain functional, and use the canonical `Debuggers` `/debuggers` destination without duplicate shell variants.
- **AC-04:** The page renders the three confirmed groups and twelve members in confirmed order; group count presentation is fixture-derived and zero padded.
- **AC-05:** All debugger data is deterministic/local; no remote asset at runtime, API integration, or `fetch` is introduced.
- **AC-06:** A single shared `DebuggerCard` owns card presentation unless approved Pencil evidence documents a required structural variant.
- **AC-07:** Every card visibly renders GitHub, Instagram, LinkedIn, X, and Bluesky marks at Pencil social-row geometry. URLs are conditional, accessible, and never invented; the platform and debugger name are both in each accessible link name.
- **AC-08:** Dark/light at 1440x1200, 768x1024, and 390x844 have no horizontal overflow, clipped content, incorrect wrapping, or broken navigation/theme switching.
- **AC-09:** Semantic landmarks/headings, keyboard traversal, visible focus, touch sizing, alt text, long-content resilience, zoom, and reduced-motion behavior pass validation.
- **AC-10:** The shared persistent-player architecture and `EpisodeCard` responsibilities do not regress.

## Status

**Implemented and validated. See `validation.md` for command output, browser evidence, Pencil comparison, and the accepted content-source deltas.**
