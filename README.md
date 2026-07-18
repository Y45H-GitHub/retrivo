# FormVault

> Your personal data, one shortcut away.

A lightweight desktop productivity app that lives in the system tray. Press a global hotkey → a floating popup appears → pick your data → it's pasted instantly. Works anywhere on your PC: browsers, PDF readers, Excel, government portals.

## Tech Stack

- **Desktop:** Electron + electron-vite
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + a small custom CVA-based component library (no shadcn/ui)
- **Database:** SQLite (better-sqlite3) — local only, never synced
- **Encryption:** Electron `safeStorage` (OS-backed — DPAPI on Windows), per-machine key
- **Packaging:** electron-builder

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
(`electron/autoUpdate.ts`, via `electron-updater`) — but only in packaged
builds, and only once `electron-builder.yml`'s `publish.owner`/`publish.repo`
point at a real GitHub repository (they're placeholders today). To ship a
release:

1. Fill in `publish.owner`/`publish.repo` in `electron-builder.yml`.
2. Set a `GH_TOKEN` env var (a GitHub personal access token with `repo`
   scope) so electron-builder can upload to Releases.
3. Bump `version` in `package.json`.
4. Run `npx electron-builder --publish always` (instead of plain
   `npm run build`) — this uploads the installer and the `latest.yml` feed
   file that `electron-updater` reads to detect new versions.

Until this is configured, the app runs fine — `checkForUpdatesAndNotify()`
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
