import { DotsSixVertical } from '@phosphor-icons/react';

interface DragHandleProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/** Drag grip + visually-hidden keyboard fallback (WCAG 2.1 SC 2.1.1), shown only on row hover/focus. */
export function DragHandle({ onMoveUp, onMoveDown }: DragHandleProps) {
  return (
    <div
      className="flex shrink-0 cursor-grab items-center justify-center opacity-0 transition-opacity duration-fast active:cursor-grabbing group-hover:opacity-100 group-focus-within:opacity-100"
      aria-label="Drag to reorder"
    >
      <DotsSixVertical weight="regular" className="h-3.5 w-3.5 text-ink-muted" />
      <div className="sr-only flex gap-1 focus-within:not-sr-only">
        <button type="button" onClick={onMoveUp} aria-label="Move up">
          ↑
        </button>
        <button type="button" onClick={onMoveDown} aria-label="Move down">
          ↓
        </button>
      </div>
    </div>
  );
}
