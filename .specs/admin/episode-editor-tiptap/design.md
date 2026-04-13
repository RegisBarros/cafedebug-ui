# Design: Episode Show Notes Editor (Tiptap)

| Field | Value |
|---|---|
| **Status** | `Implemented` |
| **Spec** | `.specs/admin/episode-editor-tiptap/spec.md` |
| **Source of truth** | `.specs/admin/stitch/cafedebug-admin/code/themes/*/episode-edit.html` |
| **Visual reference** | `.specs/admin/stitch/cafedebug-admin/images/themes/light/episode-edit.png` |
| **Token source** | `.specs/admin/DESIGN_SYSTEM.md` + `packages/design-tokens/styles.css` |

---

## 1. Architecture Scope

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

## 2. Component Architecture

### 2.1 File map

| Path | Status | Responsibility | Layer |
|---|---|---|---|
| `apps/admin/src/features/episodes/components/episode-editor-form.tsx` | Changed | Replace current Show Notes textarea and inline markdown transforms with a dedicated Show Notes field component. Keep split layout and submit area unchanged. | component |
| `apps/admin/src/features/episodes/components/episode-show-notes-field.tsx` | New | RHF-connected wrapper for write/preview mode, editor mount lifecycle, and field error display. | component |
| `apps/admin/src/features/episodes/components/episode-show-notes-toolbar.tsx` | New | Toolbar UI for bold, italic, link, quote, inline code, bulleted list, numbered list. Stateless/presentational. | component |
| `apps/admin/src/features/episodes/components/episode-show-notes-preview.tsx` | New | Sanitized HTML preview renderer with empty-state fallback. | component |
| `apps/admin/src/features/episodes/hooks/use-episode-show-notes-editor.ts` | New | Tiptap setup, HTML sync with RHF `description`, command handlers, active-state selectors, hydration-safe options. | hook |
| `apps/admin/src/features/episodes/services/episode-show-notes-serialization.ts` | New | HTML extraction helpers and editor-content normalization rules. | service |
| `apps/admin/src/features/episodes/services/episode-show-notes-sanitizer.ts` | New | HTML sanitization allowlist boundary for preview render. | service |
| `apps/admin/src/features/episodes/hooks/use-episode-editor.ts` | Unchanged | Continues to own remote state, submit actions, and route guard behavior. | hook |
| `apps/admin/src/features/episodes/transformers.ts` | Unchanged | Keeps final API payload shaping (`description` stays string). | service |
| `apps/admin/src/features/episodes/schemas/episode.schema.ts` | Unchanged | Keeps `description` validation contract. | schema |

### 2.2 Route boundaries

- `apps/admin/src/app/(admin)/episodes/new/page.tsx` and `apps/admin/src/app/(admin)/episodes/[id]/edit/page.tsx` remain thin and unchanged.
- `apps/admin/src/features/episodes/episode-editor-page.tsx` remains the feature composition boundary for loading/error/invalid-id states.

---

## 3. Editor Design Contract

### 3.1 Tiptap baseline

Required editor stack:

- `@tiptap/react` (v3.x)
- `@tiptap/pm` (v3.x)
- `@tiptap/starter-kit` (v3.x — includes Link extension, no separate `@tiptap/extension-link` needed)

Client safety:

- editor components remain `'use client'`;
- initialize with `immediatelyRender: false` to avoid hydration mismatch in Next.js App Router.

### 3.2 Toolbar command mapping

| UI action | Command intent |
|---|---|
| Bold | toggle bold mark |
| Italic | toggle italic mark |
| Link | set/unset link mark (URL prompt/flow defined at component level) |
| Quote | toggle blockquote node |
| Code | toggle inline code mark |
| Bulleted list | toggle bullet list node |
| Numbered list | toggle ordered list node |

Command states:

- each action has `enabled` and `active` state from the editor instance;
- toolbar actions are disabled when editor is not ready or when preview mode is active.

### 3.3 Write / Preview

- Write mode: editable Tiptap surface.
- Preview mode: sanitized HTML render of current editor document.
- Toggling modes must not drop unsaved edits.

---

## 4. Data Flow

### 4.1 New episode flow (`/episodes/new`)

