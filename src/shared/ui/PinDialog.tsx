import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Input, FieldLabel } from './Input';
import { MIN_PIN_LENGTH } from '../constants';

type PinDialogMode = 'set' | 'change' | 'remove';

interface SubmitResult {
  ok: boolean;
  reason?: 'wrong-pin' | 'too-short';
}

interface PinDialogProps {
  mode: PinDialogMode;
  onSubmit: (args: { newPin?: string; currentPin?: string }) => Promise<SubmitResult>;
  onClose: () => void;
}

const TITLES: Record<PinDialogMode, string> = {
  set: 'Set a PIN',
  change: 'Change PIN',
  remove: 'Remove PIN'
};

const DESCRIPTIONS: Record<PinDialogMode, string> = {
  set: 'Anyone who opens Retrivo on this PC will need this PIN. There is no recovery if you forget it - you would need to remove and reinstall to reset.',
  change: 'Enter your current PIN, then choose a new one.',
  remove: 'Enter your current PIN to turn off PIN lock.'
};

/** Set/change/remove flow for the app-lock PIN — see lockState.ts on the main-process side. */
export function PinDialog({ mode, onSubmit, onClose }: PinDialogProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsCurrent = mode !== 'set';
  const needsNew = mode !== 'remove';
  const tooShort = needsNew && newPin.length > 0 && newPin.length < MIN_PIN_LENGTH;
  const mismatch = needsNew && confirmPin.length > 0 && newPin !== confirmPin;
  const canSubmit =
    (!needsCurrent || currentPin.length > 0) && (!needsNew || (newPin.length >= MIN_PIN_LENGTH && newPin === confirmPin));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({
      newPin: needsNew ? newPin : undefined,
      currentPin: needsCurrent ? currentPin : undefined
    });
    setSubmitting(false);
    if (result.ok) {
      onClose();
    } else if (result.reason === 'wrong-pin') {
      setError('Current PIN is incorrect.');
      setCurrentPin('');
    } else {
      setError(`PIN must be at least ${MIN_PIN_LENGTH} characters.`);
    }
  }

  return (
    <Dialog title={TITLES[mode]} onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3.5">
        <p className="text-label text-ink-muted">{DESCRIPTIONS[mode]}</p>

        {needsCurrent && (
          <div>
            <FieldLabel>Current PIN</FieldLabel>
            <Input
              autoFocus
              type="password"
              inputMode="numeric"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Current PIN"
            />
          </div>
        )}
        {needsNew && (
          <div>
            <FieldLabel>New PIN</FieldLabel>
            <Input
              autoFocus={!needsCurrent}
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder={`At least ${MIN_PIN_LENGTH} digits`}
            />
            {tooShort && <p className="mt-1 text-caption text-danger">Must be at least {MIN_PIN_LENGTH} characters.</p>}
          </div>
        )}
        {needsNew && (
          <div>
            <FieldLabel>Confirm new PIN</FieldLabel>
            <Input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Re-enter PIN"
            />
            {mismatch && <p className="mt-1 text-caption text-danger">PINs don&apos;t match.</p>}
          </div>
        )}
        {error && <p className="text-caption text-danger">{error}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || submitting}>
            {mode === 'set' ? 'Set PIN' : mode === 'change' ? 'Change PIN' : 'Remove PIN'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
