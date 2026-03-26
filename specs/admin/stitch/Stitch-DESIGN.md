# Design System Specification: Editorial Tech-Forward Management

> Note: `specs/admin/DESIGN_SYSTEM.md` is the canonical design-system specification for implementation. This file preserves Stitch creative-direction source guidance.

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Curator"
This design system rejects the "standard dashboard" aesthetic in favor of a high-end editorial experience. We are not just building a management tool; we are building a stage for content creators. 

The visual language is defined by **Organic Minimalism**. It moves away from rigid, boxed-in layouts and instead uses "breathing room" (intentional white space) and "tonal layering" to guide the user’s eye. By utilizing high-contrast typography scales and overlapping elements, we create a sense of depth and sophistication that feels more like a premium magazine than a generic admin panel.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep, warm earths and high-vibrancy accents. We prioritize "Optical Comfort" by avoiding pure blacks and high-contrast whites.

### The Palette (Dark Mode Optimized)
*   **Primary Accent:** `#ffb59d` (Surface Light) / `#ff6b35` (Container/Action). This is our signature "Heat."
*   **Surface:** `#1d100c` (The base sheet).
*   **Tertiary:** `#59d5fb` (Used for "Cold" tech data points/analytics).

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off areas. Layout boundaries must be defined strictly through:
1.  **Background Color Shifts:** Placing a `surface-container-low` component against a `surface` background.
2.  **Vertical Rhythm:** Using the Spacing Scale (e.g., `8` or `10` tokens) to create logical groupings.

### The Glass & Gradient Rule
To move beyond a flat UI, use semi-transparent surface colors (`Surface-Variant` at 60% opacity) with a `24px` backdrop-blur for floating modals or navigation overlays. For Primary CTAs, apply a subtle linear gradient from `primary` to `primary_container` to give the button "soul" and weight.

---

## 3. Typography Scale
We utilize a pairing of **Space Grotesk** (Display/Headlines) for a tech-brutalist edge and **Plus Jakarta Sans** (Body/UI) for superior legibility.

| Token | Font Family | Size | Purpose |
| :--- | :--- | :--- | :--- |
| **display-lg** | Space Grotesk | 3.5rem | Hero numbers/impact stats. |
| **headline-md** | Space Grotesk | 1.75rem | Page titles and major section headers. |
| **title-md** | Plus Jakarta | 1.125rem | Card titles and sub-navigation. |
| **body-md** | Plus Jakarta | 0.875rem | Standard UI text and metadata. |
| **label-sm** | Plus Jakarta | 0.6875rem | Micro-copy, captions, and overlines. |

**Editorial Note:** Use `headline-sm` in all-caps with `0.1em` letter spacing for section overlines to create an authoritative, curated feel.

---

## 4. Elevation & Tonal Layering
Traditional drop shadows are largely replaced by **Surface Nesting**. 

*   **The Layering Principle:** Depth is achieved by "stacking" tiers. A podcast episode card (`surface-container-lowest`) sits on a content area (`surface-container-low`), which sits on the global background (`surface`). This creates a soft, natural lift.
*   **Ambient Shadows:** For floating elements (Popovers), use a shadow tinted with the `on-surface` color at 6% opacity with a `32px` blur.
*   **The "Ghost Border":** If a separation is strictly required for accessibility, use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Component Specifications

### Buttons: The Action Drivers
*   **Primary:** Background: Gradient (`primary` to `primary_container`). Radius: `lg` (0.5rem). Text: `on-primary` (Bold).
*   **Tertiary (Ghost):** No background. Text: `primary`. On hover: `surface-container-highest` background.
*   **Interaction:** On press, scale the button to `98%` to provide tactile feedback.

### Input Fields: The Data Entry
*   **Style:** Background: `surface-container-highest`. 
*   **State:** No border in default state. On focus, a 2px "Ghost Border" of `primary` appears, and the label shifts to `primary` color.
*   **Radius:** `lg` (0.5rem).

### Cards & Podcast Lists
*   **Rule:** Forbid divider lines between list items. Use a `1.4rem` (token `4`) vertical gap between items.
*   **Structure:** Use `surface-container-low` for the card body. On hover, transition the background to `surface-container-high` to indicate interactivity without using a shadow.

### Badges & Status
*   **Tech-Forward Indicator:** Instead of a solid block, use a `tertiary_container` background with `on_tertiary_container` text. Keep the radius `full` for a "pill" look.

---

## 6. Do’s and Don'ts

### Do:
*   **Embrace Asymmetry:** Align high-level stats to the left and secondary actions to the far right with significant whitespace between them.
*   **Use Tonal Transitions:** Use a subtle gradient across the sidebar (`surface-container-lowest` to `surface`) to create depth.
*   **Prioritize Typography:** Let the size of the text define the importance, not the weight of the box containing it.

### Don’t:
*   **Don't Use "Card-in-Card" Shadows:** This creates visual clutter. Use background color shifts instead.
*   **Don't Use Pure White/Black:** It breaks the "Editorial" warmth. Stick strictly to the `surface` and `on-surface` tokens.
*   **Don't Use Default Icons:** Use a custom, thin-stroke icon set (1.5px weight) to match the sophistication of Space Grotesk.

---

## 7. Structural Build Guide
*   **Sidebar Width:** 240px. Use `surface-container-lowest`.
*   **Content Padding:** `3.5rem` (token `10`) global gutter to ensure the "Spacious" attribute is maintained.
*   **Gaps:** Use the `1rem` (token `3`) for internal card padding and `2rem` (token `6`) for section spacing.
