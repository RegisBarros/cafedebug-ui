# CafeDebug Design System Seed

This document defines the initial design-system direction for the modernization effort.

## Design Goal

Keep CafeDebug recognizable while making it feel more current, more consistent, and easier to maintain.

That means:

- preserve the dark header/footer identity
- preserve the warm orange brand tone
- reduce visual noise
- improve spacing and readability
- improve mobile navigation and responsive layouts
- make banners and sponsor areas feel intentional

## Brand Tokens

These values come from the current live site and the legacy SCSS files:

```css
:root[data-brand="cafedebug"] {
  --color-brand: #ed7d00;
  --color-brand-hover: #e65100;
  --color-accent: #eb9736;
  --color-surface-dark: #2c2a2b;
  --color-background: #ffffff;
  --color-text: #2c2c2c;
  --color-text-inverse: #ffffff;
}
```

## Token Strategy

At minimum, `packages/design-tokens` should define:

- color tokens
- typography tokens
- spacing scale
- radius scale
- elevation/shadow tokens
- brand assets metadata

Recommended structure:

```text
packages/design-tokens/
  src/
    brands/
      cafedebug.css
      default.css
    typography.css
    semantic.css
```

## Tailwind Integration

Tailwind should point to semantic CSS variables, not raw hex values.

Example:

```ts
colors: {
  brand: "var(--color-brand)",
  brandHover: "var(--color-brand-hover)",
  accent: "var(--color-accent)",
  surfaceDark: "var(--color-surface-dark)",
  background: "var(--color-background)",
  text: "var(--color-text)",
}
```

## Typography Direction

The legacy site already uses `Nunito Sans`, which is a reasonable bridge between the old and new identity.

Recommended starting point:

- body: `Nunito Sans`
- headings: start with `Nunito Sans` for visual continuity, then evaluate a stronger display companion once the first Figma pass exists
- code: a dedicated monospace stack for code snippets and developer-centric sections

## White-Label Rules

White-label support should only require:

- swapping a brand token file
- updating brand assets metadata
- updating brand-level site metadata

It should not require editing dozens of components.

## Component Guidance

- build a small shared primitive layer first
- use `shadcn/ui` as a foundation, not as the final visual language
- keep public and admin apps visually related but not identical
- public website should feel editorial and content-focused
- admin should feel operational and efficient

## Figma MCP Workflow

Use Figma MCP to keep design and code aligned:

1. define color and typography variables in Figma
2. map the same variables into `packages/design-tokens`
3. build shared primitives in code from those tokens
4. link Figma references from specs for page-level work

Recommended rule:

- use Figma for source design intent
- use code tokens for implementation truth

## First Design Tasks

- confirm the final color scale around the current orange and charcoal palette
- define typography scale for homepage, episode cards, and article-like content
- define spacing and container widths for desktop and mobile
- define reusable banner, episode card, section heading, and team card patterns
