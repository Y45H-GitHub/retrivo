import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  forwardRef
} from 'react';
import { cn } from '../cn';

const fieldBase =
  'w-full rounded-control border border-stroke bg-surface text-body text-ink placeholder:text-ink-muted transition-colors hover:border-ink-muted/40 focus:border-accent focus:outline-none disabled:opacity-45';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, 'h-8 px-2.5', className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'min-h-[72px] px-2.5 py-2', className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, 'h-8 px-2', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('mb-1 block text-label font-medium text-ink-secondary', className)}>{children}</label>;
}
