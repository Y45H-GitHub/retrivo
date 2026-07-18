import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Input, FieldLabel } from './Input';

const MIN_LENGTH = 8;

interface PassphraseDialogProps {
  mode: 'export' | 'import';
  onSubmit: (passphrase: string) => void;
  onClose: () => void;
}

/** Prompts for the passphrase used to encrypt/decrypt a vault export — see exportCrypto.ts. */
export function PassphraseDialog({ mode, onSubmit, onClose }: PassphraseDialogProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');

  const isExport = mode === 'export';
  const tooShort = isExport && passphrase.length > 0 && passphrase.length < MIN_LENGTH;
  const mismatch = isExport && confirm.length > 0 && passphrase !== confirm;
  const canSubmit = isExport ? passphrase.length >= MIN_LENGTH && passphrase === confirm : passphrase.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(passphrase);
  }

  return (
    <Dialog title={isExport ? 'Encrypt your export' : 'Enter export passphrase'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <p className="text-label text-ink-muted">
          {isExport
            ? 'Your export file is encrypted with this passphrase — anyone who gets the file cannot read it without also knowing this. There is no way to recover a forgotten passphrase, so store it somewhere safe.'
            : 'Enter the passphrase you used when creating this export file.'}
        </p>
        <div>
          <FieldLabel>Passphrase</FieldLabel>
          <Input
            autoFocus
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder={isExport ? `At least ${MIN_LENGTH} characters` : 'Export passphrase'}
          />
          {tooShort && <p className="mt-1 text-caption text-danger">Must be at least {MIN_LENGTH} characters.</p>}
        </div>
        {isExport && (
          <div>
            <FieldLabel>Confirm passphrase</FieldLabel>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter passphrase" />
            {mismatch && <p className="mt-1 text-caption text-danger">Passphrases don&apos;t match.</p>}
          </div>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isExport ? 'Export' : 'Import'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
