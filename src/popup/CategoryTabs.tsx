import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../shared/cn';
import { CATEGORIES } from '../shared/constants';
import type { Category } from '../shared/types';

interface CategoryTabsProps {
  activeCategory: Category | 'all';
  availableCategories: Set<Category>;
  onSelect: (category: Category | 'all') => void;
}

export function CategoryTabs({ activeCategory, availableCategories, onSelect }: CategoryTabsProps) {
  const tabs = useMemo(
    () => [{ id: 'all' as const, label: 'All' }, ...CATEGORIES.filter((c) => availableCategories.has(c.id))],
    [availableCategories]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeIndex = tabs.findIndex((t) => t.id === activeCategory);
    const btn = container.querySelectorAll('button')[activeIndex] as HTMLElement | null;
    if (btn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({ left: btnRect.left - containerRect.left, width: btnRect.width });
    }
  }, [activeCategory, tabs]);

  return (
    <div ref={containerRef} role="tablist" aria-label="Categories" className="relative flex gap-1 overflow-x-auto px-3 pb-2.5">
      <span
        aria-hidden
        className="absolute bottom-2.5 h-[22px] rounded-pill bg-accent-subtle"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          transition: `left var(--duration-base) var(--ease-spring), width var(--duration-base) var(--ease-spring)`
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeCategory === tab.id}
          tabIndex={-1}
          onClick={() => onSelect(tab.id)}
          className={cn(
            'relative z-10 shrink-0 rounded-pill px-2.5 py-[3px] text-label font-medium transition-colors duration-base',
            activeCategory === tab.id ? 'text-accent' : 'text-ink-secondary hover:text-ink'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
