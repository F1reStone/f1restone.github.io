import { cva, type VariantProps } from 'class-variance-authority';

export const footerVariants = cva('py-[var(--space-stack-lg)]', {
  variants: {
    background: {
      default: 'bg-background border-border',
      secondary: 'bg-background-secondary border-border',
      invert: 'invert-section bg-background border-border',
    },
  },
  defaultVariants: {
    background: 'default',
  },
});

export const footerColumnGridVariants = cva('grid grid-cols-1 gap-[var(--space-stack-lg)]', {
  variants: {
    columns: {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
    },
  },
  defaultVariants: {
    columns: 4,
  },
});

export type FooterVariants = VariantProps<typeof footerVariants>;
export type FooterColumnGridVariants = VariantProps<typeof footerColumnGridVariants>;
