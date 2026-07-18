import { useEffect, useState, type ReactNode } from 'react';
import { DownloadSimple, UploadSimple, CheckCircle, XCircle } from '@phosphor-icons/react';
import { ipc } from '../shared/ipc-client';
import { DEFAULT_HOTKEY } from '../shared/constants';
import { cn } from '../shared/cn';
import { Button } from '../shared/ui/Button';
import { Switch } from '../shared/ui/Switch';
import { Kbd } from '../shared/ui/Kbd';
import { PassphraseDialog } from '../shared/ui/PassphraseDialog';
import { useToast } from '../shared/ui/useToast';

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
    <div className={cn('flex items-center gap-4 px-4 py-3.5', divider && 'border-b border-stroke-subtle')}>
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-label text-ink-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function CapabilityBadge({ available }: { available: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {available ? (
        <CheckCircle weight="bold" className="h-4 w-4 text-success" />
      ) : (
        <XCircle weight="bold" className="h-4 w-4 text-danger" />
      )}
      <span className="text-body text-ink-secondary">{available ? 'Available' : 'Not available'}</span>
    </div>
  );
}

export function Settings() {
  const { toast } = useToast();
  const [hotkey, setHotkey] = useState(DEFAULT_HOTKEY);
  const [recording, setRecording] = useState(false);
  const [launchAtStartup, setLaunchAtStartup] = useState(true);
  const [version, setVersion] = useState('');
  const [capabilities, setCapabilities] = useState({ autoPaste: true, textExpansion: true });
  const [passphraseDialog, setPassphraseDialog] = useState<'export' | 'import' | null>(null);

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

  async function handleExport(passphrase: string) {
    setPassphraseDialog(null);
    const result = await ipc.exportVault(passphrase);
    if (result.ok) toast('success', `Exported to ${result.path}`);
    else if (result.reason === 'cancelled') toast('info', 'Export cancelled');
    else toast('error', 'Export failed. Please try again.');
  }

  async function handleImport(passphrase: string) {
    setPassphraseDialog(null);
    const result = await ipc.importVault(passphrase);
    if (result.ok) toast('success', 'Vault imported successfully');
    else if (result.reason === 'cancelled') toast('info', 'Import cancelled');
    else if (result.reason === 'wrong-passphrase') toast('error', 'Incorrect passphrase, or not a valid FormVault export.');
    else toast('error', 'Import failed. Please try again.');
  }

  const hotkeyParts = hotkey.replace('CommandOrControl', 'Ctrl').split('+');

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-canvas px-6 py-5 text-ink">
      <h1 className="mb-4 font-display text-display">Settings</h1>

      <div className="flex flex-col gap-4">
        <SettingsGroup title="Hotkey">
          <SettingsRow
            title="Open popup"
            description={recording ? 'Press a key combination, or Esc to cancel' : 'Works anywhere in Windows'}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex items-center gap-1 rounded-control',
                  recording && 'ring-2 ring-accent ring-offset-2 ring-offset-card animate-pulse-ring'
                )}
              >
                {recording ? (
                  <span className="px-1 text-label text-accent">Recording…</span>
                ) : (
                  hotkeyParts.map((part) => <Kbd key={part}>{part}</Kbd>)
                )}
              </div>
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
          <SettingsRow divider title="Export vault" description="Save an encrypted backup of all profiles and fields">
            <Button size="sm" variant="secondary" onClick={() => setPassphraseDialog('export')}>
              <DownloadSimple weight="regular" className="h-3.5 w-3.5" /> Export
            </Button>
          </SettingsRow>
          <SettingsRow title="Import vault" description="Restore from a previously exported file">
            <Button size="sm" variant="secondary" onClick={() => setPassphraseDialog('import')}>
              <UploadSimple weight="regular" className="h-3.5 w-3.5" /> Import
            </Button>
          </SettingsRow>
        </SettingsGroup>

        {passphraseDialog && (
          <PassphraseDialog
            mode={passphraseDialog}
            onClose={() => setPassphraseDialog(null)}
            onSubmit={(passphrase) => void (passphraseDialog === 'export' ? handleExport(passphrase) : handleImport(passphrase))}
          />
        )}

        <SettingsGroup title="About">
          <SettingsRow divider title="Version">
            <span className="font-mono text-body text-ink-secondary">{version ? `v${version}` : '-'}</span>
          </SettingsRow>
          <SettingsRow divider title="Auto-paste" description="Automatically pastes after copying">
            <CapabilityBadge available={capabilities.autoPaste} />
          </SettingsRow>
          <SettingsRow title="Text expansion" description="Type a shortcut to paste the value">
            <CapabilityBadge available={capabilities.textExpansion} />
          </SettingsRow>
        </SettingsGroup>

        <p className="mt-1 text-caption text-ink-muted">Appearance follows your Windows theme.</p>
      </div>
    </div>
  );
}
