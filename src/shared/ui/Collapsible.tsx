import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '../cn';

interface CollapsibleProps {
  trigger: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function Collapsible({ trigger, defaultOpen = false, children, className }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
  });

  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 py-2 text-left">
        {trigger}
        <CaretDown
          weight="bold"
          className={cn('ml-auto h-3.5 w-3.5 text-ink-muted', open && 'rotate-180')}
          style={{ transition: `transform var(--duration-base) var(--ease-spring)` }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? contentHeight : 0,
          overflow: 'hidden',
          transition: `max-height var(--duration-slow) var(--ease-spring)`
        }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}
