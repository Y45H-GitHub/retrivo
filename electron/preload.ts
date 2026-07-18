import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../src/shared/constants';
import type { Field, FileRef, NewField, NewProfile, Profile, UpdateField } from '../src/shared/types';

const api = {
  getAllFields: (profileId: string): Promise<Field[]> => ipcRenderer.invoke(IPC.GET_ALL_FIELDS, profileId),
  getProfiles: (): Promise<Profile[]> => ipcRenderer.invoke(IPC.GET_PROFILES),
  setActiveProfile: (profileId: string): Promise<void> => ipcRenderer.invoke(IPC.SET_ACTIVE_PROFILE, profileId),
  addProfile: (profile: NewProfile): Promise<Profile> => ipcRenderer.invoke(IPC.ADD_PROFILE, profile),
  deleteProfile: (profileId: string): Promise<void> => ipcRenderer.invoke(IPC.DELETE_PROFILE, profileId),
  addField: (field: NewField): Promise<Field> => ipcRenderer.invoke(IPC.ADD_FIELD, field),
  updateField: (field: UpdateField): Promise<Field> => ipcRenderer.invoke(IPC.UPDATE_FIELD, field),
  deleteField: (fieldId: string): Promise<void> => ipcRenderer.invoke(IPC.DELETE_FIELD, fieldId),
  copyField: (fieldId: string, autoPaste?: boolean): Promise<void> =>
    ipcRenderer.invoke(IPC.COPY_FIELD, fieldId, autoPaste),
  getFiles: (profileId: string): Promise<FileRef[]> => ipcRenderer.invoke(IPC.GET_FILES, profileId),
  addFile: (profileId: string, label: string, filePath: string): Promise<FileRef> =>
    ipcRenderer.invoke(IPC.ADD_FILE, profileId, label, filePath),
  deleteFile: (fileId: string): Promise<void> => ipcRenderer.invoke(IPC.DELETE_FILE, fileId),
  pickFile: (): Promise<string | null> => ipcRenderer.invoke(IPC.PICK_FILE),
  exportVault: (
    passphrase: string
  ): Promise<{ ok: boolean; path?: string; reason?: 'no-passphrase' | 'cancelled' }> =>
    ipcRenderer.invoke(IPC.EXPORT_VAULT, passphrase),
  importVault: (
    passphrase: string
  ): Promise<{ ok: boolean; reason?: 'no-passphrase' | 'cancelled' | 'wrong-passphrase' | 'invalid-file' }> =>
    ipcRenderer.invoke(IPC.IMPORT_VAULT, passphrase),

  getSettings: (): Promise<Record<string, unknown>> => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSetting: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),

  openVaultManager: (): Promise<void> => ipcRenderer.invoke(IPC.OPEN_VAULT_MANAGER),
  openSettings: (): Promise<void> => ipcRenderer.invoke(IPC.OPEN_SETTINGS),
  closePopup: (): Promise<void> => ipcRenderer.invoke(IPC.CLOSE_POPUP),
  quit: (): Promise<void> => ipcRenderer.invoke(IPC.QUIT),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC.GET_APP_VERSION),
  getCapabilities: (): Promise<{ autoPaste: boolean; textExpansion: boolean }> =>
    ipcRenderer.invoke(IPC.GET_CAPABILITIES),
  showItemInFolder: (filePath: string): Promise<void> => ipcRenderer.invoke(IPC.SHOW_ITEM_IN_FOLDER, filePath),

  onVaultDataUpdated: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on(IPC.VAULT_DATA_UPDATED, listener);
    return () => ipcRenderer.removeListener(IPC.VAULT_DATA_UPDATED, listener);
  },
  onHotkeyTriggered: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on(IPC.HOTKEY_TRIGGERED, listener);
    return () => ipcRenderer.removeListener(IPC.HOTKEY_TRIGGERED, listener);
  }
};

export type FormVaultApi = typeof api;

contextBridge.exposeInMainWorld('formvault', api);
