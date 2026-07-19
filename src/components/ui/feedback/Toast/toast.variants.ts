import { cva, type VariantProps } from 'class-variance-authority';

export const toastVariants = cva(
  [
    'pointer-events-auto relative flex items-start gap-3 overflow-hidden p-4 rounded-2xl md:rounded-[2rem] border bg-background/50 shadow-2xl backdrop-blur-md',
    'transition-all duration-300 ease-out',
  ],
  {
    variants: {
      variant: {
        default: 'border-border/50 text-foreground',
        success: 'border-[var(--success)]/30 text-foreground',
        error: 'border-[var(--error)]/30 text-foreground',
        warning: 'border-[var(--warning)]/30 text-foreground',
        info: 'border-[var(--info)]/30 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const toastIconColors = {
  default: 'text-foreground-muted',
  success: 'text-[var(--success)]',
  error: 'text-[var(--error)]',
  warning: 'text-[var(--warning)]',
  info: 'text-[var(--info)]',
} as const;

export type ToastVariants = VariantProps<typeof toastVariants>;
