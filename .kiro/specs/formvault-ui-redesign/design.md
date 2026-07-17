# Design Document — FormVault UI/UX Redesign

## Overview

This document describes the technical design for the FormVault UI/UX redesign. All changes are **frontend-only**: no Electron IPC handlers, no SQLite schema, no build system. The three Vite entry points (popup, vault, settings) remain unchanged in structure; only their rendered output and the shared component library evolve.

The redesign delivers:
1. A new design token system (deep-slate + cyan accent, replacing indigo).
2. Full migration from `@heroicons/react` to `@phosphor-icons/react`.
3. Six new shared components: `Toast`/`ToastProvider`/`useToast`, `InlineConfirm`, `Collapsible`, `ProfileCompletionIndicator`, `IconPicker`, `DragHandle`.
4. Popup glassmorphism, sliding category tab indicator, double-Escape, copy feedback state machine.
5. Vault Manager drag-to-reorder, inline confirmations, profile completion sidebar, icon picker.
6. Settings toast integration and About section.

**Key constraint**: all animations ≤ 150ms, WCAG AA contrast on all text pairs.

---

## Architecture

### Directory Structure Changes


```
src/
  shared/
    globals.css                     ← UPDATE: new token values + motion tokens
    constants.ts                    ← UPDATE: FIELD_ICONS map added
    ui/
      Button.tsx                    ← UPDATE: add destructive-confirm variant
      Dialog.tsx                    ← UPDATE: Phosphor X icon, focus trap
      EmptyState.tsx                ← UPDATE: accent-subtle bg, accent icon
      Input.tsx                     ← no change (token refresh is CSS-only)
      Kbd.tsx                       ← no change
      Switch.tsx                    ← UPDATE: accent token, spring transition
      Toast.tsx                     ← NEW
      ToastProvider.tsx             ← NEW
      useToast.ts                   ← NEW
      InlineConfirm.tsx             ← NEW
      Collapsible.tsx               ← NEW
      ProfileCompletionIndicator.tsx← NEW
      IconPicker.tsx                ← NEW
      DragHandle.tsx                ← NEW
  popup/
    Popup.tsx                       ← UPDATE: double-Escape, copy FSM, clear btn
    SearchBar.tsx                   ← UPDATE: Phosphor icon, clear button
    CategoryTabs.tsx                ← UPDATE: sliding indicator
    FieldList.tsx                   ← UPDATE: empty filtering (moved upstream)
    FieldItem.tsx                   ← UPDATE: Phosphor icon, copy FSM hook-up
    ProfileSwitcher.tsx             ← UPDATE: Phosphor icon, hide when 1 profile
  vault/
    VaultManager.tsx                ← UPDATE: drag rows, InlineConfirm, Toast
    ProfileManager.tsx              ← UPDATE: initials avatar, completion indicator
    FieldForm.tsx                   ← UPDATE: IconPicker replacing emoji input
    FileVault.tsx                   ← UPDATE: Collapsible, InlineConfirm
  settings/
    Settings.tsx                    ← UPDATE: Toast, About section, hotkey pulse
```

### Entry Point Sharing Strategy

All three entry points import `src/shared/globals.css` which defines every CSS custom property. The Tailwind config reads those variables via the `withOpacity` helper, so token changes in `globals.css` propagate automatically to every utility class across all windows.

The new shared components (`Toast`, `InlineConfirm`, etc.) live in `src/shared/ui/` and are imported by whichever window needs them. No new build entries are needed.

### Toast State Location

Each window hosts its own `ToastProvider` wrapping its root component. Since the three windows are separate renderer processes in Electron, there is no shared React tree across them. Each provider maintains its own toast queue.

```tsx
// e.g. src/vault/main.tsx
root.render(
  <ToastProvider>
    <VaultManager />
  </ToastProvider>
);
```

---

## Design Token Implementation

### globals.css — Full Updated Token Table

The existing `globals.css` RGB-triple system is preserved; only the values change.
New tokens `--fv-popup-bg` and `--fv-accent-subtle` are added.
Motion tokens are also added here (not in Tailwind config) for direct CSS use.

**Revision note:** the values below were revised from the initial navy-slate palette after user feedback that it read as "blueish" and overly contrasty. The graphite family keeps R≈G≈B at every step (vs. the original where blue channel ran ~3x the red/green channels) to read as neutral dark rather than tinted. See REQ-1.1 for the full rationale and computed WCAG ratios.

```css
:root {
  /* Surface hierarchy */
  --fv-canvas:        247 248 250;          /* #F7F8FA */
  --fv-surface:       255 255 255;          /* #FFFFFF */
  --fv-card:          255 255 255;          /* #FFFFFF */
  --fv-popup-bg:      rgba(255,255,255,0.92);/* simulated glass — NOT an RGB triple */
  --fv-hover:         238 240 245;          /* #EEF0F5 */
  --fv-active:        226 229 238;          /* #E2E5EE */

  /* Text */
  --fv-ink:           17 24 39;             /* #111827 */
  --fv-ink-secondary: 75 85 99;             /* #4B5563 */
  --fv-ink-muted:     107 114 128;          /* #6B7280 — 4.6:1 on canvas (was #9CA3AF at 2.5:1, failed AA) */

  /* Borders */
  --fv-stroke:        229 232 239;          /* #E5E8EF */
  --fv-stroke-subtle: 238 240 245;          /* #EEF0F5 */

  /* Accent — cyan, darkened to cyan-700 so white-on-accent button text clears AA */
  --fv-accent:        14 116 144;           /* #0E7490 */
  --fv-accent-hover:  8 145 178;            /* #0891B2 */
  --fv-accent-ink:    255 255 255;
  --fv-accent-subtle: rgba(14,116,144,0.10); /* NOT an RGB triple */

  /* Semantic — darkened one step each from the obvious 600-shade so they clear AA as literal text */
  --fv-success:       4 120 87;             /* #047857 */
  --fv-warning:       180 83 9;             /* #B45309 */
  --fv-danger:        185 28 28;            /* #B91C1C */
  --fv-shadow:        15 23 42;             /* #0F1726 */

  /* Motion */
  --ease-spring:      cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out:         cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:    80ms;
  --duration-base:    120ms;
  --duration-slow:    150ms;
}

@media (prefers-color-scheme: dark) {
  :root {
    --fv-canvas:        24 24 27;             /* #18181B — neutral graphite, not navy */
    --fv-surface:       32 32 35;              /* #202023 */
    --fv-card:          39 39 42;              /* #27272A */
    --fv-popup-bg:      rgba(39,39,42,0.92);
    --fv-hover:         48 48 52;              /* #303034 */
    --fv-active:        58 58 63;              /* #3A3A3F */

    --fv-ink:           250 250 250;          /* #FAFAFA */
    --fv-ink-secondary: 161 161 170;          /* #A1A1AA */
    --fv-ink-muted:     142 142 147;          /* #8E8E93 — 4.6:1 on card (was #4E5F7A) */

    --fv-stroke:        rgba(255,255,255,0.10);
    --fv-stroke-subtle: rgba(255,255,255,0.06);

    --fv-accent:        6 182 212;            /* #06B6D4 — cyan-500, softened from cyan-400 */
    --fv-accent-hover:  34 211 238;           /* #22D3EE — the old base accent, now hover-only */
    --fv-accent-ink:    24 24 27;             /* matches canvas */
    --fv-accent-subtle: rgba(6,182,212,0.14);

    --fv-success:       52 211 153;           /* #34D399 */
    --fv-warning:       251 191 36;           /* #FBBF24 */
    --fv-danger:        248 113 113;          /* #F87171 */
    --fv-shadow:        0 0 0;
  }
}
```


