# Episode Editor Refactor Design

## Architecture

- Route files remain thin and render `EpisodeEditorPage`.
- `EpisodeEditorPage` becomes a feature composition boundary.
- A new `useEpisodeEditor` hook owns data loading, mutation orchestration, dirty navigation guard, and submit state.
- A new `EpisodeEditorForm` component owns the split-pane UI and local presentation concerns like preview mode and markdown toolbar behavior.

## UI Structure

### Top Bar

- Back button on the left.
- Overline `EPISODES` and mode-aware subtitle.
- Status badge on the right.

### Left Pane

- Large title input.
- Short description as a secondary support field.
- Show Notes heading.
- Write / Preview segmented control.
- Markdown toolbar with grouped actions.
- Large editor surface.

### Right Pane

- Cover artwork preview surface.
- Cover image URL support field.
- Audio URL input with leading icon.
- Category ID field styled as metadata.
- Publish date input.
- Tag chip editor backed by the existing comma-separated string form field.
- Additional metadata block for episode number.

### Footer

- Sticky footer separated from the content region.
- Cancel, Save Draft, Publish actions aligned to the right.

## Data Rules

- Continue using `episodeEditorSchema`, `toEpisodeEditorDefaults`, and `toEpisodeRequestPayload`.
- Keep `tags` as a string in the form model and adapt it through chip UI helpers.
- Preserve `publishedAt` conversion between datetime-local and ISO strings.
- Preserve existing telemetry and API error reporting behavior.

## Styling Rules

- Use semantic tokens from `packages/design-tokens/styles.css`.
- Follow Stitch spacing and grouping, but do not copy raw CSS.
- Prefer tonal surfaces over heavy borders.
- Maintain visible focus rings and accessible error states.
