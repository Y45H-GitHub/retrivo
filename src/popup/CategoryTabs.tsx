import { cn } from '../shared/cn';
import { CATEGORIES } from '../shared/constants';
import type { Category } from '../shared/types';

interface CategoryTabsProps {
  activeCategory: Category | 'all';
  availableCategories: Set<Category>;
  onSelect: (category: Category | 'all') => void;
}

export function CategoryTabs({ activeCategory, availableCategories, onSelect }: CategoryTabsProps) {
  const tabs: { id: Category | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    ...CATEGORIES.filter((c) => availableCategories.has(c.id))
  ];

  return (
    <div role="tablist" aria-label="Categories" className="flex gap-1 overflow-x-auto px-3 pb-2.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeCategory === tab.id}
          tabIndex={-1}
          onClick={() => onSelect(tab.id)}
          className={cn(
            'shrink-0 rounded-full px-2.5 py-[3px] text-label font-medium transition-colors',
            activeCategory === tab.id
              ? 'bg-accent text-accent-ink'
              : 'text-ink-secondary hover:bg-hover hover:text-ink'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