### tailwind.config.js Updates

Two additions to the existing config:

1. `radius-pill: '9999px'` added to `borderRadius`.
2. New color tokens `accent.subtle` using `var(--fv-accent-subtle)` directly (not RGB triple, because it already includes alpha):

```js
colors: {
  // ...existing tokens...
  accent: {
    DEFAULT: withOpacity('--fv-accent'),
    hover:   withOpacity('--fv-accent-hover'),
    ink:     withOpacity('--fv-accent-ink'),
    subtle:  'var(--fv-accent-subtle)',   // pre-built rgba — no opacity modifier needed
  },
  // popup-bg is used inline via style attribute, not a Tailwind class
},
borderRadius: {
  control: '6px',
  card:    '10px',
  float:   '14px',
  pill:    '9999px',   // NEW
},
```

The motion CSS custom properties are consumed directly in CSS/inline styles rather than Tailwind utilities, avoiding the overhead of generating transition-duration utilities for arbitrary values.

---

## Icon System

### Dependency Change

```bash
npm uninstall @heroicons/react
npm install @phosphor-icons/react
```

All Heroicons imports are replaced project-wide. Migration guide:

| Heroicons | Phosphor equivalent | Weight |
|---|---|---|
| `MagnifyingGlassIcon` | `MagnifyingGlass` | regular |
| `PlusIcon` | `Plus` | regular |
| `TrashIcon` | `Trash` | regular |
| `PencilSquareIcon` | `PencilSimple` | regular |
| `EyeIcon` | `Eye` | regular |
| `EyeSlashIcon` | `EyeSlash` | regular |
| `DocumentDuplicateIcon` | `Copy` | regular |
| `CheckIcon` | `Check` | regular |
| `XMarkIcon` | `X` | regular |
| `Cog6ToothIcon` | `Gear` | regular |
| `ChevronDownIcon` | `CaretDown` | regular |
| `ArrowDownTrayIcon` | `DownloadSimple` | regular |
| `ArrowUpTrayIcon` | `UploadSimple` | regular |
| `DocumentIcon` | `File` | regular |
| `FolderOpenIcon` | `FolderOpen` | regular |
| `ArchiveBoxIcon` | `Archive` | regular |

Weight strategy:
- **regular**: navigation icons, interactive controls, inline decorations
- **bold**: active/selected states, primary CTA icons, checked states
- **light**: empty state illustrations, subtle decorative hints

Size constants (applied as Tailwind classes):
- `icon-sm` → `h-3.5 w-3.5` (14px)
- `icon-md` → `h-4 w-4` (16px)
- `icon-lg` → `h-5 w-5` (20px)

### FIELD_ICONS Map

Add to `src/shared/constants.ts`:

```ts
import {
  User, UserCircle, Baby, Cake, Phone, EnvelopeSimple, House, MapPin,
  IdentificationCard, Fingerprint, Password, Key, Lock,
  Bank, CreditCard, Wallet, CurrencyDollar, ArrowsLeftRight, QrCode,
  FileText, Certificate, Notebook, Briefcase, Buildings, Receipt,
  Globe, At, Link, Hash, Tag,
  Car, AirplaneTilt, FirstAid, Heartbeat,
  CalendarBlank, Clock, Star
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export const FIELD_ICONS: Record<string, Icon> = {
  // Personal
  'user':             User,
  'user-circle':      UserCircle,
  'baby':             Baby,
  'cake':             Cake,
  'phone':            Phone,
  'envelope':         EnvelopeSimple,
  'house':            House,
  'map-pin':          MapPin,
  // Identity / Documents
  'id-card':          IdentificationCard,
  'fingerprint':      Fingerprint,
  'password':         Password,
  'key':              Key,
  'lock':             Lock,
  // Financial
  'bank':             Bank,
  'credit-card':      CreditCard,
  'wallet':           Wallet,
  'currency':         CurrencyDollar,
  'transfer':         ArrowsLeftRight,
  'qr-code':          QrCode,
  // Documents / Business
  'file-text':        FileText,
  'certificate':      Certificate,
  'notebook':         Notebook,
  'briefcase':        Briefcase,
  'buildings':        Buildings,
  'receipt':          Receipt,
  // Online
  'globe':            Globe,
  'at-sign':          At,
  'link':             Link,
  'hash':             Hash,
  // Generic / Other
  'tag':              Tag,
  'car':              Car,
  'airplane':         AirplaneTilt,
  'first-aid':        FirstAid,
  'heartbeat':        Heartbeat,
  'calendar':         CalendarBlank,
  'clock':            Clock,
  'star':             Star,
};

export const DEFAULT_FIELD_ICON = 'tag';
```

Update `DEFAULT_FIELDS` in `constants.ts` — replace all emoji `icon` values with the string keys above (e.g. `icon: 'user'` instead of `icon: '👤'`).

### FieldIcon Renderer Helper

```tsx
// src/shared/ui/FieldIcon.tsx
import { FIELD_ICONS, DEFAULT_FIELD_ICON } from '../constants';

interface FieldIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  weight?: 'regular' | 'bold' | 'light';
  className?: string;
}

const SIZE_CLASS = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

export function FieldIcon({ icon, size = 'md', weight = 'regular', className }: FieldIconProps) {
  const IconComponent = FIELD_ICONS[icon] ?? FIELD_ICONS[DEFAULT_FIELD_ICON];
  return <IconComponent weight={weight} className={cn(SIZE_CLASS[size], className)} />;
}
```

---

