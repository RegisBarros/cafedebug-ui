# Design: Episode Show Notes Editor (Tiptap)

| Field | Value |
|---|---|
| **Status** | `Draft` |
| **Spec** | `.specs/admin/episode-editor-tiptap/spec.md` |
| **Source of truth** | `.specs/admin/stitch/cafedebug-admin/code/themes/*/episode-edit.html` |
| **Visual reference** | `.specs/admin/stitch/cafedebug-admin/images/themes/light/episode-edit.png` + `/Users/regis/Downloads/toobox-options.jpg` |
| **Token source** | `.specs/admin/DESIGN_SYSTEM.md` + `packages/design-tokens/styles.css` |

---

## 1. Overview

This design defines how the admin Episode Editor Show Notes field moves from a textarea with manual formatting transforms to a Tiptap editor that supports the expanded reference toolbar, excluding image insertion for this phase. It keeps the backend payload contract unchanged, preserves existing episode editor orchestration, and makes the feature handoff-ready for planning and implementation.

## 2. Architecture decisions

This design updates only the Show Notes authoring surface inside the existing episode editor feature.

Preserved boundaries:

- `app/` routes stay thin and continue rendering `EpisodeEditorPage`.
- `useEpisodeEditor` remains the owner of load/reset/mutation/telemetry/navigation orchestration.
- `episodeEditorSchema` and `toEpisodeRequestPayload` remain the validation and payload source-of-truth.
- `description` remains `string` in RHF model and API payload (HTML format, matching backend storage).

Out of scope:

- backend contract changes;
- migration of title/metadata fields to Tiptap;
- collaborative editing.

---

## 3. File Structure

```text
apps/admin/src/features/episodes/
  components/
    episode-editor-form.tsx
    episode-show-notes-field.tsx
    episode-show-notes-toolbar.tsx
    episode-show-notes-preview.tsx
  hooks/
    use-episode-editor.ts
    use-episode-show-notes-editor.ts
  services/
    episode-show-notes-serialization.ts
    episode-show-notes-sanitizer.ts
  schemas/
    episode.schema.ts
  types/
    episode-show-notes.ts
```

## 4. Responsibilities

- `components/`
  - render the Show Notes field, toolbar, and preview;
  - consume hook output only;
  - must not fetch data directly.
- `hooks/`
  - initialize Tiptap;
  - expose commands, active states, and sync behavior between editor state and RHF;
- `services/`
  - serialize HTML and normalize editor content;
  - sanitize preview output;
  - must not own React state.
- `server/`
  - no new server layer is required for this feature.
- `schemas/`
  - preserve `description` as a string field without moving validation logic into `app/`.
- `types/`
  - define toolbar action identifiers and editor-command view models where needed.

## 5. UI/UX structure

### 5.1 File map

| Path | Status | Responsibility | Layer |
|---|---|---|---|
| `apps/admin/src/features/episodes/components/episode-editor-form.tsx` | Changed | Replace current Show Notes textarea and inline markdown transforms with a dedicated Show Notes field component. Keep split layout and submit area unchanged. | component |
| `apps/admin/src/features/episodes/components/episode-show-notes-field.tsx` | New | RHF-connected wrapper for write/preview mode, editor mount lifecycle, and field error display. | component |
| `apps/admin/src/features/episodes/components/episode-show-notes-toolbar.tsx` | New | Toolbar UI for heading, list, checklist, quote, text marks, alignment, and link actions. Stateless/presentational. | component |
| `apps/admin/src/features/episodes/components/episode-show-notes-preview.tsx` | New | Sanitized HTML preview renderer with empty-state fallback. | component |
| `apps/admin/src/features/episodes/hooks/use-episode-show-notes-editor.ts` | New | Tiptap setup, HTML sync with RHF `description`, command handlers, active-state selectors, hydration-safe options. | hook |
| `apps/admin/src/features/episodes/services/episode-show-notes-serialization.ts` | New | HTML extraction helpers and editor-content normalization rules. | service |
| `apps/admin/src/features/episodes/services/episode-show-notes-sanitizer.ts` | New | HTML sanitization allowlist boundary for preview render. | service |
| `apps/admin/src/features/episodes/hooks/use-episode-editor.ts` | Unchanged | Continues to own remote state, submit actions, and route guard behavior. | hook |
| `apps/admin/src/features/episodes/transformers.ts` | Unchanged | Keeps final API payload shaping (`description` stays string). | service |
| `apps/admin/src/features/episodes/schemas/episode.schema.ts` | Unchanged | Keeps `description` validation contract. | schema |

### 5.2 Toolbar layout contract

