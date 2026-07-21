import { useEffect, useRef, useState } from 'react';
import { Lock } from '@phosphor-icons/react';
import { Button } from './Button';
import { Input } from './Input';

interface UnlockResult {
  ok: boolean;
  reason?: 'wrong-pin' | 'locked-out';
  retryAfterSeconds?: number;
}

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<UnlockResult>;
  onUnlocked: () => void;
}

export function LockScreen({ onUnlock, onUnlocked }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onUnlock(pin);
    setSubmitting(false);
    setPin('');
    if (result.ok) {
      onUnlocked();
    } else if (result.reason === 'locked-out') {
      setError(`Too many attempts. Try again in ${result.retryAfterSeconds}s.`);
    } else {
      setError('Incorrect PIN.');
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hover">
        <Lock weight="regular" className="h-4 w-4 text-ink-muted" />
      </div>
      <div>
        <p className="text-body-lg font-medium text-ink">Retrivo is locked</p>
        <p className="mt-1 text-label text-ink-muted">Enter your PIN to continue.</p>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex w-full max-w-[200px] flex-col gap-2">
        <Input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="text-center tracking-[0.4em]"
          disabled={submitting}
        />
        {error && <p className="text-caption text-danger">{error}</p>}
        <Button type="submit" disabled={!pin || submitting}>
          Unlock
        </Button>
      </form>
    </div>
  );
}
