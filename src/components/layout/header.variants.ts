import { cva, type VariantProps } from 'class-variance-authority';

export const headerVariants = cva('z-50', {
  variants: {
    position: {
      fixed: 'fixed top-0 left-0 right-0',
      sticky: 'sticky top-0',
      static: 'relative',
    },
    background: {
      progressive: 'hdr-progressive-glass',
      blur: 'hdr-blur-glass',
      solid: 'bg-background border-b border-border-strong',
    },
  },
  defaultVariants: {
    position: 'sticky',
    background: 'progressive',
  },
});

export const headerInnerVariants = cva(
  'mx-auto flex items-center justify-between px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]',
  {
    variants: {
      size: {
        sm: 'h-12',
        md: 'h-14',
        lg: 'h-16',
        xl: 'h-18',
        '2xl': 'h-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type HeaderVariants = VariantProps<typeof headerVariants>;
export type HeaderInnerVariants = VariantProps<typeof headerInnerVariants>;
