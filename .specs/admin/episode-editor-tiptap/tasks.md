# Tasks: Episode Show Notes Editor (Tiptap)

**Status:** Draft  
**Spec:** `.specs/admin/episode-editor-tiptap/spec.md`  
**Design:** `.specs/admin/episode-editor-tiptap/design.md`  
**Assigned to:** Master Planner -> Frontend Blacksmith -> The Debugger -> Documentation Monk

---

## Prerequisites

- [ ] Spec reviewed and approved by Architect Guardian
- [ ] Design reviewed and approved by Architect Guardian
- [ ] Scope confirmed: Show Notes only (no backend/API contract changes)
- [ ] Existing episode editor flows kept as source of truth (`useEpisodeEditor`, schema, payload transformer)

---

## Phase Dependencies

- Phase 1 must finish before editor hook/component implementation.
- Phase 2 depends on Phase 1 services and dependencies.
- Phase 3 depends on Phase 2 editor hook contract.
- Phase 4 depends on Phase 3 integration.
- Phase 5 depends on all validation checks passing.

---

## Phase 1 — Foundation

### Task 1.1 — Add editor dependencies

- [ ] **Task:** Add Tiptap dependencies for admin app
  - **Files:** `apps/admin/package.json`, `pnpm-lock.yaml`
  - **Expected result:** `@tiptap/react@^3`, `@tiptap/pm@^3`, `@tiptap/starter-kit@^3`, underline/highlight/subscript/superscript/text-align/task-list/task-item support, `dompurify`, and typing packages are available
  - **Layer:** service
  - **Architecture note:** Dependency bootstrap only; no behavior change. `@tiptap/markdown` is NOT needed because persistence stays HTML-based.

### Task 1.2 — Create Show Notes serialization service

- [ ] **Task:** Create HTML extraction helpers
  - **Files:** `apps/admin/src/features/episodes/services/episode-show-notes-serialization.ts`
  - **Expected result:** Pure helpers to extract HTML from editor state, detect empty content, and normalize checklist/alignment output when needed
  - **Layer:** service
  - **Architecture note:** No React, no router, no API calls. No markdown conversion needed.

### Task 1.3 — Create Show Notes sanitizer service

- [ ] **Task:** Create preview sanitization boundary
  - **Files:** `apps/admin/src/features/episodes/services/episode-show-notes-sanitizer.ts`
  - **Expected result:** DOMPurify-based allowlist sanitization for preview HTML, unsafe protocol stripping, and explicit support for headings, checklists, alignment attributes/classes, and links
  - **Layer:** service
  - **Architecture note:** Security boundary isolated in feature service

---

## Phase 2 — Editor Engine

### Task 2.1 — Implement Tiptap hook

- [ ] **Task:** Build editor orchestration hook
  - **Files:** `apps/admin/src/features/episodes/hooks/use-episode-show-notes-editor.ts`
  - **Expected result:** Hook owns editor init, expanded command state, HTML sync with RHF `description`, and preview HTML generation
  - **Layer:** hook
  - **Architecture note:** Keep `description` as HTML string contract; no mutation/fetch logic here

### Task 2.2 — Hydration-safe client behavior

- [ ] **Task:** Enforce client-only safe initialization
  - **Files:** `apps/admin/src/features/episodes/hooks/use-episode-show-notes-editor.ts`
  - **Expected result:** Tiptap is initialized with `immediatelyRender: false`; no SSR mismatch
  - **Layer:** hook
  - **Architecture note:** App Router compatibility without touching route files

### Task 2.3 — Configure expanded extension set

- [ ] **Task:** Add and configure required Tiptap extensions
  - **Files:** `apps/admin/src/features/episodes/hooks/use-episode-show-notes-editor.ts`, related types/services
  - **Expected result:** Heading, task list, underline, highlight, subscript, superscript, text alignment, and link support are configured with explicit node/mark rules
  - **Layer:** hook
  - **Architecture note:** Restrict unsupported nodes and keep alignment limited to approved text blocks

---

## Phase 3 — UI Composition and Integration

### Task 3.1 — Create toolbar component

- [ ] **Task:** Build stateless Show Notes toolbar
  - **Files:** `apps/admin/src/features/episodes/components/episode-show-notes-toolbar.tsx`
  - **Expected result:** Controls for heading, bulleted list, numbered list, checklist, quote, bold, italic, strikethrough, inline code, underline, highlight, link, superscript, subscript, and four alignments with active/disabled states
  - **Layer:** component
  - **Architecture note:** Presentation-only component

