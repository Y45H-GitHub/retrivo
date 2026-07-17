// Feature: formvault-ui-redesign, Property 7: Toast stack limit
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { pushToast, dismissToast, type ToastItem, type ToastVariant } from './toastQueue';

function makeItem(i: number, variant: ToastVariant): ToastItem {
  return { id: `t${i}`, variant, message: `msg ${i}`, createdAt: i };
}

describe('P7: at most 3 toasts visible at once', () => {
  it('for any sequence of N toast pushes, the queue never exceeds 3 items', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom<ToastVariant>('success', 'error', 'info'), { minLength: 1, maxLength: 20 }), (variants) => {
        let toasts: ToastItem[] = [];
        let maxSeen = 0;
        variants.forEach((variant, i) => {
          toasts = pushToast(toasts, makeItem(i, variant));
          maxSeen = Math.max(maxSeen, toasts.length);
        });
        expect(maxSeen).toBeLessThanOrEqual(3);
        expect(toasts.length).toBeLessThanOrEqual(3);
      }),
      { numRuns: 200 }
    );
  });

  it('dismissing a toast removes exactly that item', () => {
    const toasts = [makeItem(0, 'info'), makeItem(1, 'success')];
    expect(dismissToast(toasts, 't0')).toEqual([makeItem(1, 'success')]);
  });

  it('pushing beyond the cap drops the oldest first (FIFO)', () => {
    let toasts: ToastItem[] = [];
    for (let i = 0; i < 5; i++) toasts = pushToast(toasts, makeItem(i, 'info'));
    expect(toasts.map((t) => t.id)).toEqual(['t2', 't3', 't4']);
  });
});
