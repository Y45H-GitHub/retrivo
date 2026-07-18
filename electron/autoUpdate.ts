import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours — the app runs persistently in the tray

let initialized = false;

/**
 * Requires electron-builder.yml's `publish` block to point at a real GitHub repo with releases
 * built by `electron-builder` (which generates the latest.yml/app-update.yml feed automatically).
 * No-ops safely if that isn't configured yet — electron-updater just reports "no update available."
 */
export function initAutoUpdate(): void {
  if (initialized) return;
  initialized = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => {
    console.error('[auto-update] error:', err);
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: `FormVault ${info.version} has been downloaded.`,
        detail: 'Restart now to install it, or it will install automatically the next time you quit.',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
  });

  void autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => void autoUpdater.checkForUpdatesAndNotify(), CHECK_INTERVAL_MS);
}