### Task 3.2 — Create preview component

- [ ] **Task:** Build sanitized HTML preview renderer
  - **Files:** `apps/admin/src/features/episodes/components/episode-show-notes-preview.tsx`
  - **Expected result:** Preview renders sanitized HTML with empty-state fallback
  - **Layer:** component
  - **Architecture note:** Never render unsanitized HTML

### Task 3.3 — Create Show Notes field wrapper

- [ ] **Task:** Compose label, mode toggle, editor surface, and errors
  - **Files:** `apps/admin/src/features/episodes/components/episode-show-notes-field.tsx`
  - **Expected result:** RHF-connected field component with Write/Preview behavior and validation message slot
  - **Layer:** component
  - **Architecture note:** Component consumes form field state; no API interactions

### Task 3.4 — Replace textarea implementation in episode editor form

- [ ] **Task:** Integrate new field and remove manual markdown transform logic
  - **Files:** `apps/admin/src/features/episodes/components/episode-editor-form.tsx`
  - **Expected result:** Legacy textarea + manual command functions are replaced by `EpisodeShowNotesField`; overall page layout and metadata panel remain unchanged
  - **Layer:** component
  - **Architecture note:** Keep existing submit flow and top-level form structure

---

## Phase 4 — Validation and Regression

### Task 4.1 — Add service-level tests

- [ ] **Task:** Test HTML serialization and sanitization
  - **Files:** `apps/admin/tests/episode-show-notes-serialization.test.mjs`, `apps/admin/tests/episode-show-notes-sanitizer.test.mjs`
  - **Expected result:** Round-trip and sanitizer behavior covered for supported formatting, checklist/alignment cases, and unsafe input vectors
  - **Layer:** service
  - **Architecture note:** Keep tests deterministic and isolated

### Task 4.2 — Add editor command coverage

- [ ] **Task:** Verify expanded toolbar command behavior
  - **Files:** targeted hook/component tests under `apps/admin/tests/` or feature-local tests
  - **Expected result:** Heading, checklist, underline, highlight, sub/superscript, alignment, and link behavior are validated without relying on manual-only coverage
  - **Layer:** hook/component
  - **Architecture note:** Focus on feature behavior, not Tiptap internals

### Task 4.3 — Protect existing payload compatibility

- [ ] **Task:** Extend payload regression coverage
  - **Files:** `apps/admin/tests/episodes-editor-payload.test.mjs`
  - **Expected result:** `description` remains string-compatible in `toEpisodeRequestPayload` flows (save draft + publish)
  - **Layer:** service
  - **Architecture note:** No backend contract drift

### Task 4.4 — Route and boundary audit

- [ ] **Task:** Validate no architectural leakage
  - **Files:** `apps/admin/src/app/(admin)/episodes/new/page.tsx`, `apps/admin/src/app/(admin)/episodes/[id]/edit/page.tsx`, `apps/admin/src/app/api/admin/episodes/route.ts`, `apps/admin/src/app/api/admin/episodes/[id]/route.ts`
  - **Expected result:** Routes remain thin and editor logic stays under `features/episodes`
  - **Layer:** server
  - **Architecture note:** Enforce app-vs-feature separation

---

## Phase 5 — Quality Gates and Documentation

### Task 5.1 — Run admin quality gates

- [ ] **Task:** Run lint, typecheck, tests
  - **Files:** `apps/admin/*` (workspace validation)
  - **Expected result:** `pnpm --filter @cafedebug/admin lint`, `pnpm --filter @cafedebug/admin typecheck`, `pnpm --filter @cafedebug/admin test` pass
  - **Layer:** validation
  - **Architecture note:** Required before approval

### Task 5.2 — Update spec lifecycle status after merge

- [ ] **Task:** Mark spec artifacts implemented
  - **Files:** `.specs/admin/episode-editor-tiptap/spec.md`, `.specs/admin/episode-editor-tiptap/design.md`, `.specs/admin/episode-editor-tiptap/tasks.md`
  - **Expected result:** Status fields reflect completion and any final notes
  - **Layer:** documentation
  - **Architecture note:** Keep SDD lifecycle consistency

### Task 5.3 — Provide governance handoff notes