1. `useEpisodeEditor` creates RHF form with `episodeEditorDefaultValues` (`description: ""`).
2. `EpisodeEditorForm` renders `EpisodeShowNotesField` bound to RHF `description`.
3. Tiptap initializes with empty content from RHF string value.
4. User edits update Tiptap doc, then serialize to HTML string via `editor.getHTML()`.
5. Serialized HTML updates RHF `description` with dirty/touched flags.
6. Submit action (`save-draft` or `publish`) stays unchanged through `toEpisodeRequestPayload`.

### 4.2 Edit flow (`/episodes/[id]/edit`)

1. `useEpisodeEditor` fetches episode and executes `form.reset(toEpisodeEditorDefaults(...))`.
2. Field receives updated RHF `description` (HTML string from backend) and syncs editor content via `editor.commands.setContent(html)`.
3. Sync guard prevents reset loops and false-dirty transitions.
4. User edits follow the same path (doc -> HTML string -> RHF string).
5. Submit keeps current payload shape and mutation logic.
6. Post-success reset behavior remains under `useEpisodeEditor`.

### 4.3 State ownership

| State | Owner |
|---|---|
| Route loading, invalid-id, fetch error | `EpisodeEditorPage` + `useEpisodeEditor` |
| Submit action, submit error, telemetry | `useEpisodeEditor` |
| Write/preview mode | `EpisodeShowNotesField` |
| Editor selection/active marks | `useEpisodeShowNotesEditor` |
| Persisted description value | RHF form (`description: string`, HTML format) |

---

## 5. Preview HTML Pipeline

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

## 6. Styling and Theme Rules

- Keep existing split-pane shell and spacing from current episode editor implementation.
- Use semantic token classes only (`surface`, `surface-container-*`, `on-surface`, `outline-variant`, `focus-ring`).
- No hardcoded colors or ad-hoc dark-mode overrides.
- Keep focus-visible styles for all toolbar and editor interactive elements.
- Preserve light/dark parity and Stitch visual hierarchy.

---

## 7. Accessibility and UX

- Toolbar buttons keep explicit `aria-label`s.
- Editor region keeps programmatic label association with Show Notes field label.
- Visible keyboard focus for toolbar actions and write/preview segmented control.
- Preview mode remains readable and preserves semantic structure for lists, links, quote, and code.
- Error message rendering for `description` stays connected to RHF validation output.

---

## 8. Edge Cases and Mitigations

| Risk | Mitigation |
|---|---|
| Hydration mismatch | Client-only editor leaf + `immediatelyRender: false`. |
| Legacy HTML with unsupported markup | Tiptap gracefully drops unsupported nodes on parse; accept normalization where semantics are preserved. |
| XSS via preview render | Mandatory DOMPurify sanitizer boundary before `dangerouslySetInnerHTML`. |
| Unsafe links | URL protocol filtering in DOMPurify sanitizer policy. |
| Form reset overwrites live edits | Sync guard with last-synced reference/source-aware update logic. |
| Dirty-state regression | All editor changes must route through RHF field updates. |
| Unsupported pasted content | Graceful fallback to plain text when unsupported structures are encountered. |

---

## 9. Acceptance Criteria Mapping

| Spec acceptance | Design mechanism |
|---|---|
| Tiptap-backed editing on new/edit pages | Dedicated `EpisodeShowNotesField` + editor hook replacing textarea internals. |
| Toolbar actions work end-to-end | Explicit command mapping and toolbar action state contract. |
| Preview renders HTML, not raw text | Sanitized HTML preview pipeline. |
| `description` remains backend-compatible string | RHF string storage (HTML format) and unchanged transformer contract. |
| Existing lifecycle states remain intact | No changes to `EpisodeEditorPage` state branches or `useEpisodeEditor` orchestration. |
| Theme fidelity in light/dark | Token-only styling and preserved shell structure. |
| Quality gates pass | Scoped changes to features/episodes plus targeted tests for sync/sanitization/commands. |

---

## 10. Governance Handoff (Design Phase)

- **Phase:** Design (`Specification -> Planning` path is valid)
- **What changed:** Defined component architecture and runtime data flow for Show Notes Tiptap adoption with HTML persistence format, without altering API contracts.
- **Where:** `.specs/admin/episode-editor-tiptap/design.md`
- **Unresolved risks:** Legacy HTML normalization behavior; sanitizer allowlist coverage.
- **Approval status:** Draft design ready for planning (`tasks.md` phase).
