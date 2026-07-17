export type CopyFeedbackState = 'idle' | 'copied' | 'closing';

export interface CopyFeedbackCallbacks {
  onStateChange: (state: CopyFeedbackState) => void;
  onClose: () => void;
}

/**
 * Drives the popup's post-copy behavior: hold the "Copied!" row for `holdMs`, then fade out over
 * `fadeMs` before closing. An Escape during either phase cancels the pending timers and closes
 * immediately instead of waiting out the hold.
 */
export class CopyFeedbackController {
  private state: CopyFeedbackState = 'idle';
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private callbacks: CopyFeedbackCallbacks,
    private holdMs = 600,
    private fadeMs = 120
  ) {}

  get currentState() {
    return this.state;
  }

  /** Returns false (no-op) if feedback is already in progress — copy selection is debounced. */
  start(): boolean {
    if (this.state !== 'idle') return false;
    this.setState('copied');
    this.closeTimer = setTimeout(() => this.beginFade(), this.holdMs);
    return true;
  }

  private beginFade() {
    this.setState('closing');
    this.fadeTimer = setTimeout(() => this.callbacks.onClose(), this.fadeMs);
  }

  /** Returns true if it interrupted an in-progress hold/fade and closed immediately. */
  escape(): boolean {
    if (this.state === 'idle') return false;
    this.clearTimers();
    this.callbacks.onClose();
    return true;
  }

  dispose() {
    this.clearTimers();
  }

  /** Cancels any pending timers and returns to idle without invoking onClose — used when the popup is reused for a new session. */
  reset() {
    this.clearTimers();
    this.setState('idle');
  }

  private clearTimers() {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    this.closeTimer = null;
    this.fadeTimer = null;
  }

  private setState(next: CopyFeedbackState) {
    this.state = next;
    this.callbacks.onStateChange(next);
  }
}
