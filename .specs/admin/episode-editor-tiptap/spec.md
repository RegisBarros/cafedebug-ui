# Episode Show Notes Editor (Tiptap)

## Problem

The current Show Notes experience in the episode editor is implemented as a plain `<textarea>` plus manual string transforms for toolbar actions.

This creates three gaps:

1. formatting behavior is limited and fragile (manual cursor and text manipulation per button);
2. preview mode shows raw text blocks instead of rendered rich content;
3. we do not have a robust, extensible editor foundation for future authoring improvements.

## Goal

Adopt Tiptap for the Show Notes field so the editor supports reliable rich-text authoring and HTML rendering for preview while preserving current episode create/edit API behavior. The backend already stores and serves `description` as HTML, so the editor must ingest HTML on load and emit HTML on save.

## Scope

- Replace only the Show Notes editor surface inside:
  - `apps/admin/src/features/episodes/components/episode-editor-form.tsx`
- Keep existing page layout and Stitch visual hierarchy intact.
- Build the editor with:
  - `@tiptap/react` (v3.x)
  - `@tiptap/pm` (v3.x)
  - `@tiptap/starter-kit` (v3.x — includes Link extension)
- Preserve toolbar actions currently visible in the UI:
  - bold
  - italic
  - link
  - quote
  - inline code
  - bulleted list
  - numbered list
- Preserve Write / Preview toggle behavior.
- Keep `react-hook-form` integration and continue using `description` as a `string` in form state.
- Persist Show Notes as HTML string (matching the existing backend storage format).
- Load existing HTML `description` values into Tiptap natively on edit pages.
- Render Preview as sanitized HTML generated from the current editor state.

## Non-Goals

- No backend schema or API contract changes.
- No collaborative editing, comments, or track changes.
- No media embed pipeline (images/video uploads inside Show Notes).
- No migration of other fields (title, short description, metadata rail) to Tiptap.
- No immediate change to website rendering strategy for episode descriptions.

## Source Of Truth

- Existing editor feature boundary:
  - `apps/admin/src/features/episodes/components/episode-editor-form.tsx`
- Episode editor visual references:
  - `.specs/admin/stitch/cafedebug-admin/code/themes/light/episode-edit.html`
  - `.specs/admin/stitch/cafedebug-admin/code/themes/dark/episode-edit.html`
  - `.specs/admin/stitch/cafedebug-admin/images/themes/light/episode-edit.png`
- Theme and token guidance:
  - `.specs/admin/DESIGN_SYSTEM.md`
  - `packages/design-tokens/styles.css`

## Constraints

- Must follow feature-based architecture and keep route files thin.
- Must keep form validation contract unchanged (`episodeEditorSchema.description` remains a string field).
- Must preserve `toEpisodeRequestPayload` behavior and action semantics (`save-draft`, `publish`).
- Must be client-only safe for Next.js App Router:
  - use `'use client'` editor component;
  - initialize Tiptap with `immediatelyRender: false` to avoid hydration mismatches.
- Must use semantic tokens only for visuals (no hardcoded colors).
- Must sanitize rendered HTML in preview mode before injecting into DOM.

## Functional Requirements

1. User can apply formatting via toolbar buttons using Tiptap commands.
2. Toolbar active states reflect current selection context when applicable.
3. Write mode allows rich-text keyboard authoring.
4. Preview mode renders rich content output (headings, lists, links, quote, code).
5. Existing HTML `description` values load correctly into the editor when editing an existing episode.
6. Form dirty-state behavior remains consistent with current navigation guard.
7. Save Draft and Publish submit flows keep existing payload shape and success/error behavior.

## Acceptance Criteria

1. Show Notes in `/episodes/new` and `/episodes/[id]/edit` uses Tiptap-backed editing.
2. Buttons for bold, italic, link, quote, code, unordered list, and ordered list work end-to-end.
3. Write/Preview toggle continues to work, with Preview showing rendered HTML (not raw text).
4. The `description` field submitted to API remains an HTML string compatible with existing backend storage format.
5. Existing validation, telemetry, loading, invalid-id, fetch-error, and submit-error flows still pass.
6. UI remains aligned with Stitch references in both light and dark themes.
7. Lint, typecheck, and tests for `@cafedebug/admin` pass after implementation.

## Risks And Mitigations

- Risk: HTML preview introduces XSS risk if unsanitized content is rendered.
  - Mitigation: sanitize HTML with DOMPurify before rendering preview and limit allowed tags/attributes to editor-supported output.
- Risk: Legacy HTML data may contain markup not supported by Tiptap's schema.
  - Mitigation: Tiptap gracefully drops unsupported nodes on parse; accept normalization where semantics are preserved.

## Out Of Scope Follow-Up Ideas

- Shared HTML renderer package for admin preview and website episode rendering.
- Authoring enhancements such as slash commands, keyboard shortcut hints, and autosave.
