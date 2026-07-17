// Feature: formvault-ui-redesign, Property 5: InlineConfirm call-count invariant
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineConfirm } from './InlineConfirm';

type Action = 'open' | 'confirm' | 'cancel' | 'escape';

async function runSequence(actions: Action[], onConfirm: () => void) {
  const user = userEvent.setup();
  const { container, unmount } = render(<InlineConfirm onConfirm={onConfirm} triggerAriaLabel="Delete item" />);
  const scope = within(container);

  try {
    for (const action of actions) {
      const confirmRow = scope.queryByRole('group', { name: 'Confirm deletion' });
      if (action === 'open') {
        const trigger = scope.queryByRole('button', { name: 'Delete item' });
        if (trigger) await user.click(trigger);
      } else if (action === 'confirm') {
        if (confirmRow) await user.click(scope.getByRole('button', { name: 'Yes, delete' }));
      } else if (action === 'cancel') {
        if (confirmRow) await user.click(scope.getByRole('button', { name: 'Cancel' }));
      } else if (action === 'escape') {
        if (confirmRow) await user.keyboard('{Escape}');
      }
    }
  } finally {
    unmount();
  }
}

describe('P5: onConfirm called exactly once per "Yes, delete" click', () => {
  it('for any interaction sequence, callCount equals number of successful confirm clicks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom<Action>('open', 'confirm', 'cancel', 'escape'), { minLength: 1, maxLength: 8 }),
        async (actions) => {
          let callCount = 0;
          await runSequence(actions, () => callCount++);

          // Re-derive expected count by replaying the same state machine rules the component follows.
          let confirming = false;
          let expected = 0;
          for (const action of actions) {
            if (action === 'open' && !confirming) confirming = true;
            else if (action === 'confirm' && confirming) {
              expected++;
              confirming = false;
            } else if ((action === 'cancel' || action === 'escape') && confirming) {
              confirming = false;
            }
          }
          expect(callCount).toBe(expected);
        }
      ),
      { numRuns: 25 }
    );
  }, 30000);

  it('cancel never calls onConfirm', async () => {
    let callCount = 0;
    await runSequence(['open', 'cancel'], () => callCount++);
    expect(callCount).toBe(0);
  });

  it('escape never calls onConfirm', async () => {
    let callCount = 0;
    await runSequence(['open', 'escape'], () => callCount++);
    expect(callCount).toBe(0);
  });

  it('confirm calls onConfirm exactly once', async () => {
    let callCount = 0;
    await runSequence(['open', 'confirm'], () => callCount++);
    expect(callCount).toBe(1);
  });
});
