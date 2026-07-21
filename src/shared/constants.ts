import type { Category } from './types';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'financial', label: 'Financial' },
  { id: 'business', label: 'Business' },
  { id: 'documents', label: 'Documents' },
  { id: 'custom', label: 'Custom' }
];

export const CATEGORY_COLORS: Record<Category, string> = {
  personal: '#6366f1',
  financial: '#10b981',
  business: '#f59e0b',
  documents: '#ef4444',
  custom: '#8b5cf6'
};

/** Fields whose values should be partially masked in the popup list. */
export const SENSITIVE_SHORTCUTS = new Set(['!pan', '!aadhaar', '!accno', '!cin', '!gst']);

export const DEFAULT_HOTKEY = 'CommandOrControl+Shift+Space';

export const DEFAULT_PROFILE_NAME = 'Personal';

export const IPC = {
  VAULT_DATA_UPDATED: 'vault:data-updated',
  HOTKEY_TRIGGERED: 'hotkey:triggered',

  GET_ALL_FIELDS: 'vault:get-all-fields',
  GET_PROFILES: 'vault:get-profiles',
  SET_ACTIVE_PROFILE: 'vault:set-active-profile',
  ADD_PROFILE: 'vault:add-profile',
  DELETE_PROFILE: 'vault:delete-profile',
  ADD_FIELD: 'vault:add-field',
  UPDATE_FIELD: 'vault:update-field',
  DELETE_FIELD: 'vault:delete-field',
  COPY_FIELD: 'vault:copy-field',
  GET_FILES: 'vault:get-files',
  ADD_FILE: 'vault:add-file',
  DELETE_FILE: 'vault:delete-file',
  PICK_FILE: 'vault:pick-file',
  EXPORT_VAULT: 'vault:export',
  IMPORT_VAULT: 'vault:import',
  SHOW_ITEM_IN_FOLDER: 'vault:show-item-in-folder',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  OPEN_VAULT_MANAGER: 'app:open-vault-manager',
  OPEN_SETTINGS: 'app:open-settings',
  CLOSE_POPUP: 'app:close-popup',
  QUIT: 'app:quit',
  GET_APP_VERSION: 'app:get-version',
  GET_CAPABILITIES: 'app:get-capabilities',

  LOCK_STATE_CHANGED: 'lock:state-changed',
  GET_LOCK_STATE: 'lock:get-state',
  UNLOCK: 'lock:unlock',
  LOCK_NOW: 'lock:lock-now',
  SET_PIN: 'lock:set-pin',
  REMOVE_PIN: 'lock:remove-pin'
} as const;

/** Idle time (via Electron's powerMonitor) after which the app auto-locks if a PIN is set. */
export const AUTO_LOCK_IDLE_SECONDS = 15 * 60;

/** Consecutive wrong-PIN attempts allowed before a cooldown kicks in. */
export const MAX_PIN_ATTEMPTS = 5;

/** Cooldown duration once MAX_PIN_ATTEMPTS is hit. */
export const PIN_LOCKOUT_MS = 30_000;

export const MIN_PIN_LENGTH = 4;
