import type { ComponentType, ReactNode } from 'react';
import type { IconProps } from '@phosphor-icons/react';

interface EmptyStateProps {
  icon: ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-10 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-card bg-accent-subtle">
        <Icon weight="regular" className="h-5 w-5 text-accent" />
      </div>
      <p className="text-body font-medium text-ink">{title}</p>
      {description && <p className="max-w-[260px] text-label text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