The toolbar must visually follow the reference ordering:

1. heading dropdown
2. bulleted list dropdown/action
3. numbered list dropdown/action
4. checklist
5. blockquote
6. bold
7. italic
8. strikethrough
9. inline code
10. underline
11. highlight
12. link
13. superscript
14. subscript
15. align left
16. align center
17. align right
18. justify

If some controls are implemented as grouped menus rather than single buttons, the grouping must still preserve this visual order and the same command availability.

### 5.3 Route boundaries

- `apps/admin/src/app/(admin)/episodes/new/page.tsx` and `apps/admin/src/app/(admin)/episodes/[id]/edit/page.tsx` remain thin and unchanged.
- `apps/admin/src/features/episodes/episode-editor-page.tsx` remains the feature composition boundary for loading/error/invalid-id states.

---

## 6. Components

### 6.1 Tiptap baseline

Required editor stack:

- `@tiptap/react` (v3.x)
- `@tiptap/pm` (v3.x)
- `@tiptap/starter-kit` (v3.x)
- `@tiptap/extension-underline`
- `@tiptap/extension-highlight`
- `@tiptap/extension-subscript`
- `@tiptap/extension-superscript`
- `@tiptap/extension-text-align`
- `@tiptap/extension-task-list`
- `@tiptap/extension-task-item`

Recommended baseline configuration:

- `StarterKit` provides paragraph, heading, blockquote, bold, italic, strike, code, bullet list, ordered list, and history support.
- `Link` must be configured explicitly if `StarterKit` no longer includes the required behavior in the chosen Tiptap version.
- `TextAlign` must support `left`, `center`, `right`, and `justify` for paragraph and heading nodes only.
- `TaskItem` must be configured for checklist editing without nested task-list complexity unless the existing UI explicitly supports nesting.

Client safety:

- editor components remain `'use client'`;
- initialize with `immediatelyRender: false` to avoid hydration mismatch in Next.js App Router.

### 6.2 Toolbar command mapping

| UI action | Command intent |
|---|---|
| Heading | toggle current block between paragraph and configured heading levels from the toolbar menu |
| Bulleted list | toggle bullet list node |
| Numbered list | toggle ordered list node |
| Checklist | toggle task list node |
| Quote | toggle blockquote node |
| Bold | toggle bold mark |
| Italic | toggle italic mark |
| Strikethrough | toggle strike mark |
| Inline code | toggle inline code mark |
| Underline | toggle underline mark |
| Highlight | toggle highlight mark |
| Link | set/unset link mark (URL prompt/flow defined at component level) |
| Superscript | toggle superscript mark |
| Subscript | toggle subscript mark |
| Align left | set text alignment to `left` |
| Align center | set text alignment to `center` |
| Align right | set text alignment to `right` |
| Justify | set text alignment to `justify` |

Command states:

- each action has `enabled` and `active` state from the editor instance;
- toolbar actions are disabled when editor is not ready or when preview mode is active.

### 6.3 Write / Preview

- Write mode: editable Tiptap surface.
- Preview mode: sanitized HTML render of current editor document.
- Toggling modes must not drop unsaved edits.

---

## 7. Data flow (UI → hooks → services → server → API)

### 7.1 New episode flow (`/episodes/new`)

1. `useEpisodeEditor` creates RHF form with `episodeEditorDefaultValues` (`description: ""`).
2. `EpisodeEditorForm` renders `EpisodeShowNotesField` bound to RHF `description`.
3. Tiptap initializes with empty content from RHF string value.
4. User edits update Tiptap doc, then serialize to HTML string via `editor.getHTML()`.
5. Serialized HTML updates RHF `description` with dirty/touched flags.
6. Submit action (`save-draft` or `publish`) stays unchanged through `toEpisodeRequestPayload`.

### 7.2 Edit flow (`/episodes/[id]/edit`)

1. `useEpisodeEditor` fetches episode and executes `form.reset(toEpisodeEditorDefaults(...))`.
2. Field receives updated RHF `description` (HTML string from backend) and syncs editor content via `editor.commands.setContent(html)`.
3. Sync guard prevents reset loops and false-dirty transitions.
4. User edits follow the same path (doc -> HTML string -> RHF string).
5. Submit keeps current payload shape and mutation logic.
6. Post-success reset behavior remains under `useEpisodeEditor`.

### 7.3 State management

| State | Owner |
|---|---|
| Route loading, invalid-id, fetch error | `EpisodeEditorPage` + `useEpisodeEditor` |
| Submit action, submit error, telemetry | `useEpisodeEditor` |
| Write/preview mode | `EpisodeShowNotesField` |
| Editor selection/active marks and enabled commands | `useEpisodeShowNotesEditor` |
| Persisted description value | RHF form (`description: string`, HTML format) |

