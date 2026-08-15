# Tasks: Debuggers Page

| Field | Value |
| --- | --- |
| **Status** | `Implemented` |
| **Spec** | `.specs/web/debuggers-page/spec.md` |
| **Design** | `.specs/web/debuggers-page/design.md` |
| **Validation output** | `.specs/web/debuggers-page/validation.md` (created in Phase 5) |

## Phase 1 — Specification approval

- [x] Treat the implementation goal as approval of the documented safe resolutions for each prior evidence gap.
- [x] Reinspect Pencil `n4YNV`, `a0eA8`, and reusable card `e3Drx`; preserve their measurable desktop contract.
- [x] Resolve EG-01 through EG-06 in `spec.md` and `design.md`, retaining accepted content-source deltas rather than inventing URLs or remote dependencies.
- [x] Confirm `debuggers` as the feature domain and `(beta)` as the route group.
- [x] Mark the package approved before implementation begins.

Gate satisfied: the documented resolutions preserve the no-invented-data and shared-shell constraints.

## Phase 2 — Implementation

- [x] Add the thin `/debuggers` route/metadata boundary under the approved route group; keep UI and data out of `apps/web/src/app`.
- [x] Add `features/debuggers` types, deterministic local fixtures, a local read seam, and checked-in avatar assets; add no API or `fetch` behavior.
- [x] Build one server-first page composition, `DebuggerGroup`, and one shared `DebuggerCard`; derive zero-padded group counts from fixtures.
- [x] Render social links only for present fixture URLs with platform-plus-name accessible labels and safe external-link behavior.
- [x] Reuse the approved shared Header/Footer route layout; do not create variants.
- [x] Update the canonical Header/compact-navigation source from `Time` to linked `Debuggers` `/debuggers`, and update Footer’s Comunidade item from `Time` to linked `Debuggers` `/debuggers`.
- [x] Implement the documented dark/light responsive rules using semantic tokens. Preserve root PlayerProvider/MiniPlayer and existing EpisodeCard responsibilities.
- [x] Add focused tests for fixture ordering, derived counts, conditional socials/a11y labels, route/architecture boundaries, shared navigation rename, and JSON-LD.

## Parity correction — width and social row

- [x] Constrain the Debuggers content to the Pencil-derived 1360px desktop area and center it above that width without changing the 1440px gutter geometry.
- [x] Restore every card’s 34px social row, retain safe conditional external links, and add visual support for GitHub, Instagram, LinkedIn, X, and Bluesky without inventing profile URLs.
- [x] Extend focused coverage for the wide-screen width limit, visual-only social marks, and verified-link semantics.
- [x] Re-run the full automated and browser/Pencil review after the correction, then replace the former absent-social delta in `validation.md`.

Gate: `spec.md` acceptance criteria AC-01 through AC-07 must be demonstrably met before full validation.

## Phase 3 — Automated checks

- [x] Run `pnpm --filter @cafedebug/web run test`.
- [x] Run `pnpm --filter @cafedebug/web run lint`.
- [x] Run `pnpm --filter @cafedebug/web run typecheck`.
- [x] Run `pnpm --filter @cafedebug/web run build`.
- [x] Run `git diff --check`.
- [x] Record exact commands, pass/fail output, and the native-zoom harness limitation in `validation.md`.

## Phase 4 — Browser validation

- [x] Validate `/debuggers` at `1440x1200`, `768x1024`, and `390x844` in dark and light themes.
- [x] Check page/group/member order, card grid/stack, visual alignment, wrapping, avatar crops, group counts, visible social marks and conditional-link behavior, Header/Footer composition, and persistent-player non-obstruction.
- [x] Test canonical `Debuggers` destination from desktop Header, compact Header menu, and Footer; verify no stale `Time` navigation label remains.
- [x] Test theme switching/persistence, compact menu interactions, visible focus, Escape/focus return, touch sizing, conditional-link behavior, and long existing biographies. Native 200% browser zoom is not exposed by the local browser harness; the 390px reflow and intrinsic-height source contract are recorded instead.
- [x] Check document `scrollWidth <= clientWidth`, clipped content, focus visibility, and no overlap with the persistent player.

## Phase 5 — Pencil comparison

- [x] Compare every visible component with dark `n4YNV` and light `a0eA8`; use the detailed desktop component inventory in `design.md`.
- [x] Create/update `.specs/web/debuggers-page/validation.md` with a concrete entry for every difference using: component/section, viewport, theme, Pencil expectation, browser result, difference, severity, required correction, resolution status.
- [x] Record tablet/mobile sources as responsive decision evidence; never label an invented behavior Pencil parity.
- [x] Repeat implementation → automated checks → browser validation → Pencil comparison until all code/responsive defects are resolved and the two content-source deltas are explicitly recorded.

Gate: no vague entries (for example, “spacing slightly different”); every delta must be measurable and actionable.

## Phase 6 — Documentation and handoff

- [x] Update the package/index status after all implementation and validation gates pass.
- [x] Preserve final `validation.md`, automated-check results, asset provenance, resolved evidence gaps, and accepted content-source deviations.
- [x] Handoff changed paths, validated behavior, shared-shell impact, remaining risks, and explicit approval status.
- [x] Confirm no route code, player code/state, EpisodeCard responsibility, or unrelated shell behavior changed outside the approved scope.

## Required final implementation status

**Implemented and validated with the local-asset and no-invented-social-link decisions recorded in `validation.md`.**
