import { app } from 'electron';
import { initDatabase } from './database';
import { createTray } from './tray';
import { registerGlobalHotkey, unregisterAllHotkeys } from './hotkey';
import { registerIpcHandlers } from './ipc-handlers';
import { startTextExpander, stopTextExpander } from './text-expander';
import { getSetting } from './database';
import { openVaultWindow } from './vault-window';
import { applyContentSecurityPolicy } from './csp';
import { initAutoUpdate } from './autoUpdate';
import { initLockState } from './lockState';
import { is } from './env';
import { DEFAULT_HOTKEY } from '../src/shared/constants';

// Single instance lock — a second launch just focuses/wakes the existing instance.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Tray-resident app: a second launch is a no-op beyond focusing nothing new.
  });

  app.whenReady().then(() => {
    applyContentSecurityPolicy();
    const isFirstRun = initDatabase();
    initLockState();
    registerIpcHandlers();
    createTray();

    const savedHotkey = getSetting('hotkey') ?? DEFAULT_HOTKEY;
    registerGlobalHotkey(savedHotkey);

    startTextExpander();

    // First launch only: open the Vault Manager so the template picker is actually visible,
    // since the app is otherwise tray-only and opens no window on its own.
    if (isFirstRun) openVaultWindow();

    // Packaged builds only — checking for updates against a dev build is pointless and noisy.
    if (!is.dev) initAutoUpdate();

    const launchAtStartup = getSetting('launchAtStartup');
    if (launchAtStartup === null) {
      // Default to launching at startup per spec; user can opt out in Settings.
      app.setLoginItemSettings({ openAtLogin: true });
    } else {
      app.setLoginItemSettings({ openAtLogin: launchAtStartup === 'true' });
    }
  });

  // Tray app: closing all windows must not quit the app — it should keep living in the tray.
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') return;
  });

  app.on('before-quit', () => {
    unregisterAllHotkeys();
    stopTextExpander();
  });
}
