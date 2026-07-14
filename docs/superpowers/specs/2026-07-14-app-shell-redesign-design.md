# App Shell Redesign Design

Date: 2026-07-14
Project: `atujii`
Scope: application shell only

## Goal

Make the product feel like a reliable desktop productivity app on first launch by redesigning the application shell:

- app frame
- title bar
- left navigation shell
- top toolbar shell
- right inspector shell
- empty-state and unselected-state presentation

This phase is about structure, hierarchy, and visual professionalism. It is not a full visual rewrite of every inner component.

## Problem Summary

The current shell communicates "feature-rich prototype" more than "finished desktop product".

Key causes in the current implementation:

- The global background image and heavy translucent surfaces compete with content.
- The title bar and toolbar both attract attention instead of forming a clear hierarchy.
- The sidebar mixes navigation, utilities, and management actions in one visual block.
- The right panel behaves more like an attached info box than a true inspector.
- Empty and idle states do not provide a strong, stable layout impression.

Relevant files today:

- `src/components/AppUI.tsx`
- `src/components/MainContent.tsx`
- `src/components/TitleBar.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Toolbar/index.tsx`
- `src/components/ImageInfoSidebar.tsx`

## Approaches Considered

### Approach A: Cosmetic polish on the current shell

Change colors, blur, spacing, and button styling without altering structure.

Pros:

- Fastest to ship
- Lowest implementation risk

Cons:

- Does not solve the weak hierarchy
- Will still feel improvised under real usage
- Likely requires another rewrite later

### Approach B: Structural shell redesign with conservative visuals

Keep current information architecture, but rebuild the shell into a stable desktop workspace with clearer zones and quieter visuals.

Pros:

- Strong improvement in first impression
- Reuses most existing behaviors
- Lowers risk compared with a full product-wide redesign
- Creates a cleaner base for later grid, search, and settings work

Cons:

- Requires touching several central layout components
- Some child components may need minor follow-up alignment work

### Approach C: Full premium redesign across shell and inner content

Redesign the shell, grid, search, cards, detail panels, and settings all at once.

Pros:

- Highest ceiling
- Most visually transformative

Cons:

- Too much scope for one pass
- Hard to validate cause and effect
- High chance of regressions and inconsistent completion

## Recommendation

Choose **Approach B**.

This is the right balance for the current project stage. It improves perceived quality quickly without forcing a full UI rewrite before the product shell is stable.

## Design Principles

1. Content first
   The media area should be the visual center of gravity.

2. Quiet chrome
   Navigation and frame elements should support, not compete with, browsing.

3. Stable workspace
   The app should read as a desktop workspace with fixed zones, not floating panels.

4. One emphasis at a time
   The shell should use accent color mainly for selection, primary actions, and active states.

5. Reduced decoration
   Professional feeling comes from layout discipline more than effects.

## Chosen Visual Direction

The shell will move from "glass + background image" toward "editor workspace".

Direction:

- Use a neutral app background instead of a dominant full-screen image.
- Reduce blur and transparency across primary surfaces.
- Use solid or near-solid panels for navigation, toolbar, and inspector.
- Keep rounded corners and shadows restrained.
- Let color accents appear in active navigation, selected filters, primary import action, and current inspector tab.

Background image behavior:

- Keep support for user background images in settings.
- Stop treating the background image as the main shell visual.
- If a background image is present, it should be visually suppressed behind a stronger neutral overlay.

## Layout Design

### Global frame

The app becomes a three-zone workspace under a light desktop frame:

1. Title bar
2. Toolbar row
3. Main workspace

The main workspace contains:

1. Left navigation rail / sidebar
2. Center browsing area
3. Right inspector

### Title bar

`src/components/TitleBar.tsx`

Requirements:

- Reduce visual weight
- Use a flatter, calmer surface
- Make window controls feel native-adjacent
- Keep logo presence subtle

Behavior:

- Remains draggable
- Still supports maximize on double click
- Should no longer feel like a second toolbar

### Toolbar

`src/components/Toolbar/index.tsx`

Requirements:

- Establish a strong single action row
- Separate primary actions from browsing controls
- Avoid a "button parade" look

Structure:

- Left: sidebar toggle, import
- Center: search, sort, filter, view controls
- Right: utility actions such as settings, shortcuts, network/server actions

