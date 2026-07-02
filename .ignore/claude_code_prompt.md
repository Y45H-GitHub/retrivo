# Claude Code Prompt — Build FormVault Desktop App

---

## 🧠 Who You Are

You are a senior full-stack engineer with deep expertise in Electron desktop app development, React, TypeScript, and local-first software architecture. You write clean, well-commented, production-quality code. You make good technical decisions independently without asking unnecessary questions.

---

## 🎯 What We Are Building

**FormVault** — A lightweight desktop productivity app that lives in the system tray and lets users store personal/financial data (name, PAN, Aadhaar, bank details, address, etc.) in an encrypted local vault, then paste any piece of data anywhere on their computer via a global hotkey popup.

### Core User Flow:
1. App runs silently in the system tray
2. User presses `Ctrl+Shift+Space` from anywhere (browser, PDF reader, Excel, any app)
3. A small, beautiful floating popup appears near the cursor
4. User types to search or browses categories
5. User clicks a field → it is instantly copied to clipboard and pasted into the active input
6. Popup closes. Done. The entire interaction takes under 3 seconds.

### Secondary Feature — Text Expansion:
- User can assign shortcuts like `!pan`, `!bank`, `!addr`
- When user types `!pan` + Space anywhere, it auto-expands to their PAN number

---

## 🛠️ Tech Stack — Use Exactly This

| Layer | Technology |
|---|---|
| Desktop Framework | **Electron** (latest stable) |
| Build Tool | **Vite** with `electron-vite` |
| Frontend | **React 18 + TypeScript** |
| Styling | **Tailwind CSS v3 + shadcn/ui** |
| Local Database | **better-sqlite3** |
| Encryption | **crypto** (Node built-in, AES-256-GCM) |
| Global Hotkey | **Electron globalShortcut API** |
| Clipboard + Auto-paste | **Electron clipboard API + robotjs** |
| System Tray | **Electron Tray API** |
| Text Expansion | **uiohook-napi** (keyboard listener) |
| Unique IDs | **uuid** |
| Packaging | **electron-builder** |

**Do NOT use:** Tauri, PyQt, JavaFX, plain HTML/CSS without Tailwind, or any other framework not listed above.

---

## 📁 Project Structure

Create the project with this exact structure:

```
formvault/
├── electron/
│   ├── main.ts               # Entry point, app lifecycle
│   ├── tray.ts               # System tray icon + menu
│   ├── hotkey.ts             # Global hotkey registration
│   ├── popup-window.ts       # Popup BrowserWindow manager
│   ├── settings-window.ts    # Settings BrowserWindow manager
│   ├── vault-window.ts       # Vault manager BrowserWindow
│   ├── database.ts           # All SQLite operations
│   ├── encryption.ts         # AES-256-GCM encrypt/decrypt
│   ├── clipboard.ts          # Copy to clipboard + auto-paste
│   ├── text-expander.ts      # Keyboard hook for !shortcuts
│   └── ipc-handlers.ts       # All IPC channel registrations
├── src/
│   ├── popup/
│   │   ├── main.tsx
│   │   ├── Popup.tsx          # Root popup component
│   │   ├── SearchBar.tsx
│   │   ├── CategoryTabs.tsx
│   │   ├── FieldList.tsx
│   │   ├── FieldItem.tsx
│   │   └── ProfileSwitcher.tsx
│   ├── vault/
│   │   ├── main.tsx
│   │   ├── VaultManager.tsx
│   │   ├── FieldForm.tsx
│   │   ├── ProfileManager.tsx
│   │   └── FileVault.tsx
│   ├── settings/
│   │   ├── main.tsx
│   │   └── Settings.tsx
│   └── shared/
│       ├── types.ts           # All shared TypeScript types
│       ├── constants.ts       # Category names, default fields, etc.
│       └── ipc-client.ts     # Frontend IPC calls
├── assets/
│   ├── icon.png              # App icon (512x512)
│   └── tray-icon.png         # Tray icon (16x16 and 32x32)
├── package.json
├── electron-builder.yml
├── electron.vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

---

## 🗃️ Database Schema

Create these tables in SQLite on first launch:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '👤',
  color TEXT DEFAULT '#6366f1',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('personal', 'financial', 'documents', 'business', 'custom')),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK(field_type IN ('text', 'number', 'date', 'multiline', 'file_path')),
  shortcut TEXT,
  icon TEXT DEFAULT '📋',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS file_refs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_log (
  id TEXT PRIMARY KEY,
  field_id TEXT,
  action TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);
```

