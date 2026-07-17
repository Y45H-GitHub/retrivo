// Feature: formvault-ui-redesign, Property 6: Copy feedback timing window
import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyFeedbackController } from './copyFeedbackController';

describe('P6: popup stays open for the full 600ms hold unless interrupted', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('without Escape, close fires at T+600ms (+120ms fade), not before', () => {
    let closed = false;
    const controller = new CopyFeedbackController({ onStateChange: () => {}, onClose: () => (closed = true) });

    controller.start();
    vi.advanceTimersByTime(599);
    expect(closed).toBe(false);

    vi.advanceTimersByTime(1); // T+600: fade begins
    expect(closed).toBe(false);

    vi.advanceTimersByTime(119);
    expect(closed).toBe(false);

    vi.advanceTimersByTime(1); // T+720: fade complete
    expect(closed).toBe(true);
  });

  it('Escape pressed at any delta < 600ms closes immediately, not at T+600', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 599 }), (delta) => {
        vi.useFakeTimers({ now: 0 });
        let closed = false;
        let closedAt: number | null = null;
        const controller = new CopyFeedbackController({
          onStateChange: () => {},
          onClose: () => {
            closed = true;
            closedAt = Date.now();
          }
        });

        controller.start();
        vi.advanceTimersByTime(delta);
        expect(closed).toBe(false);

        controller.escape();
        expect(closed).toBe(true);
        expect(closedAt).toBe(delta);

        // Advancing further must not double-close or throw.
        vi.advanceTimersByTime(1000);
        vi.useRealTimers();
      }),
      { numRuns: 100 }
    );
  });

  it('the "copied"/"closing" state is active for the entire remaining open duration', () => {
    const states: string[] = [];
    const controller = new CopyFeedbackController({ onStateChange: (s) => states.push(s), onClose: () => {} });
    controller.start();
    expect(controller.currentState).toBe('copied');
    vi.advanceTimersByTime(600);
    expect(controller.currentState).toBe('closing');
    expect(states).toEqual(['copied', 'closing']);
  });

  it('start() is a no-op while feedback is already in progress (debounced selection)', () => {
    const controller = new CopyFeedbackController({ onStateChange: () => {}, onClose: () => {} });
    expect(controller.start()).toBe(true);
    expect(controller.start()).toBe(false);
  });
});
