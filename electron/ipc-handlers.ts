import { BrowserWindow, dialog, ipcMain, app, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { IPC } from '../src/shared/constants';
import type { NewField, NewProfile, UpdateField, VaultExport } from '../src/shared/types';
import * as db from './database';
import { copyAndPaste, copyToClipboard, isAutoPasteAvailable } from './clipboard';
import { isTextExpanderAvailable } from './text-expander';
import { hidePopupWindow } from './popup-window';
import { openVaultWindow } from './vault-window';
import { openSettingsWindow } from './settings-window';
import { refreshTextExpanderShortcuts } from './text-expander';
import { registerGlobalHotkey } from './hotkey';
import { encryptPayload, decryptPayload, WrongPassphraseError } from './exportCrypto';
import { isValidVaultExport } from './validateImport';

function broadcastVaultUpdated(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.VAULT_DATA_UPDATED);
  }
  refreshTextExpanderShortcuts();
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.GET_ALL_FIELDS, (_e, profileId: string) => db.getFieldsForProfile(profileId));

  ipcMain.handle(IPC.GET_PROFILES, () => db.getProfiles());

  ipcMain.handle(IPC.SET_ACTIVE_PROFILE, (_e, profileId: string) => {
    db.setSetting('activeProfileId', profileId);
    broadcastVaultUpdated();
  });

  ipcMain.handle(IPC.ADD_PROFILE, (_e, profile: NewProfile) => {
    const created = db.addProfile(profile);
    broadcastVaultUpdated();
    return created;
  });

  ipcMain.handle(IPC.DELETE_PROFILE, (_e, profileId: string) => {
    db.deleteProfile(profileId);
    broadcastVaultUpdated();
  });

  ipcMain.handle(IPC.ADD_FIELD, (_e, field: NewField) => {
    const created = db.addField(field);
    broadcastVaultUpdated();
    return created;
  });

  ipcMain.handle(IPC.UPDATE_FIELD, (_e, field: UpdateField) => {
    const updated = db.updateField(field);
    broadcastVaultUpdated();
    return updated;
  });

  ipcMain.handle(IPC.DELETE_FIELD, (_e, fieldId: string) => {
    db.deleteField(fieldId);
    broadcastVaultUpdated();
  });

  ipcMain.handle(IPC.COPY_FIELD, (_e, fieldId: string, autoPaste = true) => {
    const value = db.getFieldValue(fieldId);
    if (value === null) return;
    if (autoPaste) {
      copyAndPaste(value);
    } else {
      copyToClipboard(value);
    }
    db.logUsage(fieldId, 'copy');
  });

  ipcMain.handle(IPC.GET_FILES, (_e, profileId: string) => db.getFilesForProfile(profileId));

  ipcMain.handle(IPC.ADD_FILE, (_e, profileId: string, label: string, filePath: string) =>
    db.addFile(profileId, label, filePath)
  );

  ipcMain.handle(IPC.DELETE_FILE, (_e, fileId: string) => db.deleteFile(fileId));

  ipcMain.handle(IPC.PICK_FILE, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select a file to reference',
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });

  ipcMain.handle(IPC.EXPORT_VAULT, async (_e, passphrase: string) => {
    if (!passphrase) return { ok: false, reason: 'no-passphrase' as const };

    const { profiles, fields } = db.exportAllProfilesAndFields();
    const payload: VaultExport = { version: 1, exportedAt: new Date().toISOString(), profiles, fields };

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export FormVault Data',
      defaultPath: path.join(app.getPath('documents'), 'formvault-export.fvault'),
      filters: [{ name: 'FormVault Encrypted Export', extensions: ['fvault'] }]
    });
    if (canceled || !filePath) return { ok: false, reason: 'cancelled' as const };

    const encrypted = encryptPayload(JSON.stringify(payload), passphrase);
    fs.writeFileSync(filePath, encrypted, 'utf8');
    return { ok: true, path: filePath };
  });

  ipcMain.handle(IPC.IMPORT_VAULT, async (_e, passphrase: string) => {
    if (!passphrase) return { ok: false, reason: 'no-passphrase' as const };

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import FormVault Data',
      filters: [{ name: 'FormVault Encrypted Export', extensions: ['fvault'] }, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) return { ok: false, reason: 'cancelled' as const };

    const raw = fs.readFileSync(filePaths[0], 'utf8');

    let decrypted: string;
    try {
      decrypted = decryptPayload(raw, passphrase);
    } catch (err) {
      if (err instanceof WrongPassphraseError) return { ok: false, reason: 'wrong-passphrase' as const };
      return { ok: false, reason: 'invalid-file' as const };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(decrypted);
    } catch {
      return { ok: false, reason: 'invalid-file' as const };
    }
    if (!isValidVaultExport(parsed)) return { ok: false, reason: 'invalid-file' as const };

    db.importProfilesAndFields(parsed.profiles, parsed.fields);
    broadcastVaultUpdated();
    return { ok: true };
  });

  ipcMain.handle(IPC.SETTINGS_GET, () => {
    const settings = db.getAllSettings();
    return {
      hotkey: settings.hotkey ?? null,
      launchAtStartup: settings.launchAtStartup === 'true',
      activeProfileId: settings.activeProfileId ?? db.getDefaultProfileId()
    };
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_e, key: string, value: unknown) => {
    db.setSetting(key, String(value));

    if (key === 'hotkey' && typeof value === 'string') {
      registerGlobalHotkey(value);
    }
    if (key === 'launchAtStartup') {
      app.setLoginItemSettings({ openAtLogin: value === true || value === 'true' });
    }
  });

  ipcMain.handle(IPC.OPEN_VAULT_MANAGER, () => openVaultWindow());
  ipcMain.handle(IPC.OPEN_SETTINGS, () => openSettingsWindow());
  ipcMain.handle(IPC.CLOSE_POPUP, () => hidePopupWindow());
  ipcMain.handle(IPC.QUIT, () => app.quit());
  ipcMain.handle(IPC.GET_APP_VERSION, () => app.getVersion());
  ipcMain.handle(IPC.GET_CAPABILITIES, () => ({
    autoPaste: isAutoPasteAvailable(),
    textExpansion: isTextExpanderAvailable()
  }));
  ipcMain.handle(IPC.SHOW_ITEM_IN_FOLDER, (_e, filePath: string) => {
    if (!db.isKnownFilePath(filePath)) return;
    shell.showItemInFolder(filePath);
  });
}
