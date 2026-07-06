import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/20/solid';
import { ipc } from '../shared/ipc-client';
import { DEFAULT_HOTKEY } from '../shared/constants';
import { Button } from '../shared/ui/Button';
import { Switch } from '../shared/ui/Switch';
import { Kbd } from '../shared/ui/Kbd';

function codeToAcceleratorKey(code: string): string | null {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return code.slice(6) || null;
  if (code === 'Space') return 'Space';
  if (code === 'Tab') return 'Tab';
  if (code === 'Escape') return 'Escape';
  if (code === 'Enter') return 'Enter';
  if (code === 'Backspace') return 'Backspace';
  if (code.startsWith('Arrow')) return code;
  if (/^F\d{1,2}$/.test(code)) return code;
  return null;
}

function formatAccelerator(e: KeyboardEvent): string | null {
  const key = codeToAcceleratorKey(e.code);
  if (!key) return null;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Control');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Super');
  if (parts.length === 0) return null;
  parts.push(key);
  return parts.join('+');
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      <div className="overflow-hidden rounded-card border border-stroke bg-card shadow-elevation-1">{children}</div>
    </section>
  );
}

function SettingsRow({
  title,
  description,
  children,
  divider = false
}: {
  title: string;
  description?: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <div className={'flex items-center gap-4 px-4 py-3' + (divider ? ' border-b border-stroke-subtle' : '')}>
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-label text-ink-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Settings() {
  const [hotkey, setHotkey] = useState(DEFAULT_HOTKEY);
  const [recording, setRecording] = useState(false);
  const [launchAtStartup, setLaunchAtStartup] = useState(true);
  const [version, setVersion] = useState('');
  const [capabilities, setCapabilities] = useState({ autoPaste: true, textExpansion: true });
  const [dataStatus, setDataStatus] = useState<string | null>(null);

  useEffect(() => {
    void ipc.getSettings().then((s) => {
      const settings = s as { hotkey?: string; launchAtStartup?: boolean };
      setHotkey(settings.hotkey ?? DEFAULT_HOTKEY);
      setLaunchAtStartup(settings.launchAtStartup ?? true);
    });
    void ipc.getAppVersion().then(setVersion);
    void ipc.getCapabilities().then(setCapabilities);
  }, []);

  useEffect(() => {
    if (!recording) return;
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      if (e.key === 'Escape') {
        setRecording(false);
        return;
      }
      const accelerator = formatAccelerator(e);
      if (!accelerator) return;
      setHotkey(accelerator);
      setRecording(false);
      void ipc.setSetting('hotkey', accelerator);
    }
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [recording]);

  async function toggleLaunchAtStartup(checked: boolean) {
    setLaunchAtStartup(checked);
    await ipc.setSetting('launchAtStartup', checked);
  }

  async function handleExport() {
    setDataStatus(null);
    const result = await ipc.exportVault();
    setDataStatus(result.ok ? `Exported to ${result.path}` : 'Export cancelled');
  }

  async function handleImport() {
    setDataStatus(null);
    const result = await ipc.importVault();
    setDataStatus(result.ok ? 'Vault imported successfully' : 'Import cancelled');
  }

  const hotkeyParts = hotkey.replace('CommandOrControl', 'Ctrl').split('+');

  return (
    <div className="flex h-screen w-screen flex-col overflow-y-auto bg-canvas px-6 py-5 text-ink">
      <h1 className="mb-4 font-display text-display">Settings</h1>

      <div className="flex flex-col gap-4">
        <SettingsGroup title="Hotkey">
          <SettingsRow
            title="Open popup"
            description={recording ? 'Press a key combination, or Esc to cancel' : 'Works anywhere in Windows'}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                {recording ? (
                  <span className="text-label text-accent">Recording…</span>
                ) : (
                  hotkeyParts.map((part) => <Kbd key={part}>{part}</Kbd>)
                )}
              </span>
              <Button size="sm" variant="secondary" onClick={() => setRecording(true)} disabled={recording}>
                Change
              </Button>
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="General">
          <SettingsRow title="Launch at startup" description="Start FormVault automatically when you sign in">
            <Switch checked={launchAtStartup} onChange={(v) => void toggleLaunchAtStartup(v)} label="Launch at startup" />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Data">
          <SettingsRow divider title="Export vault" description="Save all profiles and fields as a JSON file">
            <Button size="sm" variant="secondary" onClick={() => void handleExport()}>
              <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Export
            </Button>
          </SettingsRow>
          <SettingsRow title="Import vault" description="Restore from a previously exported file">
            <Button size="sm" variant="secondary" onClick={() => void handleImport()}>
              <ArrowUpTrayIcon className="h-3.5 w-3.5" /> Import
            </Button>
          </SettingsRow>
        </SettingsGroup>

        {dataStatus && <p className="-mt-2 px-1 text-label text-ink-muted">{dataStatus}</p>}

        {(!capabilities.autoPaste || !capabilities.textExpansion) && (
          <div className="rounded-card border border-warning/30 bg-warning/10 px-4 py-3 text-label text-warning">
            Auto-paste and text expansion are unavailable — a native module hasn't been compiled on this machine.
            Copy-to-clipboard still works everywhere. See the README for setup.
          </div>
        )}

        <p className="mt-1 text-caption text-ink-muted">
          FormVault {version ? `v${version}` : ''} — appearance follows your Windows theme.
        </p>
      </div>
    </div>
  );
}