## Components and Interfaces

### Button (updated)

**New variant: `destructive-confirm`**

```tsx
variant: {
  primary:              'bg-accent text-accent-ink hover:bg-accent-hover active:bg-accent-hover',
  secondary:            'border border-stroke bg-card text-ink shadow-elevation-1 hover:bg-hover active:bg-active',
  ghost:                'text-ink-secondary hover:bg-hover hover:text-ink active:bg-active',
  danger:               'text-danger hover:bg-danger/10 active:bg-danger/15',
  'destructive-confirm':'bg-danger text-white hover:bg-danger/90 active:bg-danger/80',
},
```

No other changes to Button. All other tokens update via CSS variables automatically.

### Toast + ToastProvider + useToast

**ToastItem model:**
```ts
interface ToastItem {
  id: string;
  variant: 'success' | 'error' | 'info';
  message: string;
  createdAt: number;
}
```

**ToastContext:**
```ts
interface ToastContext {
  toasts: ToastItem[];
  toast: (variant: ToastItem['variant'], message: string) => void;
  dismiss: (id: string) => void;
}
```

**ToastProvider state:**
- `toasts: ToastItem[]` — max 3, newest at end
- `toast()` pushes to array; if length > 3, oldest is removed first
- Auto-dismiss: `setTimeout(dismiss, 4000)` per toast on creation; `clearTimeout` on manual dismiss

**Toast component (single item):**

```tsx
// Props: item: ToastItem, onDismiss: () => void
// CSS classes:
<div
  className={cn(
    'flex items-center gap-3 rounded-card border shadow-elevation-2 px-3.5 py-2.5 text-body',
    'animate-toast-in',  // defined in Tailwind keyframes
    variantClasses[item.variant]
  )}
>
  <VariantIcon />
  <span className="flex-1 text-body">{item.message}</span>
  <button onClick={onDismiss} aria-label="Dismiss" className="...">
    <X weight="bold" className="h-3.5 w-3.5" />
  </button>
</div>
```

Variant classes:
- `success`: `bg-card border-success/20 text-ink`
- `error`: `bg-card border-danger/20 text-ink`
- `info`: `bg-card border-stroke text-ink`

Variant icons (bold, icon-md):
- success → `CheckCircle` (text-success)
- error → `XCircle` (text-danger)
- info → `Info` (text-ink-muted)

**ToastContainer** (fixed positioning, rendered via portal or at end of Provider):
```tsx
<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
  {toasts.map(item => <Toast key={item.id} item={item} onDismiss={() => dismiss(item.id)} />)}
</div>
```

**Keyframes to add to tailwind.config.js:**
```js
'toast-in': {
  '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
  '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
},
'toast-out': {
  '0%':   { opacity: '1', transform: 'translateY(0)' },
  '100%': { opacity: '0', transform: 'translateY(-6px)' }
},
```
Animation: `toast-in: 120ms var(--ease-spring)`.

**useToast hook:**
```ts
export function useToast() {
  return useContext(ToastContext);  // throws if used outside ToastProvider
}
```


### InlineConfirm

**Props:**
```ts
interface InlineConfirmProps {
  label?: string;              // e.g. "Delete" — shown in default state
  onConfirm: () => void;
  confirmLabel?: string;       // defaults to "Yes, delete"
  /** aria-label for the trigger button */
  triggerAriaLabel: string;
  className?: string;
}
```

**State:** `confirming: boolean`

**Render logic:**
```tsx
function InlineConfirm({ label, onConfirm, confirmLabel = 'Yes, delete', triggerAriaLabel, className }) {
  const [confirming, setConfirming] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);

  // Move focus to confirm button when entering confirm state
  useEffect(() => {
    if (confirming) confirmBtnRef.current?.focus();
  }, [confirming]);

  // Escape reverts to default state
  useEffect(() => {
    if (!confirming) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); setConfirming(false); triggerRef.current?.focus(); }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [confirming]);

  if (!confirming) {
    return (
      <Button ref={triggerRef} variant="danger" size="icon" aria-label={triggerAriaLabel}
              onClick={() => setConfirming(true)} className={className}>
        <Trash weight="regular" className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 animate-fade-in" role="group" aria-label="Confirm deletion">
      <span className="text-label text-ink-secondary whitespace-nowrap">Delete?</span>
      <Button ref={confirmBtnRef} variant="destructive-confirm" size="sm"
              onClick={() => { setConfirming(false); onConfirm(); }}>
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm"
              onClick={() => { setConfirming(false); triggerRef.current?.focus(); }}>
        Cancel
      </Button>
    </div>
  );
}
```

**CSS:** The fade-in uses the existing `animate-fade-in` class (120ms ease-out). No separate animation needed.

### Collapsible

**Props:**
```ts
interface CollapsibleProps {
  trigger: ReactNode;           // always-visible header content
  defaultOpen?: boolean;        // defaults to false
  children: ReactNode;
  className?: string;
}
```

**State:** `open: boolean`

**Height animation approach** — CSS `max-height` transition:

```tsx
function Collapsible({ trigger, defaultOpen = false, children, className }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
  });

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2 text-left"
      >
        {trigger}
        <CaretDown
          weight="bold"
          className={cn('ml-auto h-3.5 w-3.5 text-ink-muted transition-transform',
                        open && 'rotate-180')}
          style={{ transition: `transform var(--duration-base) var(--ease-spring)` }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? contentHeight : 0,
          overflow: 'hidden',
          transition: `max-height var(--duration-slow) var(--ease-spring)`,
        }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}
```

The `contentHeight` is measured via `scrollHeight` after each render to handle dynamic content. This avoids the "max-height: 9999px" antipattern that produces slow animations.

### ProfileCompletionIndicator

**Props:**
```ts
interface ProfileCompletionIndicatorProps {
  fields: Field[];  // all fields for the active profile
}
```

**Logic:**
```ts
const filled = fields.filter(f => f.value !== '').length;
const total  = fields.length;
const pct    = total === 0 ? 0 : Math.round(filled / total * 100);
```

**Render** (hidden when `pct === 100` or `total === 0`):
```tsx
if (pct === 100 || total === 0) return null;
return (
  <div className="px-3 py-1.5">
    <div className="flex items-center justify-between mb-1">
      <span className="text-caption text-ink-muted">{filled}/{total} filled</span>
      <span className="text-caption text-ink-muted">{pct}%</span>
    </div>
    <div className="h-1 w-full rounded-full bg-accent-subtle overflow-hidden">
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{
          width: `${pct}%`,
          transition: `width var(--duration-slow) var(--ease-spring)`
        }}
      />
    </div>
  </div>
);
```

