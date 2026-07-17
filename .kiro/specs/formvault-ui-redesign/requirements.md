# Requirements Document

## Introduction

This document specifies the requirements for the FormVault UI/UX redesign. FormVault is a Windows desktop Electron app that lives in the system tray. Its core workflow — hotkey → popup → search → copy → paste — must feel as fast and trustworthy as Raycast. The Vault Manager must feel as organised as Linear. The Settings window must feel as clean as Windows 11's native Settings.

This redesign covers: design tokens, shared component library, all three windows (Popup, Vault Manager, Settings), and five UX workflow improvements (empty-field filtering, copy feedback, inline delete confirmation, drag-to-reorder, profile completion indicator / onboarding).

**Aesthetic declaration:**
`aesthetic: dark-luxury minimalism · layout: command-palette (popup) + sidebar-content (vault) · motion: spring ≤150ms · palette: deep-slate neutral + single cyan accent · reference: Raycast / Linear / Windows 11`

## Overview

FormVault is a Windows desktop Electron app that lives in the system tray. Its core workflow — hotkey → popup → search → copy → paste — must feel as fast and trustworthy as Raycast. The Vault Manager must feel as organised as Linear. The Settings window must feel as clean as Windows 11's native Settings.

This redesign covers: design tokens, shared component library, all three windows (Popup, Vault Manager, Settings), and five UX workflow improvements (empty-field filtering, copy feedback, inline delete confirmation, drag-to-reorder, profile completion indicator / onboarding).

**Aesthetic declaration:**
`aesthetic: dark-luxury minimalism · layout: command-palette (popup) + sidebar-content (vault) · motion: spring ≤150ms · palette: deep-slate neutral + single cyan accent · reference: Raycast / Linear / Windows 11`

---

## Constraints (non-negotiable)

- Stack: Electron + electron-vite, React 18, TypeScript, Tailwind CSS, CVA
- No additional styling libraries (no shadcn/ui)
- One new dependency allowed: `@phosphor-icons/react` (replaces `@heroicons/react`)
- OS theme followed via `prefers-color-scheme` — no in-app theme switch
- No changes to Electron IPC handlers (`electron/` directory)
- No changes to the SQLite data model (`src/shared/types.ts`)
- No changes to build system or app architecture (3 separate Vite entry points)
- All animations ≤150ms
- WCAG AA contrast on all text/background pairs
- Minimum supported OS: Windows 10 — rules out Windows-11-only APIs (e.g. native Acrylic `backgroundMaterial`) for any feature required at launch

---

## Requirements

### REQ-1: Design Token System

#### REQ-1.1 — Color Palette
When the system color scheme is dark, the app MUST use the following palette derived from color-systems.md §1 (SaaS/productivity) — neutral graphite base (near-zero blue cast) with a single cyan accent. This supersedes the original deep-slate/navy palette: user testing found the navy base (`#0A0F1E` family) read as "blueish" and overly contrasty rather than neutral-dark; the graphite family below keeps R≈G≈B at each step to avoid a color cast, and every pair has been re-verified against WCAG AA (see ratios below):

| Token | Dark Value | Light Value | Purpose |
|---|---|---|---|
| `--fv-canvas` | `#18181B` | `#F7F8FA` | Window background |
| `--fv-surface` | `#202023` | `#FFFFFF` | Sidebar, input wells |
| `--fv-card` | `#27272A` | `#FFFFFF` | Cards, panels |
| `--fv-popup-bg` | `rgba(39,39,42,0.92)` | `rgba(255,255,255,0.92)` | Popup simulated-glass bg (see REQ-4.1) |
| `--fv-hover` | `#303034` | `#EEF0F5` | Hover fill |
| `--fv-active` | `#3A3A3F` | `#E2E5EE` | Selected/pressed fill |
| `--fv-ink` | `#FAFAFA` | `#111827` | Primary text |
| `--fv-ink-secondary` | `#A1A1AA` | `#4B5563` | Secondary text |
| `--fv-ink-muted` | `#8E8E93` | `#6B7280` | Placeholders, hints |
| `--fv-stroke` | `rgba(255,255,255,0.10)` | `#E5E8EF` | Standard border |
| `--fv-stroke-subtle` | `rgba(255,255,255,0.06)` | `#EEF0F5` | Hairline dividers |
| `--fv-accent` | `#06B6D4` | `#0E7490` | CTAs, active states only |
| `--fv-accent-hover` | `#22D3EE` | `#0891B2` | Accent hover |
| `--fv-accent-ink` | `#18181B` | `#FFFFFF` | Text on accent fills |
| `--fv-accent-subtle` | `rgba(6,182,212,0.14)` | `rgba(14,116,144,0.10)` | Accent tinted bg |
| `--fv-success` | `#34D399` | `#047857` | Success states |
| `--fv-warning` | `#FBBF24` | `#B45309` | Warning states |
| `--fv-danger` | `#F87171` | `#B91C1C` | Destructive actions |
| `--fv-shadow` | `0 0 0` | `15 23 42` | Shadow base color |

