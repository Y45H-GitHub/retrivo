import { Tray, Menu, app, nativeImage } from 'electron';
import path from 'path';
import { togglePopupWindow } from './popup-window';
import { openVaultWindow } from './vault-window';
import { openSettingsWindow } from './settings-window';
import { isPinConfigured, lock } from './lockState';

let tray: Tray | null = null;

function resolveTrayIconPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'tray-icon.png')
    : path.join(__dirname, '../../assets/tray-icon.png');
}

function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    { label: 'Open Popup', click: () => togglePopupWindow() },
    { type: 'separator' },
    { label: 'Open Vault', click: () => openVaultWindow() },
    { label: 'Settings', click: () => openSettingsWindow() },
    ...(isPinConfigured()
      ? [{ type: 'separator' as const }, { label: 'Lock Retrivo', click: () => lock() }]
      : []),
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
}

export function createTray(): Tray {
  const icon = nativeImage.createFromPath(resolveTrayIconPath());
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Retrivo - Your data, one shortcut away');

  tray.setContextMenu(buildContextMenu());
  tray.on('click', () => togglePopupWindow());

  return tray;
}

/** Call after PIN configuration changes so the "Lock Retrivo" item appears/disappears immediately. */
export function refreshTrayMenu(): void {
  if (tray) tray.setContextMenu(buildContextMenu());
}

export function getTray(): Tray | null {
  return tray;
}
