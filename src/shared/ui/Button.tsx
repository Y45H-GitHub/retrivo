import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-1.5 rounded-control font-medium transition-colors disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:bg-accent-hover active:bg-accent-hover',
        secondary: 'border border-stroke bg-card text-ink shadow-elevation-1 hover:bg-hover active:bg-active',
        ghost: 'text-ink-secondary hover:bg-hover hover:text-ink active:bg-active',
        danger: 'text-danger hover:bg-danger/10 active:bg-danger/15'
      },
      size: {
        sm: 'h-7 px-2.5 text-label',
        md: 'h-8 px-3.5 text-body',
        icon: 'h-7 w-7',
        'icon-md': 'h-8 w-8'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';