Behavior:

- Batch mode should visibly transform the row into a selection context
- Default mode should prioritize browsing controls

### Sidebar

`src/components/Sidebar.tsx`

Requirements:

- Behave like navigation first
- Reduce mixed visual density
- Create clear zones

Sections:

1. Library scope
   Example: all images, favorites, videos, recents
2. Category tree
   User-managed folders/categories
3. Utility footer
   Import folder, theme/language, secondary utilities

Behavior:

- Selected category must be obvious
- Parent/child hierarchy should be visually cleaner
- Drag-and-drop affordance should exist without dominating idle state

### Center browsing area

`src/components/MainContent.tsx`

Requirements:

- Read as the main canvas
- Maintain stable paddings and boundaries
- Avoid shell visual effects that compete with thumbnails

Behavior:

- The media region should not shrink awkwardly when the inspector is open
- Zen mode should feel intentional rather than like an inverted toggle state

### Right inspector

`src/components/ImageInfoSidebar.tsx`

Requirements:

- Behave like an inspector, not a side note
- Use calmer framing than the content area
- Be useful even before selection

States:

1. Nothing selected
   Show collection summary and contextual help
2. One item selected
   Show tabs and editable metadata
3. Multi-selection
   Not in this phase unless already supported cleanly

Behavior:

- Fixed width
- Stable vertical structure
- Tab headers should feel like inspector sections

## Component-Level Changes

### `src/components/AppUI.tsx`

- Remove content-dominating shell background treatment
- Replace multi-layer translucent shell with stronger neutral base surfaces
- Tighten top-level spacing
- Preserve current dialog wiring and behavior

### `src/components/MainContent.tsx`

- Normalize shell spacing around toolbar, grid, and inspector
- Ensure the inspector is part of the shell composition, not a detached overlay feeling
- Keep media content as the dominant visual mass

### `src/components/TitleBar.tsx`

- Flatten styling
- Simplify window-control hover states
- Reduce logo emphasis

### `src/components/Sidebar.tsx`

- Visually separate navigation groups
- Move lower-priority controls away from the main category list
- Improve selected and hover states

### `src/components/Toolbar/index.tsx`

- Re-group actions into primary / browse / utility sections
- Improve alignment rhythm
- Make search feel like a tool surface, not a popup graft

### `src/components/ImageInfoSidebar.tsx`

- Reframe as inspector panel
- Improve unselected state
- Use more structured section spacing and headers

## Empty and Idle States

The shell must look intentional even when:

- no library content exists
- no item is selected
- sidebar is collapsed
- zen mode is enabled

Minimum rules:

- Do not leave visually dead blank areas
- Keep panel borders and spacing stable
- Use short, professional helper copy instead of playful filler

## Interaction and Motion

Motion should stay minimal:

- soft hover transitions
- subtle panel-state transitions
- no decorative floating or excessive blur animation

This phase does not introduce expressive motion design.

## Accessibility and Usability

- Keep contrast stronger than the current translucent surfaces
- Preserve keyboard accessibility for existing controls
- Avoid shrinking interactive targets in the title bar, sidebar, and toolbar
- Ensure selected states are visible without relying only on color

## Non-Goals

This phase does not include:

- redesigning media cards in detail
- rewriting search behavior
- changing tagging flows
- redesigning settings internals
- major state management changes
- backend or data model changes

## Implementation Boundaries

Expected edit targets in the first pass:

- `src/components/AppUI.tsx`
- `src/components/MainContent.tsx`
- `src/components/TitleBar.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Toolbar/index.tsx`
- `src/components/ImageInfoSidebar.tsx`

Possible light-touch follow-up edits:

- shared shell utility classes
- local layout wrappers
- small supporting style adjustments in toolbar child components

## Validation

The redesign is successful if:

1. The app reads as a unified workspace in screenshots.
2. First-time users can identify navigation, browsing, and metadata zones immediately.
3. The media area feels more prominent than the shell chrome.
4. The UI feels more credible without adding new product features.
5. Existing core interactions still work after the shell refactor.

## Rollout Plan

1. Rebuild shell surfaces and layout composition
2. Refine toolbar grouping and hierarchy
3. Refine sidebar zoning
4. Reframe inspector states
5. Run interaction and regression checks

