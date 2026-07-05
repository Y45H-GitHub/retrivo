import { SENSITIVE_SHORTCUTS } from './constants';

export function isSensitiveField(shortcut: string | null): boolean {
  return !!shortcut && SENSITIVE_SHORTCUTS.has(shortcut);
}

/** Shows the first few characters and masks the rest, e.g. "ABCDE1234F" -> "ABCDXXXXXX". */
export function maskValue(value: string): string {
  if (!value) return value;
  const visible = Math.min(4, Math.max(1, Math.floor(value.length / 3)));
  return value.slice(0, visible) + 'X'.repeat(Math.max(0, value.length - visible));
}
