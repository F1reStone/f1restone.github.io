import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva(
  ['rounded-2xl', 'transition-all duration-200 ease-out'],
  {
    variants: {
      variant: {
        default: 'bg-card border border-brand-500/30 hover-glow-box',
        solid: 'bg-secondary border border-transparent',
        outline: 'bg-transparent border-2 border-brand-500/30 hover-glow-box',
        ghost: 'bg-transparent border border-transparent',
        elevated: 'bg-card border border-brand-500/30 shadow-lg hover-glow-box',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        true: 'hover:border-brand-500 hover:shadow-md hover:-translate-y-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export type CardVariants = VariantProps<typeof cardVariants>;
