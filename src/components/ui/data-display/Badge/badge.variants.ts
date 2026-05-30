import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  [
    'inline-flex items-center font-mono tracking-[0.15em] uppercase',
    'transition-all duration-300 ease-out',
    'bg-transparent border-transparent p-0',
    'drop-shadow-[0_0_8px_currentColor]',
    '[&>svg]:shrink-0 [&>svg]:h-3 [&>svg]:w-3',
  ],
  {
    variants: {
      variant: {
        default: 'text-foreground-muted',
        success: 'text-[var(--success)]',
        warning: 'text-[var(--warning)]',
        error: 'text-[var(--error)]',
        info: 'text-[var(--info)]',
        brand: 'text-brand-600 dark:text-brand-400',
      },
      size: {
        sm: 'text-[10px] gap-1',
        md: 'text-xs gap-1.5',
      },
      pill: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      pill: false,
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;