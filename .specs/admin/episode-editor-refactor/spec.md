# Episode Editor Refactor

## Problem

The current admin episode editor does not match the approved Stitch source-of-truth layout for the episode edit screen. It uses a generic stacked form inside a single card, while the target experience uses an editorial split-pane layout with an oversized inline title, markdown editor shell, metadata rail, and detached sticky footer.

## Goal

Refactor the episode editor so both `/episodes/new` and `/episodes/[id]/edit` match the Stitch layout near pixel-accurately in light and dark themes, while preserving the current episode create and update behavior.

## Scope

- Rebuild the episode editor UI to match the Stitch episode edit references.
- Keep the route files thin and move orchestration into the episodes feature.
- Preserve existing validation, payload mapping, telemetry, and loading/error behavior.
- Keep `shortDescription`, `number`, and `categoryId` visible, but place them in lower-prominence sections.

## Non-Goals

- Backend schema or API changes.
- Real file-upload support.
- New category data source integration.
- Full markdown rendering engine.

## Source Of Truth

- Layout and composition:
  - `.specs/admin/stitch/cafedebug-admin/code/themes/light/episode-edit.html`
  - `.specs/admin/stitch/cafedebug-admin/code/themes/dark/episode-edit.html`
- Expected visuals:
  - `.specs/admin/stitch/cafedebug-admin/images/themes/light/episode-edit.png`
  - `.specs/admin/stitch/cafedebug-admin/images/themes/dark/episodes-edit.png`
- Theming and tokens:
  - `.specs/admin/DESIGN_SYSTEM.md`
  - `packages/design-tokens/styles.css`

## Acceptance Criteria

1. The editor uses a top bar, split content area, and sticky footer consistent with the Stitch references.
2. The left pane contains the inline title and show-notes editor shell.
3. The right pane contains cover artwork, audio URL, category metadata, publish date, and tags.
4. Existing episode fields remain editable and submit through the current payload transformer.
5. Create, edit, save-draft, publish, loading, invalid-id, fetch-error, and submit-error flows continue to work.
6. Light and dark themes both visually align with their respective references.
