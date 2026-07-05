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
    <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150',
            activeCategory === tab.id
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
