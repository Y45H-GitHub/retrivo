import { computeCompletionPct } from '../completionUtils';
import type { Field } from '../types';

interface ProfileCompletionIndicatorProps {
  fields: Pick<Field, 'value'>[];
}

/** Sidebar progress indicator — hidden once every field in the profile is filled. */
export function ProfileCompletionIndicator({ fields }: ProfileCompletionIndicatorProps) {
  const total = fields.length;
  const filled = fields.filter((f) => f.value !== '').length;
  const pct = computeCompletionPct(fields);

  if (total === 0 || pct === 100) return null;

  return (
    <div className="px-2.5 pb-1">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-caption text-ink-muted">
          {filled}/{total} filled
        </span>
        <span className="text-caption text-ink-muted">{pct}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-accent-subtle">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%`, transition: `width var(--duration-slow) var(--ease-spring)` }}
        />
      </div>
    </div>
  );
}
