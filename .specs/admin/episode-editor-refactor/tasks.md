# Episode Editor Refactor Tasks

1. Add episode editor spec documents for spec-driven compliance.
2. Update the admin shell so editor routes can render full-width content.
3. Extract a `useEpisodeEditor` hook for form orchestration and route-safe behavior.
4. Add an `EpisodeEditorForm` component that implements the Stitch-inspired split layout.
5. Preserve loading, invalid, and error states in the refactored screen.
6. Keep existing payload behavior intact and verify with tests.
7. Run lint, typecheck, and tests for `@cafedebug/admin`.
