# Validation: Debuggers Page

| Field | Value |
| --- | --- |
| **Status** | `Passed after width and social-row parity correction` |
| **Route** | `/debuggers` |
| **Pencil source** | Dark `n4YNV`, light `a0eA8`, shared Profile Card `e3Drx` |
| **Review method** | Requested `web-design-reviewer` workflow: current Pencil structural inspection, supplied screenshots, and live local-browser review. |

## Approval decisions carried into implementation

- Existing checked-in `/mock/*` portraits are used instead of Pencil’s remote Unsplash fills. Runtime inspection confirms all twelve avatar URLs resolve on the local origin.
- No social URL was supplied by Pencil. Every fixture deliberately leaves its social map empty, so every card renders five visual-only 34px marks (GitHub, Instagram, LinkedIn, X, Bluesky) rather than a dead or invented action. A verified future URL promotes only its mark to a safe `target="_blank" rel="noreferrer"` 40px target with a platform-plus-name label.
- The main content is capped at 1360px and centered above the Pencil desktop coordinate, preventing the three-card grid from growing beyond 437.34px per card at a 1920px viewport. At the 1440px browser viewport, the vertical scrollbar leaves a 1425px client area, yielding the expected 1345px available content area and 432.33px cards inside the unchanged 40px gutters.
- Tablet and mobile use the existing system’s `md` two-column and below-`md` one-column layout. This is a responsive product decision, not a claim of missing Pencil-artboard parity.
- The required `(beta)` theme-toggle shell takes precedence over the Pencil page frame’s `Assinar` action. Page copy remains in Portuguese; shared navigation uses `Debuggers` `/debuggers`.

