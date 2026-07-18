# FormVault

> Your personal data, one shortcut away.

A lightweight desktop productivity app that lives in the system tray. Press a global hotkey → a floating popup appears → pick your data → it's pasted instantly. Works anywhere on your PC: browsers, PDF readers, Excel, government portals.

**Download:** [latest release](https://github.com/Y45H-GitHub/form-vault/releases/latest) (Windows 10+, `FormVault-Setup-<version>.exe`)

## Tech Stack

- **Desktop:** Electron + electron-vite
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + a small custom CVA-based component library (no shadcn/ui)
- **Database:** SQLite (better-sqlite3) — local only, never synced
- **Encryption:** Electron `safeStorage` (OS-backed — DPAPI on Windows), per-machine key
- **Packaging:** electron-builder, auto-update via electron-updater + GitHub Releases

## Project Structure

```
electron/              Main process (Node context) — one file per concern
  main.ts                 App entry: single-instance lock, tray, hotkey, first-run detection
  database.ts              SQLite schema + all queries (profiles, fields, files, settings)
  encryption.ts             Field values at rest — safeStorage, with legacy-format fallback
  exportCrypto.ts           Passphrase-based encryption for vault export/import files
  validateImport.ts         Shape-validates a decrypted import before it touches the database
  ipc-handlers.ts           Every ipcMain.handle(...) the renderer can call
  preload.ts                contextBridge surface exposed to the renderer as window.formvault
  tray.ts / hotkey.ts       Tray icon + context menu / global shortcut registration
  popup-window.ts           Popup window (frameless, transparent, always-on-top)
  vault-window.ts            Vault Manager window
  settings-window.ts          Settings window
  clipboard.ts              Copy + simulated-paste (robotjs, falls back to uiohook-napi)
  text-expander.ts          Global keyboard hook for "!shortcut" text expansion
  csp.ts                    Content-Security-Policy, packaged builds only
  autoUpdate.ts             electron-updater wiring — checks GitHub Releases

src/
  popup/                  Popup window UI (the hotkey → search → copy surface)
  vault/                  Vault Manager UI (profiles, fields, drag-to-reorder, templates)
  settings/               Settings window UI
  shared/                 Code used by more than one window
    types.ts                 Shared TS types (Field, Profile, etc.) — mirrors the SQLite schema
    constants.ts              IPC channel names, categories, hotkey default
    fieldTemplates.ts         Starter field sets shown in the Vault Manager's template picker
    ipc-client.ts             Thin re-export of window.formvault for renderer code
    globals.css               Design tokens (CSS custom properties) + Tailwind base
    ui/                       Shared component library (Button, Dialog, Toast, etc.)

.kiro/specs/formvault-ui-redesign/
  requirements.md         The UI/UX redesign spec — design tokens, component contracts, WCAG
                          ratios, and the reasoning behind decisions that aren't obvious from
                          the code (e.g. why the popup can't have a real background blur).
  design.md               Implementation-level companion to requirements.md.

assets/                 App icons (tray + installer)
electron-builder.yml    Packaging + publish (GitHub Releases) config
```

Tests live next to the code they cover (`*.test.ts`/`*.test.tsx`), not in a
separate `__tests__` tree — `npm run test` picks them all up via Vitest.

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

### Native modules (first-time setup on Windows)

Two features (auto-paste and `!shortcut` text expansion) depend on native
modules — `uiohook-napi` and `robotjs` — that need to compile from source if
no prebuilt binary matches your Electron/Node ABI. If you see a `node-gyp`
error mentioning "Could not find any Visual Studio installation", install the
**Desktop development with C++** workload from
[Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/),
then re-run `npm install`. Without it, the app still runs fully — those two
features just no-op (copy-to-clipboard always works) until the modules
compile.

### Building the installer (`npm run build`)

Producing the `.exe` installer requires electron-builder to extract a
bundled code-signing helper (`winCodeSign`) that contains symlinks. Creating
symlinks on Windows requires either **Developer Mode** (Settings → Privacy &
security → For developers → Developer Mode: On) or an elevated/admin
terminal. Enable one of those once, then `npm run build` will produce
`release/FormVault-Setup-<version>.exe`. `npm run dev` is unaffected by this
and works without either.

### Code signing

The Windows installer is unsigned by default, which triggers a SmartScreen
warning ("Windows protected your PC") for anyone downloading it. To sign:

1. Get an Authenticode code-signing certificate (OV is cheaper; EV gives
   instant SmartScreen reputation instead of building it up over time).
2. Set the `CSC_LINK` (path or URL to the `.pfx`) and `CSC_KEY_PASSWORD`
   env vars before running `npm run build` — electron-builder picks these
   up automatically, no config file changes needed.

Without these set, `npm run build` still produces a working, unsigned
installer.

### Releasing / auto-update

The app checks for updates on startup and every 4 hours
(`electron/autoUpdate.ts`, via `electron-updater`), in packaged builds only,
against [github.com/Y45H-GitHub/form-vault/releases](https://github.com/Y45H-GitHub/form-vault/releases).
To ship a release:

1. Bump `version` in `package.json`.
2. Set a `GH_TOKEN` env var — a GitHub personal access token (fine-grained,
   scoped to this repo, **Contents: Read and write** permission is enough).
3. Run `npm run build -- --publish always`. This uploads the installer and
   the `latest.yml` feed file `electron-updater` reads, and — since
   `electron-builder.yml` sets `releaseType: release` — publishes it live
   immediately rather than as a draft.

Until a release exists, the app runs fine — `checkForUpdatesAndNotify()`
just finds nothing and silently no-ops.

### A note on the Electron version

`electron` is currently pinned to `33.3.1` rather than the latest stable.
That version has known CVEs (see `npm audit`) — bumping it is intentionally
not done automatically here because `better-sqlite3` (a required, not
optional, dependency) has no prebuilt binary yet for newer Electron ABIs on
this machine, and compiling it from source needs Visual Studio Build Tools
(see above) which weren't available when this was last checked. Before
bumping: install VS Build Tools, then try `npm install -D electron@latest &&
npx electron-builder install-app-deps` and confirm the app still launches
and can read/write the database before shipping.

## Features

- 🔐 Encrypted local vault — your data never leaves your machine
- ⌨️ Global hotkey popup (Ctrl+Shift+Space) — works in any app
- 📋 One-click copy & paste for any saved field
- ⚡ Text expansion — type `!pan` anywhere to auto-paste your PAN
- 👤 Multiple profiles — personal, business, family
- 📁 File vault — quick access to frequently uploaded documents