### IconPicker

**Props:**
```ts
interface IconPickerProps {
  value: string;               // current icon key
  onChange: (key: string) => void;
  className?: string;
}
```

**State:** `open: boolean`

**Design:**
- The trigger is a rounded square (h-10 w-10) showing the current icon at icon-lg size.
- Clicking expands an inline grid (5 columns, `gap-1`) below the label row, inside the FieldForm layout (not a modal).
- Animation: the container transitions from `max-height: 0` to its natural height using the same Collapsible technique.
- Each icon button is `h-8 w-8 rounded-control` with hover `bg-hover` and active `bg-accent-subtle`.
- The selected icon gets `bg-accent-subtle ring-2 ring-accent ring-offset-1`.

```tsx
function IconPicker({ value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(FIELD_ICONS);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Choose icon"
        className="flex h-10 w-10 items-center justify-center rounded-card border border-stroke bg-surface hover:bg-hover transition-colors"
      >
        <FieldIcon icon={value} size="lg" />
      </button>
      {open && (
        <div className="mt-1 rounded-card border border-stroke bg-card p-2 shadow-elevation-2 animate-float-in">
          <div className="grid grid-cols-8 gap-1">
            {keys.map(key => (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(key); setOpen(false); }}
                aria-label={key}
                aria-pressed={key === value}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-control transition-colors hover:bg-hover',
                  key === value && 'bg-accent-subtle ring-1 ring-accent'
                )}
              >
                <FieldIcon icon={key} size="md" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### DragHandle + Drag-to-Reorder in Field List

**DragHandle component:**
```tsx
// src/shared/ui/DragHandle.tsx
interface DragHandleProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function DragHandle({ onMoveUp, onMoveDown }: DragHandleProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing"
         aria-label="Drag to reorder">
      <DotsSixVertical weight="regular" className="h-3.5 w-3.5 text-ink-muted" />
      {/* Keyboard fallback — visually hidden until focus */}
      <div className="sr-only focus-within:not-sr-only flex gap-1">
        <button type="button" onClick={onMoveUp} aria-label="Move up">↑</button>
        <button type="button" onClick={onMoveDown} aria-label="Move down">↓</button>
      </div>
    </div>
  );
}
```

---


## Popup Window Design

### Component Tree

```
Popup
├── div.h-screen.w-screen.p-2.5                   (outer padding + transparent chrome)
│   └── div.flex.flex-col.rounded-float            (glassmorphism card — see below)
│       ├── SearchBar                               (input + Phosphor MagnifyingGlass + clear btn)
│       │   └── ProfileSwitcher (trailing slot)    (chip + CaretDown + dropdown)
│       ├── CategoryTabs                            (sliding indicator)
│       ├── div.border-t.border-stroke-subtle       (hairline separator)
│       ├── div.flex-1.overflow-hidden              (field list region)
│       │   └── FieldList
│       │       ├── [group headers]                 (caption uppercase)
│       │       └── [FieldItem]                     (field rows)
│       └── FooterBar                               (kbd hints + Add/Settings buttons)
```

### Glassmorphism CSS — revised: simulated glass, no `backdrop-filter`

**This section originally specified `backdrop-filter: blur(20px)`, which does not work as intended and was the source of a reported bug** ("glassmorphism didn't apply, looks blueish"). Root cause, verified against Electron/Chromium behavior (not assumed): `backdrop-filter` on a transparent `BrowserWindow` can only blur content within the page's own DOM — there is nothing else painted behind the popup's root div, so it blurs nothing, and the semi-transparent tint shows through completely flat ([electron/electron#30412](https://github.com/electron/electron/issues/30412)). The only real fix, Windows' native Acrylic material (`backgroundMaterial: 'acrylic'`), requires Windows 11 22H2+ and has open Electron bugs on frameless/transparent windows ([#38466](https://github.com/electron/electron/issues/38466)) — ruled out because the product targets Windows 10+.

The popup card (`div.flex.flex-col`) instead uses an opaque-enough tint, a stronger semi-transparent border (now carrying more of the "glass" read since there's no blur to soften edges), and an inset top highlight to simulate a catch-light edge:

```tsx
<div
  className="flex h-full flex-col overflow-hidden rounded-float border"
  style={{
    background: 'var(--fv-popup-bg)',
    borderColor: 'var(--fv-popup-border)',
    boxShadow:
      '0 16px 48px rgb(var(--fv-shadow) / 0.28), 0 6px 16px rgb(var(--fv-shadow) / 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  }}
>
```

The border color alternates with OS theme via a CSS variable:

```css
/* In globals.css */
:root      { --fv-popup-border: rgba(0,0,0,0.12); }
@media (prefers-color-scheme: dark) {
  :root    { --fv-popup-border: rgba(255,255,255,0.14); }
}
```

**Future enhancement (not implemented):** if the product later drops Windows 10 support, `backgroundMaterial: 'acrylic'` could be applied in `electron/popup-window.ts` as a progressive enhancement — detect `os.release()` / build number, set `backgroundMaterial: 'acrylic'` with `transparent: false` on qualifying systems, and fall back to the simulated-glass CSS above everywhere else.

### Sliding Category Tab Indicator

The key insight: a single absolutely-positioned `<span>` element moves via `transform: translateX()`, which is GPU-composited and never triggers layout. Tab container is `position: relative`.

```tsx
// CategoryTabs.tsx
export function CategoryTabs({ activeCategory, availableCategories, onSelect }) {
  const tabs = useMemo(() => [
    { id: 'all', label: 'All' },
    ...CATEGORIES.filter(c => availableCategories.has(c.id))
  ], [availableCategories]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Measure tab positions after render
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeIndex = tabs.findIndex(t => t.id === activeCategory);
    const btn = container.querySelectorAll('button')[activeIndex] as HTMLElement | null;
    if (btn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left:  btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeCategory, tabs]);

  return (
    <div ref={containerRef} role="tablist" aria-label="Categories"
         className="relative flex gap-1 overflow-x-auto px-3 pb-2.5">
      {/* Sliding pill — rendered below text via z-index */}
      <span
        aria-hidden
        className="absolute bottom-2.5 h-[22px] rounded-pill bg-accent-subtle"
        style={{
          left:      indicatorStyle.left,
          width:     indicatorStyle.width,
          transition: `left var(--duration-base) var(--ease-spring),
                       width var(--duration-base) var(--ease-spring)`,
        }}
      />
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeCategory === tab.id}
          tabIndex={-1}
          onClick={() => onSelect(tab.id)}
          className={cn(
            'relative z-10 shrink-0 rounded-pill px-2.5 py-[3px] text-label font-medium transition-colors',
            activeCategory === tab.id ? 'text-accent' : 'text-ink-secondary hover:text-ink'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

The active tab text uses `text-accent`; the background pill slides underneath using absolute positioning. This avoids re-rendering the pill and produces a smooth physical feel.

### Empty-Field Filtering Logic

Filtering happens in `Popup.tsx`'s `useMemo` for `items`, **before** building the `ListedField[]` array:

```ts
const items = useMemo<ListedField[]>(() => {
  const q = query.trim().toLowerCase();
  const filtered = fields
    .filter(f => f.value !== '')           // ← MUST filter empty values first
    .filter(f => category === 'all' || f.category === category)
    .filter(f => {
      if (!q) return true;
      return (
        f.label.toLowerCase().includes(q) ||
        f.value.toLowerCase().includes(q) ||
        (f.shortcut ?? '').toLowerCase().includes(q)
      );
    });
  // ... group header logic unchanged
  return filtered.map(field => ({ field, groupLabel: ... }));
}, [fields, category, query]);
```

`availableCategories` also filters to non-empty fields:
```ts
const availableCategories = useMemo(
  () => new Set(fields.filter(f => f.value !== '').map(f => f.category)),
  [fields]
);
```

### Copy Feedback State Machine

The state machine lives in `Popup.tsx`. States: `'idle' | 'copied' | 'closing'`.

```ts
type CopyState = 'idle' | 'copied' | 'closing';

const [copyState, setCopyState] = useState<CopyState>('idle');
const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

async function handleSelectField(field: Field) {
  if (copyState !== 'idle') return;          // debounce
  await ipc.copyField(field.id, true);
  setCopyState('copied');
  closeTimerRef.current = setTimeout(() => {
    setCopyState('closing');
    // Let CSS fade-out play (~120ms), then actually close
    setTimeout(() => void ipc.closePopup(), 120);
  }, 600);
}

// Escape during copied/closing state cancels timer and closes immediately
function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Escape') {
    if (copyState !== 'idle') {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      void ipc.closePopup();
      return;
    }
    if (query) {
      setQuery('');          // first Escape clears query
      return;
    }
    void ipc.closePopup();   // second Escape closes popup
  }
  // ... other key handlers unchanged
}
```

The popup's outer div gets a `data-closing` attribute when `copyState === 'closing'`:
```tsx
<div
  data-closing={copyState === 'closing' || undefined}
  className="... data-[closing]:animate-fade-out"
>
```

Add `fade-out` keyframe to Tailwind config:
```js
'fade-out': { '0%': { opacity: '1' }, '100%': { opacity: '0' } }
```

### Double-Escape Behaviour

Handled entirely in `handleSearchKeyDown` (shown above). No changes to IPC or Electron layer needed.

### SearchBar — Clear Button

```tsx
<div className="flex items-center gap-2.5 px-4 pb-3 pt-3.5">
  <MagnifyingGlass weight="regular" className="h-4 w-4 shrink-0 text-ink-muted" />
  <input ... />
  {value && (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => onChange('')}
      aria-label="Clear search"
      className="rounded-control p-0.5 text-ink-muted hover:bg-hover hover:text-ink transition-colors"
    >
      <X weight="bold" className="h-3.5 w-3.5" />
    </button>
  )}
  {trailing}
</div>
```

---

## Vault Manager Design

### Component Tree

```
VaultManager
├── ProfileManager (aside)
│   ├── Wordmark (FormVault)
│   ├── nav
│   │   ├── [ProfileRow × N]
│   │   │   ├── InitialsAvatar
│   │   │   ├── ProfileName
│   │   │   ├── ProfileCompletionIndicator
│   │   │   └── InlineConfirm (delete)
│   │   └── "New profile" button
│   └── Settings button (footer)
├── main
│   ├── header (filter + Add Field)
│   ├── div.flex-1.overflow-y-auto
│   │   ├── [CategorySection × N]
│   │   │   ├── CategoryHeader
│   │   │   └── [FieldRow × N]
│   │   │       ├── DragHandle
│   │   │       ├── FieldIcon
│   │   │       ├── FieldDetails (label + value)
│   │   │       ├── Reveal/Copy/Edit buttons
│   │   │       └── InlineConfirm (delete)
│   │   └── Collapsible (FileVault)
│   └── FieldForm (Dialog, conditional)
```

### Drag-to-Reorder Implementation

**HTML5 Drag API** — no third-party library. The handler lives in a custom hook `useDragToReorder`.

```ts
// src/vault/useDragToReorder.ts
export function useDragToReorder(
  fields: Field[],
  category: string,
  onReorder: (orderedIds: string[]) => void
) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();                // allow drop
    setOverIndex(index);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const reordered = [...fields];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(overIndex, 0, moved);
    onReorder(reordered.map(f => f.id));
    setDragIndex(null);
    setOverIndex(null);
  }

  function onDragEnd() {
    // fired if dropped outside valid target (cancel)
    setDragIndex(null);
    setOverIndex(null);
  }

  return { dragIndex, overIndex, onDragStart, onDragOver, onDrop, onDragEnd };
}
```

**sortOrder update batching** — after a successful reorder, batch-update all affected fields in a single async sequence (not a bulk IPC call, since none exists):

```ts
async function persistReorder(categoryFields: Field[], orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    ipc.updateField({ id, sortOrder: index * 10 })  // gap of 10 leaves room for future insertions
  );
  await Promise.all(updates);
}
```

Optimistic update: update local state immediately, then persist. If persistence fails, reload from DB.

**Field row drag attributes:**
```tsx
<div
  draggable
  onDragStart={() => onDragStart(index)}
  onDragOver={e => onDragOver(e, index)}
  onDrop={onDrop}
  onDragEnd={onDragEnd}
  className={cn(
    'group flex items-center gap-3 px-3 py-2.5 transition-all',
    dragIndex === index && 'opacity-50 scale-[1.02] shadow-elevation-2',
    overIndex === index && dragIndex !== index && 'border-t-2 border-accent',
  )}
>
```

**Keyboard fallback** — each DragHandle renders visually-hidden "Move up" / "Move down" buttons that become visible on `focus-within`. Clicking them calls `moveField(index, 'up' | 'down')` which reorders state and calls `persistReorder`.

### ProfileManager — Initials Avatar

```tsx
function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-bold"
      style={{ backgroundColor: color, color: '#fff' }}
    >
      {initials}
    </span>
  );
}
```

The profile's `color` field is used directly as `backgroundColor`. If `color` is empty, fall back to `--fv-accent`.

### FieldForm — Icon Picker Integration

The existing emoji `Input` (w-14 with `text-center`) is replaced:

```tsx
// Before (in FieldForm.tsx):
<Input value={icon} onChange={...} maxLength={4} className="text-center" />

// After:
<IconPicker value={icon} onChange={setIcon} />
```

The `icon` state type changes from emoji string to icon key string (e.g. `'user'`). Default: `DEFAULT_FIELD_ICON = 'tag'`.

### FileVault — Collapsible Integration

```tsx
<Collapsible
  defaultOpen={false}
  trigger={
    <div className="flex items-center gap-2">
      <FolderOpen weight="regular" className="h-4 w-4 text-ink-muted" />
      <h3 className="text-caption font-semibold uppercase tracking-wide text-ink-muted">Files</h3>
      <span className="ml-1 rounded-full bg-hover px-1.5 py-0.5 text-caption text-ink-muted">
        {files.length}
      </span>
    </div>
  }
  className="mt-6"
>
  {/* existing FileVault content */}
</Collapsible>
```

File deletion uses InlineConfirm instead of `confirm()`:
```tsx
// Before:
<button onClick={() => void handleDelete(file.id)}>
  <TrashIcon />
</button>

// After:
<InlineConfirm
  triggerAriaLabel={`Remove ${file.label}`}
  onConfirm={() => void handleDelete(file.id)}
/>
```

---


## Settings Window Design

### Component Tree

```
Settings
├── ToastProvider (wraps root)
│   └── div.flex-col.bg-canvas
│       ├── h1 "Settings"
│       ├── SettingsGroup "Hotkey"
│       │   └── SettingsRow "Open popup"
│       │       └── hotkey display + Change button (pulse ring when recording)
│       ├── SettingsGroup "General"
│       │   └── SettingsRow "Launch at startup" + Switch
│       ├── SettingsGroup "Data"
│       │   ├── SettingsRow "Export vault" + Export button
│       │   └── SettingsRow "Import vault" + Import button
│       └── SettingsGroup "About"
│           ├── SettingsRow "Version"
│           └── SettingsRow "Capabilities"
└── ToastContainer (fixed bottom-right)
```

### Toast Integration

Replace `dataStatus` state and the `{dataStatus && <p>...}` paragraph entirely:

```ts
const { toast } = useToast();

async function handleExport() {
  const result = await ipc.exportVault();
  if (result.ok) toast('success', `Exported to ${result.path}`);
  else           toast('info',    'Export cancelled');
}

async function handleImport() {
  const result = await ipc.importVault();
  if (result.ok) toast('success', 'Vault imported successfully');
  else           toast('info',    'Import cancelled');
}
```

Remove `dataStatus` and `setDataStatus` from state.

### About Section

```tsx
<SettingsGroup title="About">
  <SettingsRow divider title="Version">
    <span className="text-body text-ink-secondary font-mono">
      {version ? `v${version}` : '—'}
    </span>
  </SettingsRow>
  <SettingsRow title="Auto-paste" description="Automatically pastes after copying">
    <div className="flex items-center gap-1.5">
      {capabilities.autoPaste
        ? <CheckCircle weight="bold" className="h-4 w-4 text-success" />
        : <XCircle    weight="bold" className="h-4 w-4 text-danger"  />}
      <span className="text-body text-ink-secondary">
        {capabilities.autoPaste ? 'Available' : 'Not available'}
      </span>
    </div>
  </SettingsRow>
  <SettingsRow title="Text expansion" description="Type a shortcut to paste the value">
    <div className="flex items-center gap-1.5">
      {capabilities.textExpansion
        ? <CheckCircle weight="bold" className="h-4 w-4 text-success" />
        : <XCircle    weight="bold" className="h-4 w-4 text-danger"  />}
      <span className="text-body text-ink-secondary">
        {capabilities.textExpansion ? 'Available' : 'Not available'}
      </span>
    </div>
  </SettingsRow>
</SettingsGroup>
```

Remove the `(!capabilities.autoPaste || !capabilities.textExpansion)` warning banner.

### Hotkey Recording Pulse Ring

When `recording` is true, wrap the hotkey display area with an accent ring animation:

```tsx
<div className={cn(
  'flex items-center gap-2.5 rounded-control transition-all',
  recording && 'ring-2 ring-accent ring-offset-2 ring-offset-card animate-pulse-ring'
)}>
  {/* ... hotkey Kbd components or "Recording..." text ... */}
</div>
```

Add keyframe to Tailwind config:
```js
'pulse-ring': {
  '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--fv-accent) / 0.4)' },
  '50%':      { boxShadow: '0 0 0 4px rgb(var(--fv-accent) / 0)' },
}
// animation: 'pulse-ring: 1200ms ease-in-out infinite'
```

---

## Accessibility Design

### Focus Management in InlineConfirm

Already handled in the `InlineConfirm` component design above:
- `useEffect` moves focus to confirm button when `confirming` becomes `true`.
- Cancel button and Escape both call `triggerRef.current?.focus()` to return focus to the original trigger.
- The confirmation row is wrapped in `role="group"` with an `aria-label`.

### Keyboard Fallback for Drag-to-Reorder

The `DragHandle` component exposes visually-hidden "Move up" / "Move down" buttons that appear only when keyboard-focused (via `focus-within:not-sr-only`). This satisfies WCAG 2.1 SC 2.1.1 without requiring ARIA drag-and-drop patterns.

Alternatively, implement `aria-grabbed` pattern on the draggable row:
```tsx
<div
  draggable
  aria-grabbed={dragIndex === index}
  aria-dropeffect="move"
  // ...
>
```

However, `aria-grabbed` is deprecated in ARIA 1.1. The preferred approach is the visible keyboard buttons.

### Dialog Focus Trap

The existing `Dialog.tsx` does not implement a focus trap. Add one:

```tsx
useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) return;
  const focusable = dialog.querySelectorAll<HTMLElement>(
    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  first?.focus();

  function trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }
  dialog.addEventListener('keydown', trapFocus);
  return () => dialog.removeEventListener('keydown', trapFocus);
}, []);
```

---

## Performance Design

### Memoization Strategy

**Popup:**
- `availableCategories` — already memoized with `useMemo([fields])`. Updated to filter empty values.
- `items` — already memoized with `useMemo([fields, category, query])`. No new derived state needed.
- `FieldItem` — wrap with `React.memo`. Props are `field` (stable object reference from state), `active` (bool), callbacks (stable with `useCallback`). This prevents re-rendering non-active rows on every keydown.

```tsx
export const FieldItem = memo(function FieldItem({ field, active, onSelect, onHover }: FieldItemProps) {
  // ...
});
```

- `onSelect` and `onHover` in `FieldList` should be wrapped in `useCallback` in `Popup.tsx` to keep memo effective.

**Preventing re-renders on keydown:**
The existing design already batches selection index changes in `setSelectedIndex`. The `items` memo only recomputes when `fields`, `category`, or `query` changes — not on index changes. So typing changes only trigger `items` recomputation (unavoidable), while arrow-key navigation only changes `selectedIndex` and re-renders `FieldItem` rows via `active` prop change, which React.memo handles cheaply.

**Vault Manager:**
- `filteredFields` and `fieldsByCategory` are already memoized.
- Drag state (`dragIndex`, `overIndex`) should live in the `useDragToReorder` hook rather than VaultManager state to limit re-render scope to field rows only.

### Toast Animation (CSS-Only)

Toasts animate via CSS keyframes defined in Tailwind config. No `requestAnimationFrame` loops, no `setInterval`. The `animate-toast-in` class triggers on mount; the exit animation uses a CSS class added before removal from the DOM:

```tsx
function Toast({ item, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  function handleDismiss() {
    setExiting(true);
    // Wait for animation to finish before removing from DOM
    setTimeout(onDismiss, 120);
  }

  return (
    <div className={cn('...', exiting ? 'animate-toast-out' : 'animate-toast-in')}>
      ...
    </div>
  );
}
```

---

## Data Models

No changes to `src/shared/types.ts`.

The only data change is that `Field.icon` now stores a string key from `FIELD_ICONS` (e.g. `'user'`) rather than an emoji character. Existing emoji values are rendered via a fallback: if `FIELD_ICONS[field.icon]` is undefined, use the default `Tag` icon.

```ts
// FieldIcon.tsx fallback
const IconComponent = FIELD_ICONS[icon] ?? FIELD_ICONS[DEFAULT_FIELD_ICON];
```

No migration script is needed — old emoji icons render as the default icon gracefully.

---

## Error Handling

All IPC calls in `VaultManager.tsx` and `Settings.tsx` that currently use `window.confirm` are replaced with `InlineConfirm`. All status messages that use inline text are replaced with toasts.

Error pattern for IPC failures:
```ts
try {
  await ipc.updateField(update);
  // optimistic state already applied
} catch (err) {
  toast('error', 'Failed to save changes. Please try again.');
  await loadProfileData(activeProfileId);  // revert optimistic update
}
```

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Empty field filtering

*For any* array of fields where some have `value === ''` and some have `value !== ''`, the result of `popupItems(fields)` MUST contain only fields where `value !== ''`. Additionally, if all fields have empty values, the result MUST be an empty array.

**Validates: Requirements REQ-4.4, P1**

### Property 2: Category tab visibility

*For any* array of fields, the set of visible category tabs MUST be exactly the set of categories that contain at least one field with a non-empty value. A category with only empty-valued fields MUST NOT appear as a tab.

**Validates: Requirements REQ-4.3, P2**

### Property 3: Profile completion percentage invariant

*For any* non-empty array of fields, `completionPct(fields)` MUST equal `Math.round(nonEmpty / total * 100)`, MUST be in the range `[0, 100]` inclusive, and MUST equal `0` when all fields are empty. When the fields array is empty, the indicator MUST be hidden (not divide by zero).

**Validates: Requirements REQ-5.7, P3**

### Property 4: Drag-to-reorder preserves field set and order

*For any* category with N fields and any permutation applied to those fields: (a) the set of field IDs after reorder is identical to the set before, (b) the resulting `sortOrder` values form a strictly increasing sequence matching the new visual order, and (c) fields in other categories are unaffected by the operation.

**Validates: Requirements REQ-5.3, P4**

### Property 5: InlineConfirm call-count invariant

*For any* sequence of interactions on an `InlineConfirm` instance (any mix of trigger clicks, confirm clicks, cancel clicks, and Escape key presses), the number of times `onConfirm` is called MUST equal exactly the number of "Yes, delete" confirmations in that sequence. Cancellations and Escape presses MUST contribute zero calls.

**Validates: Requirements REQ-3.7, P5**

### Property 6: Copy feedback timing window

*For any* field selection event at time T: the popup MUST remain open for at least 600ms (i.e., until T + 600ms). If Escape is pressed at T+Δ where Δ < 600, the popup MUST close at T+Δ, not at T+600. The "Copied!" visual state MUST be active for the entire remaining open duration.

**Validates: Requirements REQ-4.5, P6**

### Property 7: Toast stack limit

*For any* sequence of N toast events (N ≥ 1): at most 3 toasts MUST be visible simultaneously at any point in time. Each toast that is not manually dismissed MUST auto-dismiss after 4000ms ± 100ms of its creation time.

**Validates: Requirements REQ-3.5, P7**

---

## Testing Strategy

### Library

**`vitest` + `fast-check`** — vitest is the natural test runner for Vite-based projects and already aligns with the project's dev tooling. fast-check is a mature property-based testing library for TypeScript with first-class support for `vitest`.

Install:
```bash
npm install -D vitest @testing-library/react @testing-library/user-event fast-check jsdom
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest --run",
  "test:watch": "vitest"
}
```

Add `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', globals: true }
});
```

### Unit Tests

- Specific example-based tests for `FieldForm` submission, `Settings` hotkey recording, `Dialog` Escape handling.
- Edge cases: `completionPct([])`, `popupItems([])`, single-field profiles.
- Integration: category tab appears/disappears as fields are added/emptied.

### Property-Based Tests

Minimum 100 iterations per property (fast-check default is 100).
Each test is tagged with a comment referencing its design property.

**Property 1 — Empty field filtering:**
```ts
// Feature: formvault-ui-redesign, Property 1: Empty field filtering
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { computePopupItems } from '../src/popup/Popup';  // extract pure function

const fieldArb = fc.record({
  id:       fc.uuid(),
  category: fc.constantFrom('personal', 'financial', 'business', 'documents', 'custom'),
  label:    fc.string({ minLength: 1 }),
  value:    fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
  icon:     fc.constant('tag'),
  shortcut: fc.option(fc.string()),
  fieldType:fc.constant('text'),
  sortOrder:fc.integer({ min: 0 }),
  // ... other required fields
});

describe('P1: popup items never contain empty fields', () => {
  it('for any field list, result contains only non-empty fields', () => {
    fc.assert(fc.property(
      fc.array(fieldArb, { minLength: 0, maxLength: 50 }),
      fc.constantFrom('all', 'personal', 'financial', 'business', 'documents', 'custom'),
      fc.string(),
      (fields, category, query) => {
        const items = computePopupItems(fields, category, query);
        return items.every(item => item.field.value !== '');
      }
    ), { numRuns: 100 });
  });

  it('if all fields are empty, result is empty', () => {
    fc.assert(fc.property(
      fc.array(fieldArb.map(f => ({ ...f, value: '' })), { minLength: 1, maxLength: 30 }),
      (fields) => computePopupItems(fields, 'all', '').length === 0
    ), { numRuns: 100 });
  });
});
```

**Property 2 — Category tab visibility:**
```ts
// Feature: formvault-ui-redesign, Property 2: Category tab visibility
describe('P2: visible categories match categories with non-empty fields', () => {
  it('for any field list, visible tabs === categories with value !== ""', () => {
    fc.assert(fc.property(fc.array(fieldArb, { minLength: 0, maxLength: 50 }), (fields) => {
      const expected = new Set(fields.filter(f => f.value !== '').map(f => f.category));
      const actual   = computeAvailableCategories(fields);
      return setsEqual(expected, actual);
    }), { numRuns: 100 });
  });
});
```

**Property 3 — Completion percentage:**
```ts
// Feature: formvault-ui-redesign, Property 3: Completion percentage invariant
describe('P3: completion percentage formula and range', () => {
  it('matches formula and stays in [0, 100]', () => {
    fc.assert(fc.property(fc.array(fieldArb, { minLength: 1, maxLength: 100 }), (fields) => {
      const pct = computeCompletionPct(fields);
      const expected = Math.round(fields.filter(f => f.value !== '').length / fields.length * 100);
      return pct === expected && pct >= 0 && pct <= 100;
    }), { numRuns: 100 });
  });

  it('empty array returns 0', () => expect(computeCompletionPct([])).toBe(0));
});
```

**Property 4 — Drag-to-reorder:**
```ts
// Feature: formvault-ui-redesign, Property 4: Drag-to-reorder set invariant
describe('P4: reorder preserves field set and produces increasing sortOrder', () => {
  it('for any permutation, field set is unchanged and sortOrder is increasing', () => {
    fc.assert(fc.property(
      fc.array(fieldArb, { minLength: 2, maxLength: 20 }),
      (fields) => {
        const ids = fields.map(f => f.id);
        const permuted = shuffle([...ids]);                    // fast-check shuffle
        const result   = applyReorder(fields, permuted);
        const resultIds= result.map(f => f.id);
        const isStrictlyIncreasing = result.every((f, i) =>
          i === 0 || f.sortOrder > result[i - 1].sortOrder
        );
        return setsEqual(new Set(ids), new Set(resultIds)) && isStrictlyIncreasing;
      }
    ), { numRuns: 100 });
  });
});
```

**Property 5 — InlineConfirm call count:**
```ts
// Feature: formvault-ui-redesign, Property 5: InlineConfirm call-count invariant
describe('P5: onConfirm called exactly N times for N confirmations', () => {
  it('for any interaction sequence, callCount === confirm count', () => {
    const interactionArb = fc.array(
      fc.constantFrom('open', 'confirm', 'cancel', 'escape'),
      { minLength: 1, maxLength: 20 }
    );
    fc.assert(fc.property(interactionArb, (interactions) => {
      let callCount = 0;
      const state = simulateInlineConfirm(interactions, () => callCount++);
      const expectedCalls = interactions.reduce((acc, action, i) => {
        // confirm only counted if previous action brought us to confirming state
        // (simulated by state machine)
        return acc;  // computed by simulateInlineConfirm internally
      }, 0);
      return callCount === state.expectedCallCount;
    }), { numRuns: 200 });
  });
});
```

**Property 6 — Copy feedback timing:**
```ts
// Feature: formvault-ui-redesign, Property 6: Copy feedback timing window
describe('P6: popup stays open >= 600ms after copy', () => {
  it('without Escape, popup closes at T+600ms', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 599 }), (delta) => {
      vi.useFakeTimers();
      const { closeAt } = simulateCopyFeedback({ escapeAt: null });
      vi.advanceTimersByTime(599);
      expect(closeAt).toBeNull();      // still open at 599ms
      vi.advanceTimersByTime(1);
      expect(closeAt).toBe(600);
      vi.useRealTimers();
      return true;
    }), { numRuns: 50 });
  });

  it('with Escape at delta < 600, closes at delta', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 599 }), (delta) => {
      vi.useFakeTimers();
      const { closeAt } = simulateCopyFeedback({ escapeAt: delta });
      vi.advanceTimersByTime(delta);
      expect(closeAt).toBe(delta);
      vi.useRealTimers();
      return true;
    }), { numRuns: 100 });
  });
});
```

**Property 7 — Toast stack limit:**
```ts
// Feature: formvault-ui-redesign, Property 7: Toast stack limit
describe('P7: at most 3 toasts visible, each dismissed after 4000ms', () => {
  it('for any N toast events, visible count never exceeds 3', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom('success', 'error', 'info'), { minLength: 1, maxLength: 20 }),
      (variants) => {
        const state = simulateToastQueue(variants);
        return state.maxVisibleAtOnce <= 3;
      }
    ), { numRuns: 200 });
  });

  it('each toast is dismissed after 4000ms ± 100ms', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom('success', 'error', 'info'), { minLength: 1, maxLength: 5 }),
      fc.array(fc.integer({ min: 0, max: 200 }), { minLength: 1, maxLength: 5 }),
      (variants, delays) => {
        vi.useFakeTimers();
        const dismissTimes = simulateToastDismissals(variants, delays);
        vi.useRealTimers();
        return dismissTimes.every(t => t >= 3900 && t <= 4100);
      }
    ), { numRuns: 100 });
  });
});
```

### Implementation Note on Pure Functions

To make property testing practical, extract pure functions from components into separate utility files:

- `src/popup/popupUtils.ts`: `computePopupItems(fields, category, query)`, `computeAvailableCategories(fields)`
- `src/shared/completionUtils.ts`: `computeCompletionPct(fields)`
- `src/vault/reorderUtils.ts`: `applyReorder(fields, orderedIds)`, `persistReorder(fields)`
- `src/shared/ui/inlineConfirmStateMachine.ts`: `simulateInlineConfirm(interactions, onConfirm)`
- `src/shared/ui/toastStateMachine.ts`: `ToastQueue` class with add/dismiss/getVisible methods

Components import and call these functions; tests import the functions directly without mounting React.

