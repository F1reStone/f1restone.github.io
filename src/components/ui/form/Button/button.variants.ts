import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  [
    'group',
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-full',
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-foreground text-background hover-glow-box',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/50 hover-glow-box hover-solid-fill',
        outline:
          'glass-panel text-foreground hover-glow-text hover-glow-outline',
        ghost:
          'bg-transparent text-foreground-secondary hover-glow-box hover-solid-fill',
        destructive:
          'bg-destructive text-destructive-foreground hover-glow-box hover:bg-destructive/80',
        link: 
          /* FireStone: 文本按钮仅使用发光，不能使用 weight-shift，防止破坏内部 Icon Flex 布局 */
          'text-foreground-secondary hover:text-foreground hover-glow-text',
      },
      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:h-4 [&_svg]:w-4',
        md: 'h-10 px-4 text-sm [&_svg]:h-5 [&_svg]:w-5',
        lg: 'h-12 px-5 text-base [&_svg]:h-5 [&_svg]:w-5',
      },
      fullWidth: {
        true: 'w-full',
      },
      icon: {
        true: 'rounded-md',
      },
    },
    compoundVariants: [
      { icon: true, size: 'sm', class: 'h-8 w-8 px-0' },
      { icon: true, size: 'md', class: 'h-10 w-10 px-0' },
      { icon: true, size: 'lg', class: 'h-12 w-12 px-0' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
