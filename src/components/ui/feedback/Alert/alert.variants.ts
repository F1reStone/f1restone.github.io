import { cva, type VariantProps } from 'class-variance-authority';

export const alertVariants = cva(
  'relative flex gap-4 p-4 rounded-2xl border overflow-hidden',
  {
    variants: {
      variant: {
        info: 'bg-background border-border',
        success: 'bg-background border-[var(--success)]/30',
        warning: 'bg-background border-[var(--warning)]/30',
        error: 'bg-background border-[var(--error)]/30',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

export const alertIconColors = {
  info: 'text-foreground-muted',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  error: 'text-[var(--error)]',
} as const;

export const alertAccentColors = {
  info: 'box-shadow-[0_0_8px_foreground-muted] bg-foreground-muted',
  success: 'box-shadow-[0_0_8px_[var(--success)]] bg-[var(--success)]',
  warning: 'box-shadow-[0_0_8px_[var(--warning)]] bg-[var(--warning)]',
  error: 'box-shadow-[0_0_8px_[var(--error)]] bg-[var(--error)]',
} as const;

export type AlertVariants = VariantProps<typeof alertVariants>;