---

## 8. API contracts (mapping to OpenAPI)

- Episode create/update contracts remain unchanged: `description` is still submitted as a string through the existing episode API routes and backend OpenAPI contract.
- No new backend OpenAPI contract is introduced by this spec.

---

## 9. Preview HTML pipeline

Pipeline:

1. Tiptap document -> HTML string.
2. HTML string -> `sanitizeEpisodeShowNotesHtml`.
3. Sanitized HTML -> preview renderer.

Rules:

- never render raw, unsanitized HTML;
- sanitizer allowlist only includes nodes/attributes needed for supported features;
- disallow unsafe URL protocols and event attributes;
- preview HTML is ephemeral UI state, not persisted API state.

---

## 10. State management

- RHF remains the source of truth for persisted form values.
- `useEpisodeShowNotesEditor` owns editor-command orchestration, active states, and content synchronization.
- No toolbar state should be derived in `app/` routes.

---

## 11. Edge cases

| Risk | Mitigation |
|---|---|
| Hydration mismatch | Client-only editor leaf + `immediatelyRender: false`. |
| Legacy HTML with unsupported markup | Tiptap gracefully drops unsupported nodes on parse; accept normalization where semantics are preserved. |
| XSS via preview render | Mandatory DOMPurify sanitizer boundary before `dangerouslySetInnerHTML`. |
| Unsafe links | URL protocol filtering in DOMPurify sanitizer policy. |
| Form reset overwrites live edits | Sync guard with last-synced reference/source-aware update logic. |
| Dirty-state regression | All editor changes must route through RHF field updates. |
| Unsupported pasted content | Graceful fallback to plain text when unsupported structures are encountered. |
| Alignment applied to unsupported nodes | Restrict `TextAlign` to paragraphs and headings only. |
| Checklist serialization drift | Round-trip task list HTML through dedicated serialization tests. |

---

## 12. Accessibility and responsiveness

- Keep existing split-pane shell and spacing from current episode editor implementation.
- Use semantic token classes only (`surface`, `surface-container-*`, `on-surface`, `outline-variant`, `focus-ring`).
- No hardcoded colors or ad-hoc dark-mode overrides.
- Keep focus-visible styles for all toolbar and editor interactive elements.
- Preserve light/dark parity and Stitch visual hierarchy.
- Toolbar buttons keep explicit `aria-label`s.
- Editor region keeps programmatic label association with Show Notes field label.
- Visible keyboard focus for toolbar actions and write/preview segmented control.
- Preview mode remains readable and preserves semantic structure for headings, lists, checklists, links, quote, code, and alignment.
- Error message rendering for `description` stays connected to RHF validation output.
- Toolbar layout must wrap or scroll without clipping controls on narrower widths.

---

## 13. Validation Rules

- No business logic in `src/app/` route files.
- No direct fetch/media calls in toolbar or field components.
- Client components may open dialogs and call hook callbacks, but persistence and normalization rules stay in hooks/services.
- Sanitization is mandatory before preview rendering.
- `description` stays a string at schema, form, transformer, and API boundaries.

---

## 14. Acceptance Criteria Mapping

| Spec acceptance | Design mechanism |
|---|---|
| Tiptap-backed editing on new/edit pages | Dedicated `EpisodeShowNotesField` + editor hook replacing textarea internals. |
| Expanded toolbar actions work end-to-end | Explicit command mapping, required extensions, and toolbar order contract. |
| Preview renders HTML, not raw text | Sanitized HTML preview pipeline. |
| `description` remains backend-compatible string | RHF string storage (HTML format) and unchanged transformer contract. |
| Existing lifecycle states remain intact | No changes to `EpisodeEditorPage` state branches or `useEpisodeEditor` orchestration. |
| Theme fidelity in light/dark | Token-only styling and preserved shell structure. |
| Quality gates pass | Scoped changes to features/episodes plus targeted tests for sync, sanitization, commands, alignment, and checklist paths. |

---

## 15. Governance Handoff (Design Phase)

- **Phase:** Design (`Specification -> Planning` path is valid)
- **What changed:** Updated the Show Notes design to remove image insertion from the toolbar scope while preserving the remaining Tiptap architecture, command mapping, and handoff structure.
- **Where:** `.specs/admin/episode-editor-tiptap/design.md`
- **Unresolved risks:** Legacy HTML normalization behavior and sanitizer allowlist coverage.
- **Approval status:** Draft design ready for planning (`tasks.md` phase).
