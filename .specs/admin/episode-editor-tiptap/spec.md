# Episode Show Notes Editor (Tiptap)

## Overview

Replace the Episode Editor Show Notes textarea with a Tiptap-based rich-text editor whose toolbar matches the approved authoring controls from the reference toolbox image, excluding image insertion for this phase. The editor must keep the current episode create/edit flows intact, continue persisting `description` as HTML, and remain ready for handoff from specification to planning and implementation.

## Problem

The current Show Notes experience is implemented as a plain `<textarea>` with manual string transforms for a small set of toolbar actions.

This creates four delivery gaps:

1. formatting behavior is limited and fragile because each button manually manipulates plain text;
2. the available actions no longer match the richer toolbar expected by the approved UI reference;
3. preview mode shows raw text blocks instead of rendered, sanitized rich content;
4. the current implementation is not a strong foundation for future authoring enhancements.

## Goals

- Adopt Tiptap for the Show Notes field while preserving current episode create/edit API behavior.
- Expand the toolbar to match the approved reference image for the supported actions below, excluding image insertion for this phase.
- Keep `description` as an HTML string in form state and API payloads.
- Load existing backend HTML into the editor on edit screens without breaking dirty-state, reset, or submit flows.
- Preserve Write / Preview behavior, with Preview rendering sanitized HTML.

Supported toolbar action set from the reference image:

- heading
- bulleted list
- numbered list
- checklist
- blockquote
- bold
- italic
- strikethrough
- inline code
- underline
- highlight
- link
- superscript
- subscript
- align left
- align center
- align right
- justify

## Non-goals

- No backend schema or API contract changes.
- No migration of other fields (title, short description, metadata rail) to Tiptap.
- No collaborative editing, comments, version history, or track changes.
- No inline media upload pipeline, asset-management backend, or toolbar image insertion inside this phase.
- No change to public website rendering strategy for episode descriptions in this phase.

## Users and Use Cases

### Primary user

- Admin editors who create and maintain episode show notes in the backoffice.

### Use cases

- Create a new episode and author structured show notes with headings, lists, emphasis, and links.
- Edit an existing episode whose `description` already contains HTML from the backend.
- Insert richer semantic formatting such as checklist items, underline, highlight, sub/superscript, and text alignment.
- Preview the current Show Notes output before saving.

## User Flows

### Flow 1 — Create episode with rich formatting

1. Admin opens `/episodes/new`.
2. Admin enters Show Notes in Write mode.
3. Admin applies one or more toolbar actions.
4. Editor updates the Tiptap document and synchronizes HTML into the RHF `description` field.
5. Admin switches to Preview to verify the rendered result.
6. Admin saves draft or publishes with the existing submit controls.

### Flow 2 — Edit existing episode HTML

1. Admin opens `/episodes/[id]/edit`.
2. Existing backend HTML is loaded into Tiptap.
3. Admin updates text or formatting using the expanded toolbar.
4. Dirty-state behavior remains consistent with the existing navigation guard.
5. Admin saves changes and the API still receives `description` as HTML.

## Routes or Screens

- `apps/admin/src/app/(admin)/episodes/new/page.tsx`
- `apps/admin/src/app/(admin)/episodes/[id]/edit/page.tsx`
- `apps/admin/src/features/episodes/components/episode-editor-form.tsx`

## Source of Truth

- Existing editor feature boundary:
  - `apps/admin/src/features/episodes/components/episode-editor-form.tsx`
- Episode editor visual references:
  - `.specs/admin/stitch/cafedebug-admin/code/themes/light/episode-edit.html`
  - `.specs/admin/stitch/cafedebug-admin/code/themes/dark/episode-edit.html`
  - `.specs/admin/stitch/cafedebug-admin/images/themes/light/episode-edit.png`
- Toolbar reference image:
  - `/Users/regis/Downloads/toobox-options.jpg`
- Theme and token guidance:
  - `.specs/admin/DESIGN_SYSTEM.md`
  - `packages/design-tokens/styles.css`

## Constraints

- Must follow feature-based architecture and keep route files thin.
- Must keep the form validation contract unchanged: `episodeEditorSchema.description` remains a string field.
- Must preserve `toEpisodeRequestPayload` behavior and submit semantics for `save-draft` and `publish`.
- Must be client-only safe for Next.js App Router:
  - use `'use client'` editor components;
  - initialize Tiptap with `immediatelyRender: false` to avoid hydration mismatches.
- Must use semantic tokens only for visuals; no hardcoded color values.
- Must sanitize rendered HTML in preview mode before injecting into the DOM.

## Success Criteria

1. Show Notes in `/episodes/new` and `/episodes/[id]/edit` uses a Tiptap-backed editor instead of the legacy textarea behavior.
2. The toolbar supports heading, bulleted list, numbered list, checklist, blockquote, bold, italic, strikethrough, inline code, underline, highlight, link, superscript, subscript, and four alignment modes.
3. Toolbar active and disabled states reflect the current selection and editor readiness.
4. Write / Preview toggle continues to work, and Preview renders sanitized rich HTML rather than raw text.
5. Existing HTML `description` values load correctly into the editor on edit screens.
6. The `description` field submitted to the API remains an HTML string compatible with current backend storage.
7. Existing validation, loading, invalid-id, fetch-error, telemetry, dirty-state, and submit-error flows still behave as before.
8. UI remains aligned with Stitch references in light and dark themes.

## Risks and Open Questions

- Risk: HTML preview introduces XSS risk if unsanitized content is rendered.
  - Mitigation: sanitize HTML with DOMPurify before rendering preview and keep the allowlist aligned to supported nodes and attributes.
- Risk: legacy HTML may contain markup not supported by the chosen Tiptap extension set.
  - Mitigation: normalize unsupported markup on load where semantics can be preserved and document any unavoidable lossy conversions.
- Risk: Tiptap does not provide every required action from `StarterKit` alone.
  - Mitigation: design must explicitly call out the extra extensions needed for underline, highlight, superscript, subscript, text alignment, and task list support.

## Handoff Status

- **Phase:** Specification
- **What changed:** Updated the Episode Editor Show Notes spec to remove image insertion from the toolbar scope while keeping the remaining approved formatting actions implementation-ready.
- **Where:** `.specs/admin/episode-editor-tiptap/spec.md`
- **Unresolved risks or blockers:** unsupported legacy HTML normalization still needs validation during implementation.
- **Approval status:** Draft, ready for design and planning handoff.