Light-mode `--fv-success`/`--fv-warning`/`--fv-danger` and `--fv-accent`/`--fv-accent-ink` are darkened from the more saturated hues one might reach for by default (e.g. `#059669`, `#D97706`, `#DC2626`, `#0891B2`) specifically because those lighter shades fail AA when used as literal text (e.g. the popup's "Copied" label, `Button` `danger` variant text) against the light canvas/card — computed ratios below.

**Computed contrast ratios (verified, not estimated):**
| Pair | Ratio | Pair | Ratio |
|---|---|---|---|
| dark ink / canvas | 16.97:1 | light ink / card | 17.74:1 |
| dark ink / card | 14.27:1 | light ink-secondary / card | 7.11:1 |
| dark ink-secondary / card | 5.81:1 | light ink-muted / card | 4.55:1 |
| dark ink-muted / card | 4.55:1 | light accent-ink (white) / accent | 5.36:1 |
| dark accent-ink / accent | 7.30:1 | light success / card | 5.16:1 |
| dark success / card | 7.75:1 | light warning / card | 4.73:1 |
| dark warning / card | 8.92:1 | light danger / card | 6.09:1 |
| dark danger / card | 5.38:1 | | |

**Acceptance criteria:**
- WHEN the OS is in dark mode THEN every rendered color MUST match the dark-mode token values
- WHEN the OS is in light mode THEN every rendered color MUST match the light-mode token values
- ALL text/background contrast pairs MUST meet WCAG AA (≥4.5:1 for body text, ≥3:1 for large text ≥18px)
- The accent color (`--fv-accent`) MUST appear ONLY on interactive CTAs, active indicators, focus rings, and selection states — never on decorative elements, icons, or dividers

#### REQ-1.2 — Typography
The font stack MUST remain Segoe UI Variable (Windows-native, no network fetch):
- `font-sans`: `"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif`
- `font-display`: `"Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif`
- `font-mono`: `"Cascadia Mono", Consolas, ui-monospace, monospace`

Type scale MUST be:
| Token | Size | Line-height | Weight | Letter-spacing |
|---|---|---|---|---|
| `caption` | 11px | 14px | 400 | 0 |
| `label` | 12px | 16px | 400/500 | 0 |
| `body` | 13px | 18px | 400 | 0 |
| `body-lg` | 14px | 20px | 400 | 0 |
| `heading` | 15px | 20px | 600 | -0.01em |
| `display` | 18px | 24px | 600 | -0.02em |

#### REQ-1.3 — Radius System
| Token | Value | Applied to |
|---|---|---|
| `radius-control` | `6px` | Buttons, inputs, small chips |
| `radius-card` | `10px` | Cards, rows, list containers |
| `radius-float` | `14px` | Popup, modals, dropdowns |
| `radius-pill` | `9999px` | Category tabs, profile chip |

#### REQ-1.4 — Shadow / Elevation System
| Token | Value | Applied to |
|---|---|---|
| `elevation-1` | `0 1px 2px rgba(shadow/0.12), 0 1px 4px rgba(shadow/0.08)` | Cards, inputs |
| `elevation-2` | `0 4px 16px rgba(shadow/0.18), 0 2px 6px rgba(shadow/0.10)` | Dropdowns, secondary panels |
| `elevation-3` | `0 16px 48px rgba(shadow/0.28), 0 6px 16px rgba(shadow/0.16)` | Popup window, modals |

#### REQ-1.5 — Motion Tokens
The following CSS custom properties MUST be defined and used consistently:
```
--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--duration-fast: 80ms
--duration-base: 120ms
--duration-slow: 150ms
```
- WHEN any interactive element is hovered THEN the transition MUST use `--duration-base` or faster
- WHEN the popup window appears THEN the entry animation MUST use `--duration-slow` with `--ease-spring`
- No animation MUST exceed 150ms

---

### REQ-2: Icon System Migration

#### REQ-2.1 — Replace Heroicons with Phosphor
- `@phosphor-icons/react` MUST be installed and `@heroicons/react` MUST be removed from all imports
- A single icon weight style MUST be used consistently per context:
  - Navigation, interactive controls: `regular` weight
  - Active states, primary actions: `bold` weight
  - Decorative, subtle hints: `light` weight
- Mixing icon styles within the same view IS NOT allowed

#### REQ-2.2 — Icon Size Tokens
Three icon sizes MUST be used consistently:
| Token | Size | Used for |
|---|---|---|
| `icon-sm` | 14px | Inline with text, Kbd hints |
| `icon-md` | 16px | Buttons, list items |
| `icon-lg` | 20px | Empty states, section headers |

#### REQ-2.3 — Field Icons
- Emoji field icons MUST be removed from all UI rendering
- WHEN a field is displayed in the popup or vault manager THEN the field's icon MUST be rendered as a Phosphor icon using a mapping from icon identifier string to Phosphor component
- The FieldForm MUST provide a Phosphor icon picker (grid of selectable icons) replacing the free-text emoji input
- A default icon (e.g. `Tag` weight `regular`) MUST be used when a field has no icon set

---

### REQ-3: Shared Component Library

#### REQ-3.1 — Button
The Button component MUST support these variants via CVA:
- `primary`: accent background, dark text, hover darkens accent
- `secondary`: surface background, stroke border, elevation-1
- `ghost`: no background, secondary ink, hover shows surface bg
- `danger`: danger-colored text, hover shows danger/10 bg
- `destructive-confirm`: danger background fill — only appears during inline confirm state

Sizes: `sm` (h-7), `md` (h-8), `icon` (h-7 w-7), `icon-md` (h-8 w-8)

**Acceptance criteria:**
- WHEN a `primary` button is disabled THEN its opacity MUST be 40% and it MUST NOT respond to pointer events
- WHEN a `danger` button is clicked THEN it MUST NOT immediately trigger the destructive action — the InlineConfirm pattern (REQ-3.7) MUST be used by callers
- ALL buttons MUST have a visible `:focus-visible` ring using the accent color

#### REQ-3.2 — Input, Textarea, Select
- Base class MUST use `--fv-surface` background, `--fv-stroke` border, `--fv-accent` focus border
- WHEN focused THEN border MUST transition to accent color using `--duration-base`
- WHEN hovered (not focused) THEN border MUST lighten slightly
- Height: Input and Select `h-8`, Textarea `min-h-[72px]`

#### REQ-3.3 — Dialog / Modal
- MUST render with `backdrop-blur-[4px]` scrim over `bg-canvas/70`
- MUST animate in with `float-in` keyframe
- MUST close on Escape key and scrim click
- MUST trap focus within the dialog while open
- MUST render with `elevation-3` shadow

#### REQ-3.4 — Switch
- WHEN `checked` THEN background MUST use `--fv-accent` and thumb MUST use `--fv-accent-ink`
- WHEN unchecked THEN background MUST use `--fv-active` surface
- Thumb transition MUST use `--duration-base` with `--ease-spring`

#### REQ-3.5 — Toast Notification System
A new `Toast` component and `useToast` hook MUST be implemented:
- Toasts MUST appear in a fixed container at the bottom-right of the screen
- Toasts MUST auto-dismiss after 4 seconds
- Toasts MUST support variants: `success`, `error`, `info`
- Toasts MUST animate in from the bottom (`translateY(8px) → translateY(0)`) and out upward on dismiss
- A maximum of 3 toasts MAY be visible simultaneously; older toasts are pushed out

**Acceptance criteria:**
- WHEN a vault export succeeds THEN a `success` toast MUST appear with the export path
- WHEN a vault import succeeds THEN a `success` toast MUST appear
- WHEN an export or import is cancelled THEN a `info` toast MUST appear
- WHEN any operation fails THEN an `error` toast MUST appear
- The `window.confirm()` and inline `{dataStatus}` text patterns MUST be fully replaced by toasts in the Settings window

#### REQ-3.6 — Kbd (Keyboard Hint Badge)
- Background: `--fv-card` with `elevation-1`
- Border: `--fv-stroke`
- Font: `font-mono`, `caption` size
- Border-radius: `4px`

#### REQ-3.7 — InlineConfirm Pattern
A reusable `InlineConfirm` component MUST be implemented for all destructive actions:
- Default state: renders as a `danger` variant ghost button (icon + optional label)
- WHEN clicked THEN it MUST transition in-place to a confirmation row showing "Delete?" text + "Yes, delete" (destructive-confirm Button) + "Cancel" (ghost Button)
- The transition MUST use `--duration-base` fade+scale animation
- WHEN "Cancel" is clicked THEN it MUST revert to the default state with no action taken
- WHEN "Yes, delete" is clicked THEN the `onConfirm` callback MUST be called

**Acceptance criteria:**
- WHEN a destructive action button is rendered THEN it MUST use `InlineConfirm` — `window.confirm()` MUST NOT appear anywhere in the codebase
- WHEN the confirmation row is shown THEN focus MUST move to the "Yes, delete" button
- WHEN Escape is pressed while confirmation row is open THEN it MUST revert to default state

#### REQ-3.8 — EmptyState
- Icon container: `h-12 w-12`, `rounded-card`, `bg-accent-subtle`
- Icon: `icon-lg`, `text-accent`
- Title: `body` weight 500, `--fv-ink`
- Description: `label`, `--fv-ink-muted`, max-width 260px
- Action slot: optional, rendered below description

---

### REQ-4: Popup Window Redesign

The popup is the highest-usage surface. It MUST feel like a premium command palette (Raycast-quality).

#### REQ-4.1 — Glassmorphism Treatment
**Platform constraint (verified against Electron/Chromium, not assumed):** a real background blur of desktop content behind the popup is not achievable while supporting Windows 10+. `backdrop-filter` on a transparent Electron `BrowserWindow` only blurs content within the page's own DOM — it cannot sample real content behind the OS window ([electron/electron#30412](https://github.com/electron/electron/issues/30412)), so `blur(20px)` on an otherwise-empty transparent window is a no-op that produces exactly the flat, un-blurred tint originally reported as a bug. The only real alternative, Windows' native Acrylic material (`backgroundMaterial: 'acrylic'`), requires **Windows 11 22H2+** and has multiple open Electron bugs specific to frameless/transparent windows ([#38466](https://github.com/electron/electron/issues/38466), [#48031](https://github.com/electron/electron/issues/48031)) — incompatible with a Windows 10+ support target. REQ-4.1 therefore specifies a **simulated glass** treatment: no `backdrop-filter`, an opaque-enough tint to stay legible over arbitrary desktop content, and a semi-transparent border/inset highlight carrying the "glass edge" cue instead of a real blur.

- The popup container MUST use `background: var(--fv-popup-bg)` (no `backdrop-filter`)
- A 1px border MUST appear at `rgba(255,255,255,0.14)` in dark mode, `rgba(0,0,0,0.12)` in light mode
- The outer shell MUST use `border-radius: var(--radius-float)` and a shadow combining `elevation-3` with a `inset 0 1px 0 rgba(255,255,255,0.06)` top highlight to read as a catch-light edge
- IF a future release targets Windows 11 22H2+ exclusively THEN native Acrylic (`backgroundMaterial: 'acrylic'`) MAY be revisited as a progressive enhancement with a fallback to this simulated treatment on unsupported systems

**Acceptance criteria:**
- WHEN the popup appears THEN the tinted background MUST be visible and read as intentionally translucent (not a solid opaque panel, not visually "broken")
- The tint MUST NOT degrade popup text readability — all text MUST meet WCAG AA contrast
- The popup MUST render identically (same tint/border/shadow treatment, no missing-blur artifacts) on Windows 10 and all Windows 11 builds

#### REQ-4.2 — Search Bar
- The search input MUST be the first focused element when the popup opens
- Placeholder: "Search your vault…"
- WHEN the query is non-empty THEN a clear (×) button MUST appear at the right of the input
- The search icon MUST use Phosphor `MagnifyingGlass` `regular` weight, `icon-md`

**Acceptance criteria:**
- WHEN the popup opens THEN the search input MUST be focused automatically
- WHEN Escape is pressed with an empty query THEN the popup MUST close
- WHEN Escape is pressed with a non-empty query THEN the query MUST be cleared first; a second Escape MUST close the popup

#### REQ-4.3 — Category Tabs
- Active tab indicator MUST be an absolutely-positioned pill that slides between tabs using `transform: translateX()` — NOT a background swap
- Tab labels MUST use `label` type size
- Only categories that have at least one non-empty field MUST be shown as tabs

**Acceptance criteria:**
- WHEN the active category changes THEN the sliding indicator MUST animate between positions using `--duration-base` with `--ease-spring`
- WHEN Tab key is pressed THEN focus MUST cycle forward through categories
- WHEN Shift+Tab is pressed THEN focus MUST cycle backward through categories
- A category tab MUST NOT appear if all fields in that category have empty values

#### REQ-4.4 — Field List
- Fields with an empty value MUST NOT appear in the popup list
- Group headers (in "All" view) MUST be rendered as compact uppercase labels with `caption` size and `--fv-ink-muted` color
- The selected field row MUST use `--fv-active` background with a 2px left accent bar
- WHEN a field is selected and Enter is pressed THEN it MUST show a brief "Copied!" feedback state before the popup closes

**Acceptance criteria:**
- WHEN a field's `value` is an empty string THEN it MUST NOT appear in the popup field list regardless of category or search state
- WHEN a search query is entered AND no fields with non-empty values match THEN the empty state MUST show "No results" with a Phosphor `MagnifyingGlass` icon
- WHEN the vault has no fields with non-empty values THEN the empty state MUST show "Your vault is empty" with a CTA to open the Vault Manager
- The field list scroll MUST NOT cause layout shift in the search bar or footer

#### REQ-4.5 — Copy Feedback
- WHEN a field is selected (Enter or click) THEN the field row MUST immediately show a `success`-colored "Copied!" state (Phosphor `CheckCircle` icon + "Copied" text)
- The popup MUST remain visible for 600ms in the "Copied!" state before closing
- WHEN `autoPaste` capability is available THEN the label SHOULD read "Pasted!" instead of "Copied!"

**Acceptance criteria:**
- WHEN a field is selected THEN the visual feedback MUST appear within one animation frame (≤16ms)
- WHEN the popup closes after copy THEN it MUST close with a fade-out animation, not abrupt disappearance
- The 600ms delay MUST be cancellable — if the user presses Escape during the delay THEN the popup MUST close immediately

#### REQ-4.6 — Profile Switcher
- WHEN only one profile exists THEN the profile switcher chip MUST be hidden
- WHEN multiple profiles exist THEN the chip MUST show the active profile name (no emoji) with a Phosphor `CaretDown` icon
- The dropdown MUST use `elevation-2`, `radius-card`, `border: var(--fv-stroke)`, and `animate-float-in`

#### REQ-4.7 — Footer
- The footer hint bar MUST be compact: single row, `caption` size, `--fv-ink-muted` text
- Keyboard hints MUST use the `Kbd` component
- The "Add field" and Settings buttons MUST remain but use Phosphor icons (`Plus`, `Gear`)
- WHEN the field count is 0 THEN the footer hint row MUST be hidden (replaced by the empty state)

---

### REQ-5: Vault Manager Redesign

#### REQ-5.1 — Sidebar (ProfileManager)
- The FormVault wordmark MUST appear at the top of the sidebar using `font-display` weight 600
- Profile list items MUST show a colored left-bar indicator (2px wide, accent color) on the active profile
- Profile icons MUST be replaced with initials derived from the profile name (first 2 characters, uppercase) rendered in a colored circle using the profile's `color` field
- WHEN a profile is hovered THEN the delete button for non-default profiles MUST slide in from the right using opacity transition
- The "New profile" button MUST use Phosphor `Plus` icon

#### REQ-5.2 — Main Header
- Profile name MUST use `display` type
- Field count + file count subtitle MUST use `label` `--fv-ink-muted`
- Filter input MUST have a Phosphor `MagnifyingGlass` leading icon
- "Add field" button MUST be primary variant with Phosphor `Plus` icon
- The header MUST have a `border-b border-stroke-subtle` separator

#### REQ-5.3 — Field List with Drag-to-Reorder
- Fields within each category MUST be reorderable via drag-and-drop
- WHEN a drag is in progress THEN the dragged item MUST appear with `elevation-2` shadow and slight scale-up (`scale(1.02)`)
- WHEN a drop occurs THEN the new sort order MUST be persisted via `ipc.updateField` with updated `sortOrder` values
- The drag handle MUST use Phosphor `DotsSixVertical` icon, `icon-sm`, visible only on row hover

**Acceptance criteria:**
- WHEN fields are reordered by drag THEN the `sortOrder` values MUST be updated such that the new visual order matches the stored order on next load
- Drag-to-reorder MUST only work within the same category — cross-category drag IS NOT supported
- WHEN a drag is cancelled (Escape key or drop outside valid target) THEN the original order MUST be restored

#### REQ-5.4 — Field Row
- Field row height MUST be `py-2.5 px-3` (slightly taller than current for better click targets)
- Field icon MUST render as a Phosphor icon component (not emoji)
- Sensitive field values MUST show masked by default; reveal button MUST use Phosphor `Eye` / `EyeSlash`
- Copy button MUST use Phosphor `Copy` / `CheckCircle` (success state)
- Edit button MUST use Phosphor `PencilSimple`
- Delete button MUST be wrapped in `InlineConfirm` (REQ-3.7) — no `window.confirm()`

#### REQ-5.5 — FieldForm Dialog
- The icon field MUST be replaced with an icon picker: a grid of Phosphor icons (at least 30 common icons) the user can click to select
- WHEN the icon picker is open THEN it MUST appear as an inline expanding grid below the label row, NOT a separate modal
- The selected icon MUST be displayed prominently next to the label field
- All other form fields (label, value, category, type, shortcut) MUST remain unchanged

#### REQ-5.6 — File Vault (Collapsible)
- The Files section MUST be wrapped in a collapsible disclosure component
- WHEN collapsed THEN only the section header (Phosphor `FolderOpen` icon + "Files" label + count badge) MUST be visible
- WHEN expanded THEN the file list and "Add file" button MUST appear with a smooth height animation
- The section MUST be collapsed by default
- File deletion MUST use `InlineConfirm` (REQ-3.7) — no `window.confirm()`

**Acceptance criteria:**
- WHEN the Files section has 0 files AND is collapsed THEN the count badge MUST show "0"
- WHEN the user expands the section THEN the open/close state MUST be preserved during the current session (not persisted across app restarts)

#### REQ-5.7 — Profile Completion Indicator
- WHEN a profile has at least one field with an empty value THEN a completion indicator MUST appear in the sidebar below the profile name showing the percentage of fields that have been filled (e.g. "7/16 filled")
- WHEN ALL fields in a profile have non-empty values THEN the indicator MUST be hidden
- WHEN the indicator is shown THEN it MUST include a compact horizontal progress bar using `--fv-accent-subtle` track and `--fv-accent` fill

**Acceptance criteria:**
- Completion percentage MUST equal `(count of fields where value ≠ '') / (total field count) * 100`, rounded to nearest integer
- WHEN fields are added or their values are updated THEN the indicator MUST update without requiring a page reload

#### REQ-5.8 — Onboarding State
- WHEN a profile has fields but ALL of them have empty values (freshly seeded default fields) THEN the main content area MUST show a special onboarding empty state
- The onboarding state MUST include:
  - A Phosphor `Vault` or `Lock` icon (icon-lg, accent color)
  - Headline: "Your vault is ready — fill it in"
  - Subtext: "Add your details to the fields below. Once filled, press your hotkey anywhere to paste them instantly."
  - A CTA button: "Start filling in fields" that scrolls to and highlights the first empty field
- WHEN at least one field has a non-empty value THEN the onboarding state MUST NOT be shown

---

### REQ-6: Settings Window Redesign

#### REQ-6.1 — Visual Polish
- Settings window MUST use `--fv-canvas` background, `--fv-ink` text, matching the new design language
- SettingsGroup sections MUST use `elevation-1` cards with `radius-card`
- SettingsRow items MUST have `py-3.5 px-4` padding (slightly more breathing room)
- Section headings MUST use `caption` uppercase tracking style with `--fv-ink-muted`

#### REQ-6.2 — Toast Replacement
- The `{dataStatus}` inline text state MUST be removed
- Export and import outcomes MUST trigger `useToast` toasts (success/info/error variants per REQ-3.5)

#### REQ-6.3 — About Section
- A new "About" SettingsGroup MUST be added at the bottom containing:
  - App version (already available via `ipc.getAppVersion()`)
  - A "Capabilities" row showing whether auto-paste and text expansion are available (replaces the current warning banner)
  - The warning banner (`!capabilities.autoPaste || !capabilities.textExpansion`) MUST be replaced by the capabilities row

#### REQ-6.4 — Hotkey Recording UX
- WHEN `recording` is true THEN the hotkey display area MUST pulse with an accent color ring to indicate active recording state
- WHEN `recording` is false THEN the current hotkey MUST display as individual `Kbd` components

---

### REQ-7: Accessibility

- ALL interactive elements MUST have a visible `:focus-visible` outline using `--fv-accent` at 2px offset
- ALL icon-only buttons MUST have an `aria-label`
- ALL form inputs MUST be associated with a visible label or `aria-label`
- The popup field list MUST support full keyboard navigation (↑/↓ to move, Enter to select, Tab to change category, Escape to clear/close)
- The drag-to-reorder feature in Vault Manager MUST have a keyboard fallback: "Move up" / "Move down" accessible via a context menu or keyboard shortcut on the drag handle
- Color MUST NOT be the only differentiator for state — icons, labels, or shapes MUST accompany color signals

---

### REQ-8: Performance

- WHEN the popup opens THEN time-to-interactive (search input focused and fields visible) MUST be under 200ms from hotkey press
- The field list in the popup MUST use windowing or a hard cap of 100 visible items to prevent scroll jank
- Drag-to-reorder MUST use native HTML5 drag events or pointer events — no heavy third-party drag library
- Toast animations MUST use CSS transitions, not JavaScript animation loops

---

## Correctness Properties for Property-Based Testing

### P1 — Empty field filtering (Popup)
For any set of fields F where some have `value === ''` and some have `value !== ''`:
- `popupItems(F).every(item => item.field.value !== '')` MUST always be true
- If `F.filter(f => f.value !== '').length === 0`, then `popupItems(F).length === 0`

### P2 — Category tab visibility (Popup)
For any set of fields F and category C:
- Category tab C MUST be visible IFF `F.some(f => f.category === C && f.value !== '')`

### P3 — Profile completion percentage
For any profile with fields array F:
- `completionPct(F) === Math.round(F.filter(f => f.value !== '').length / F.length * 100)`
- `completionPct([]) === 0` (or indicator hidden when no fields)
- `completionPct(F)` is always in range `[0, 100]`

### P4 — Drag-to-reorder sort invariant
After any drag-drop reorder operation within a category:
- The set of field IDs in that category MUST be identical before and after (no additions, no removals)
- The `sortOrder` values MUST form a strictly increasing sequence matching the new visual order
- Fields in other categories MUST be unaffected

### P5 — InlineConfirm safety
- A destructive action callback `onConfirm` MUST be called exactly 0 times if "Cancel" is clicked or Escape is pressed
- A destructive action callback `onConfirm` MUST be called exactly 1 time if "Yes, delete" is clicked
- For any sequence of clicks, `onConfirm` call count MUST equal the number of times "Yes, delete" was clicked

### P6 — Copy feedback timing
- WHEN a field is selected at time T THEN the popup MUST remain open until at least T + 600ms
- WHEN Escape is pressed at time T+Δ (Δ < 600ms) THEN the popup MUST close at T+Δ, not T+600ms
- The "Copied!" / "Pasted!" visual state MUST be active for the full remaining open duration

### P7 — Toast deduplication and stack
- For any N toast events fired in rapid succession, at most 3 toasts MUST be visible simultaneously
- Each toast MUST auto-dismiss after exactly 4000ms ± 100ms (allowing for animation frame variance)


---

## Glossary

| Term | Definition |
|---|---|
| Popup | The frameless, transparent floating window triggered by the global hotkey. The highest-usage surface (~90% of interactions). |
| Vault Manager | The administrative window for managing profiles, fields, and files. |
| Settings | The rarely-visited window for hotkey, startup, and data export/import configuration. |
| Field | A named key-value pair stored in a profile (e.g. "PAN Number" → "ABCDE1234F"). |
| Profile | A named collection of fields (e.g. "Personal", "Business"). |
| Category | A logical grouping of fields within a profile (personal, financial, business, documents, custom). |
| Accent | The single interaction color (cyan) used exclusively on CTAs, active states, and focus rings — never decoratively. |
| InlineConfirm | A two-step inline confirmation pattern that replaces `window.confirm()` for destructive actions. |
| Toast | A transient notification that appears at bottom-right and auto-dismisses after 4 seconds. |
| Completion Indicator | A progress bar + count shown in the sidebar when a profile has unfilled fields. |
| Glassmorphism | The semi-transparent, backdrop-blurred visual treatment used on the popup window. |
| WCAG AA | Web Content Accessibility Guidelines level AA — minimum 4.5:1 contrast ratio for body text. |