- [ ] **Task:** Record explicit handoff output for implementation and validation
  - **Files:** `.specs/admin/episode-editor-tiptap/spec.md`, `.specs/admin/episode-editor-tiptap/design.md`, `.specs/admin/episode-editor-tiptap/tasks.md`
  - **Expected result:** Each artifact documents what changed, where it changed, unresolved risks, and approval status for the next responsible agent
  - **Layer:** documentation
  - **Architecture note:** Required by `AGENTS.md` delegation and handoff contract

---

## Execution Order

1. Task 1.1  
2. Task 1.2  
3. Task 1.3  
4. Task 2.1  
5. Task 2.2  
6. Task 2.3  
7. Task 3.1  
8. Task 3.2  
9. Task 3.3  
10. Task 3.4  
11. Task 4.1  
12. Task 4.2  
13. Task 4.3  
14. Task 4.4  
15. Task 5.1  
16. Task 5.2  
17. Task 5.3

---

## Validation Checklist (Debugger Gate)

### Architecture

- [ ] Show Notes Tiptap logic exists only in `features/episodes` components/hooks/services
- [ ] `app/` routes remain thin; no editor/payload business logic introduced there
- [ ] `useEpisodeEditor` still owns fetch/reset/mutation/telemetry/navigation orchestration
- [ ] `description` remains string in schema/form/payload (HTML format)
- [ ] Only Show Notes changed; title/metadata fields remain outside Tiptap scope

### Behavior

- [ ] Toolbar commands work for heading, bulleted list, numbered list, checklist, quote, bold, italic, strikethrough, inline code, underline, highlight, link, superscript, subscript, and alignment
- [ ] Write/Preview toggling preserves unsaved content
- [ ] Edit mode loads existing HTML `description` into Tiptap editor and syncs without reset loops
- [ ] Save Draft and Publish submit HTML string as `description` in payload
- [ ] Loading, invalid-id, fetch-error, submit-error flows remain unchanged
- [ ] `description` validation still enforced by `episodeEditorSchema`

### Security

- [ ] Preview HTML is always sanitized before render
- [ ] Unsafe protocols (for example `javascript:`) are stripped/rejected
- [ ] Event handler attributes and executable markup are removed
- [ ] Unsupported pasted HTML degrades safely

### Accessibility

- [ ] Toolbar controls have `aria-label`
- [ ] Editor has programmatic label association with Show Notes
- [ ] Keyboard operation works for toolbar and mode toggle
- [ ] `description` error is visible and semantically tied to the field
- [ ] Focus-visible states are present in light and dark themes
- [ ] Toolbar remains operable and readable at narrower admin breakpoints

### UX and Theme Parity

- [ ] Split-pane structure and spacing remain aligned with Stitch references
- [ ] Semantic token classes are used (no hardcoded hex values)
- [ ] Toolbar active/disabled states reflect editor state
- [ ] Preview empty-state message remains clear and consistent with existing UX
- [ ] Toolbar order matches the approved reference image

### Regression

- [ ] Dirty-state prompt triggers only after actual edits
- [ ] Dirty-state is cleared after successful save/publish/reset
- [ ] Switching Write/Preview without content edits does not create false-dirty state
- [ ] Existing non-Show-Notes fields and submit behavior remain unaffected

---

## Suggested Targeted Test Cases

- [ ] Preview sanitizer (DOMPurify) removes script tags, event attributes, and unsafe URLs
- [ ] Edit flow sync loads existing HTML into editor without overwriting active typing after initial `form.reset`
- [ ] Save draft/publish submit expected `description` HTML string payload
- [ ] Empty editor produces empty or minimal HTML string
- [ ] Checklist HTML round-trips without losing checked state semantics
- [ ] Alignment commands only affect supported block types

---

## Final Approval Gate

- **Approval status:** `✅ Approved` only if all checklist groups pass.
- **Failure status:** `❌ Changes required` if any item fails.
- **Architecture compliance:** must be `✅` before phase handoff to documentation.

---

## Definition of Done

- [ ] Tiptap-backed Show Notes editor is integrated on both `/episodes/new` and `/episodes/[id]/edit`
- [ ] Preview renders sanitized HTML and never raw unsanitized content
- [ ] `description` remains HTML string compatible with existing backend storage and payload transformer
- [ ] Existing editor lifecycle states and submit flows remain intact
- [ ] Light/dark parity preserved with token-based styling
- [ ] Expanded toolbar matches the approved reference set for this phase, excluding image insertion
- [ ] Admin lint/typecheck/test gates pass