## Automated checks

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm --filter @cafedebug/web run typecheck` | Passed | TypeScript completed with no errors. |
| `pnpm --filter @cafedebug/web run lint` | Passed | ESLint completed with no errors. |
| `pnpm --filter @cafedebug/web run test` | Passed | 80 tests passed, including debugger fixtures, the 1360px desktop cap, five visual social marks, conditional safe links, JSON-LD, route boundary, shared navigation, and no-`fetch` assertions. |
| `pnpm --filter @cafedebug/web run build` | Passed | Next.js production build completed and generated `/debuggers`; route report includes `/debuggers`. |
| `git diff --check` | Passed | No whitespace errors in the final patch. |

## Runtime / accessibility / SEO evidence

| Check | Result |
| --- | --- |
| Landmark and heading structure | Passed: one `main`, one `h1`, group `section` landmarks with `h2`s, twelve self-contained `article`s and `h3`s, inherited Header/Footer landmarks. |
| Fixture order and counts | Passed: `Apresentadores` / `Contribuidores` / `Comunidade`; 3 / 6 / 3 members; visible `03` / `06` / `03` derived labels. |
| Canonical navigation | Passed: Header, compact menu, and Footer each navigated from `/episodes` to `/debuggers`; no `Time` label remains. Compact menu also closes on navigation, closes on Escape, and returns focus to its trigger. |
| Theme and focus | Passed: theme toggle changes dark/light and persists across reload; keyboard focus on the compact trigger has a visible 2px solid outline with 2px offset. |
| Social marks and links | Passed: all 12 cards expose five 34px visual marks; current URL-less fixture marks are `aria-hidden` and absent from the tab sequence. Verified sources use a labelled, 40px external link path. |
| SEO | Passed: title `Debuggers · CafeDebug`, canonical `/debuggers`, description, `index, follow`, Open Graph title/URL, `summary_large_image` Twitter card, `pt-BR`, sitemap entry, and a 12-person `CollectionPage` JSON-LD item list. |
| Runtime health | Passed: the recovered local page renders the corrected source, production build completes cleanly, avatar sources are local, and the feature has no `fetch(`. |
| Resilience | Passed at the provided data lengths: no fixed text heights, no truncation utilities, readable wrapping and zero horizontal overflow at all tested viewport/theme combinations. The five-mark 202px row remains one line at 375px. Native 200% browser zoom is not exposed by the local review harness; the 375px reflow is the recorded automated proxy. |
| Player / EpisodeCard isolation | Passed: Debuggers feature does not import or compose player/EpisodeCard; root provider remains the single audio owner. |

## Responsive results

| Viewport | Theme | Browser result | Outcome |
| --- | --- | --- | --- |
| `1920x1200` | Dark | Centered 1360px inner area; three 437.33px cards with 24px gaps; every card has five 34px marks; `scrollWidth == clientWidth`. | Passed; wide-width regression resolved. |
| `1920x1200` | Light | Same 1360px inner area and 437.33px cards; white card token surface; five visual-only social marks; no horizontal overflow. | Passed; wide-width regression resolved. |
| `1440x1200` | Dark | Three 432.33px cards and 24px gaps in the scrollbar-adjusted 1345px available content area; five one-line 34px marks; `scrollWidth == clientWidth`. | Passed. |
| `1440x1200` | Light | Same three-column geometry; semantic light background/card/foreground tokens; five one-line marks; `scrollWidth == clientWidth`. | Passed. |
| `768x1024` | Dark | 2 columns (`324.5px` each), 24px gaps, compact Header enabled, five marks remain one line, no horizontal overflow. | Passed; responsive decision, not Pencil artboard parity. |
| `768x1024` | Light | Same 2-column geometry, shared Footer width equals viewport, group count stays in viewport, five marks remain one line, no horizontal overflow. | Passed; responsive decision, not Pencil artboard parity. |
| `375x844` | Dark | 1 column (`328px`), compact Header enabled, all card right edges remain within viewport, five marks remain one line, no horizontal overflow. | Passed; responsive decision, not Pencil artboard parity. |
| `375x844` | Light | Same 1-column reflow, one-line social row, Footer width equals viewport, no clipping or horizontal overflow. | Passed; responsive decision, not Pencil artboard parity. |

## Pencil comparison ledger

| Component/section | Viewport | Theme | Pencil expectation | Browser result | Difference | Severity | Required correction | Resolution status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Header and page shell | `1440x1200` | Both | 72px Header, 40px gutters; Pencil frame exposes `Assinar`. | 72px Header and 40px gutters; required Beta shell exposes theme toggle. | Header action intentionally differs to retain one shared Beta shell. | Accepted decision | Keep the shared theme toggle unless product changes all Beta chrome. | Recorded |
| Intro | `1440x1200` | Both | `COMUNIDADE`; 46/700 title at 1.1, 17px subtitle at 1.6, 820/640px limits, 16px gap. | Exact copy, 820px intro width and 16px stack gap; token fonts/colors. | None measured. | None | None. | Matched |
| Group headers | `1440x1200` | Both | 26px title, 14px description, 13px mono count, 28px to grid. | Same copy, counts, token typography, and 28px group gap. | None measured. | None | None. | Matched |
| Desktop grid | `1440x1200` | Both | Three equal columns, 24px gap. | Three equal columns, 24px gap. | None measured. | None | None. | Matched |
| Wide desktop content | `1920x1200` | Both | The 1440px Pencil frame establishes a 1360px main-content coordinate. | Centered 1360px inner area, 437.33px cards and 24px gaps. | Former implementation expanded cards to 592.33px. | P1 | Add a centered 1360px cap. | Resolved |
| Card structural treatment | `1440x1200` | Both | Card/background/border/radius, 28px padding, 14px gap, 92px circular avatar, centered typography. | Same semantic token treatment and measured spacing/avatar size. | None measured. | None | None. | Matched |
| Avatar image source | `1440x1200` | Both | Remote Pencil image fills. | Existing local `/mock/*` assets on local origin. | Image pixels/provenance intentionally differ; no runtime remote fetch. | Accepted content-source delta | Supply licensed local equivalents if exact image parity becomes a product requirement. | Recorded |
| Social row | `1440x1200` | Both | Three 34px social circles per card. | Five 34px marks (GitHub, Instagram, LinkedIn, X, Bluesky); marks without a URL are visual only. | User-approved platform extension replaces the former absent row. | Required correction | Keep Pencil geometry; conditionally promote only verified destinations to 40px links. | Resolved |
| Responsive layout | `768x1024`, `375x844` | Both | No Pencil artboard supplied. | 2 columns at tablet; 1 column on mobile; five marks remain one line; no overflow, clipping, or broken compact navigation. | Cannot claim pixel parity without a source frame. | Documented responsive decision | Add Pencil responsive artboards for future pixel comparison. | Recorded |
| Footer navigation | `1440x1200` | Both | Pencil has `Time` in Comunidade. | Shared Footer has linked `Debuggers` `/debuggers`. | Requested shared-navigation rename. | Required change | None. | Matched to approved requirement |

## Final review

Implementation is approved for handoff. All code, SEO, functional, theme, responsive, and measurable desktop-Pencil checks passed. The wide-card and absent-social-row defects are resolved. The only remaining visual difference is the accepted local replacement-portrait provenance; it requires no code correction under the current specification.