**Important:** All `value` fields in the `fields` table must be stored encrypted using AES-256-GCM before writing to DB. Decrypt when reading.

On first launch, seed the default profile with these pre-populated fields (empty values, user fills them in):

```
Personal:
  - Full Name (label: "Full Name", shortcut: "!name")
  - Date of Birth (label: "Date of Birth", shortcut: "!dob", field_type: "date")
  - PAN Number (label: "PAN Number", shortcut: "!pan")
  - Aadhaar Number (label: "Aadhaar Number", shortcut: "!aadhaar")
  - Mobile Number (label: "Mobile", shortcut: "!mobile")
  - Email Address (label: "Email", shortcut: "!email")
  - Father's Name (label: "Father's Name", shortcut: "!fname")
  - Full Address (label: "Address", shortcut: "!addr", field_type: "multiline")
  - Pincode (label: "Pincode", shortcut: "!pin")

Financial:
  - Bank Name (label: "Bank Name", shortcut: "!bankname")
  - Account Number (label: "Account Number", shortcut: "!accno")
  - IFSC Code (label: "IFSC Code", shortcut: "!ifsc")
  - UPI ID (label: "UPI ID", shortcut: "!upi")

Business:
  - GST Number (label: "GST Number", shortcut: "!gst")
  - Company Name (label: "Company Name", shortcut: "!company")
  - CIN Number (label: "CIN", shortcut: "!cin")
```

---

## 🖥️ Windows to Build

### Window 1: Popup (Most Important)

- **Size:** 420px wide, max 520px tall
- **Position:** Centered on screen (or near cursor if possible)
- **Style:** Frameless window, always-on-top, no taskbar entry
- **Behavior:** 
  - Opens instantly on hotkey (< 200ms)
  - Closes on: Escape key, click outside, or after item is selected
  - Smooth slide-up + fade-in animation on open (150ms)

**UI Layout:**
```
┌─────────────────────────────────────┐
│  [Profile: Personal ▼]   [⚙] [×]  │
├─────────────────────────────────────┤
│  🔍 Search your data...             │
├─────────────────────────────────────┤
│  Personal  Financial  Business  All │
├─────────────────────────────────────┤
│  📋 Full Name                       │
│     Yash Sharma              [Copy] │
│                                     │
│  📋 PAN Number                      │
│     ABCDE1234F               [Copy] │
│                                     │
│  📋 Mobile                          │
│     +91 98765XXXXX           [Copy] │
│                                     │
│  📋 Email                           │
│     yash@example.com         [Copy] │
│                                     │
│  [+] Add new field                  │
└─────────────────────────────────────┘
```

- The value should show partially masked (show first few chars + `XXXX`) for sensitive fields like PAN, Aadhaar, account number
- Click anywhere on a row (or the Copy button) → copies to clipboard + sends Ctrl+V to paste it
- Active search filters the list in real time (fuzzy match on label and value)
- Arrow Up/Down keys navigate the list; Enter selects
- Tab switches between category tabs

### Window 2: Vault Manager

- **Size:** 900px × 650px, normal window with title bar
- **Access:** Right-click tray → "Manage Vault" or gear icon in popup
- Full CRUD for profiles and fields
- Left sidebar: profile list
- Main area: fields grouped by category
- Button to add new field → opens a form dialog

### Window 3: Settings

- **Size:** 600px × 500px
- Hotkey customization (show current, allow rebinding)
- Launch at startup toggle
- Dark/light mode toggle
- Export vault (encrypted JSON) button
- Import vault button
- App version info

---

## 🔐 Encryption Implementation

Use this approach:

```typescript
// encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string, masterKey: string): string {
  const key = crypto.scryptSync(masterKey, 'formvault-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string, masterKey: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const key = crypto.scryptSync(masterKey, 'formvault-salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

For MVP, use a hardcoded dev key and add master password lock in V2.

---

## 🎨 Design System

**Color Palette (Dark Mode — default):**
```css
--bg-primary: #0f0f13
--bg-secondary: #1a1a24
--bg-card: #22223a
--bg-hover: #2d2d45
--accent: #6366f1        /* indigo */
--accent-hover: #4f46e5
--text-primary: #f0f0f5
--text-secondary: #9999bb
--text-muted: #666680
--border: #333355
--success: #22c55e
--category-personal: #6366f1
--category-financial: #10b981
--category-business: #f59e0b
--category-documents: #ef4444
--category-custom: #8b5cf6
```

**Typography:** Use Inter font (Google Fonts)

**Popup must feel premium:**
- Glassmorphism card style
- Subtle backdrop blur
- Smooth hover states (150ms transition)
- Micro-animation on copy: row flashes green + shows "✓ Copied" for 1.5 seconds
- No jarring jumps or layout shifts

---

## 📡 IPC Channels

All communication between Electron main process and renderer must go through IPC:

```typescript
// Main → Renderer
'vault:data-updated'       // notify popup to refresh
'hotkey:triggered'         // tell popup window to show

// Renderer → Main (invoke = two-way)
'vault:get-all-fields'     // returns all fields for active profile
'vault:get-profiles'       // returns all profiles
'vault:set-active-profile' // switch active profile
'vault:add-field'          // add new field
'vault:update-field'       // update existing field
'vault:delete-field'       // delete field
'vault:copy-field'         // copy field value to clipboard + auto-paste
'vault:get-files'          // get file references
'vault:add-file'           // add file reference
'settings:get'             // get all settings
'settings:set'             // update a setting
'app:open-vault-manager'   // open vault window
'app:open-settings'        // open settings window
'app:quit'                 // quit app
```

---

## ⌨️ Text Expansion Engine

When the keyboard hook detects a registered shortcut pattern (e.g., `!pan`) followed by Space or Tab:
1. Select and delete the typed shortcut (send Backspace × shortcut length + 1)
2. Copy the mapped value to clipboard
3. Send Ctrl+V to paste it

```typescript
// text-expander.ts
import { uIOhook } from 'uiohook-napi';

let typedBuffer = '';

export function startTextExpander(getShortcuts: () => Map<string, string>) {
  uIOhook.on('keydown', (e) => {
    // build buffer from typed characters
    // on Space/Tab, check if buffer ends with a registered shortcut
    // if yes: delete shortcut + paste value
  });
  uIOhook.start();
}
```

---

## 🚀 Build & Run Instructions

After scaffolding, the app must:
1. Run with `npm run dev` for development
2. Build installer with `npm run build`
3. On Windows, produce a `.exe` installer via electron-builder
4. Auto-start with system on Windows (add registry entry via Electron `app.setLoginItemSettings`)

---

## ✅ Phase 1 Success Criteria (Build This First)

Before moving to any advanced features, verify all of the following work:

- [ ] `npm run dev` launches the app with a system tray icon visible
- [ ] Right-clicking the tray shows: "Open Vault", "Settings", "Quit"
- [ ] Pressing `Ctrl+Shift+Space` anywhere opens the popup window
- [ ] Popup shows the pre-seeded fields (even if values are empty)
- [ ] User can click a field → value is copied to clipboard
- [ ] User can type in the search bar → list filters in real time
- [ ] Pressing Escape closes the popup
- [ ] Vault Manager window opens and shows all fields
- [ ] User can add a new field (label + value + category + shortcut)
- [ ] User can edit an existing field
- [ ] User can delete a field
- [ ] Data persists after closing and reopening the app (SQLite)
- [ ] Values are encrypted in the SQLite DB file (verify by opening DB with DB Browser)

---

## ❌ What NOT To Do

- Do NOT use `localStorage` or `sessionStorage` for sensitive data — use SQLite only
- Do NOT store unencrypted PAN, Aadhaar, or bank data anywhere
- Do NOT build a web-based version — this is a desktop-only app
- Do NOT add a login/auth system in Phase 1 — local app, no accounts yet
- Do NOT make the popup a full-screen window — it must be a compact floating overlay
- Do NOT skip TypeScript types — everything must be properly typed
- Do NOT use `any` type in TypeScript
- Do NOT ask me which package to use — use exactly what is listed in the tech stack section
- Do NOT add a backend server — this is a fully local, offline-first app for now

---

## 📦 Start Here — First Commands

```bash
# 1. Create project
npm create @quick-start/electron formvault -- --template react-ts

# 2. Install dependencies
cd formvault
npm install better-sqlite3 uuid uiohook-napi robotjs
npm install -D tailwindcss postcss autoprefixer @types/better-sqlite3 @types/uuid
npm install electron-builder --save-dev

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Start building
```

Begin with `electron/main.ts` → `electron/tray.ts` → `electron/hotkey.ts` → `electron/popup-window.ts` → `electron/database.ts` → then the React UI.

---

## 🔮 Name & Branding

- **App Name:** FormVault
- **Tagline:** "Your data, one shortcut away"
- **Icon style:** A small vault/safe icon with a lightning bolt — dark indigo background, white icon
- **Default theme:** Dark mode

---

Begin building Phase 1 now. Do not ask for clarification — make reasonable decisions where something is unspecified and move forward. Ship working code.
