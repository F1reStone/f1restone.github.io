import { type HTMLAttributes, type Ref, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { cardVariants, type CardVariants } from './card.variants';

type CardShadow = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ref'> {
  ref?: Ref<HTMLDivElement>;
  padding?: CardVariants['padding'];
  shadow?: CardShadow;
  hover?: boolean;
  /** Visual style variant */
  variant?: CardVariants['variant'];
  /** Icon element to display in the card header */
  icon?: ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle/byline */
  subtitle?: string;
  /** Card description */
  description?: string;
  /** Whether to use the structured layout with icon/title/description */
  structured?: boolean;
}

const shadows: Record<CardShadow, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

export function Card({
  ref,
  padding = 'md',
  shadow = 'none',
  hover = false,
  variant = 'default',
  icon,
  title,
  subtitle,
  description,
  structured = false,
  className,
  children,
  ...props
}: CardProps) {
  const cardStyles = cn(cardVariants({ variant, padding, hover }), shadows[shadow], className);

  // If using structured layout with icon/title/description
  if (structured || icon || title) {
    return (
      <div ref={ref} className={cardStyles} {...props}>
        <div className="flex items-start gap-4">
          {icon && (
            <div className="from-brand-500/20 to-brand-500/5 text-brand-500 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
              {icon}
            </div>
          )}
          {(title || subtitle) && (
            <div className="min-w-0 flex-1">
              {title && <h3 className="text-foreground text-base font-semibold">{title}</h3>}
              {subtitle && (
                <p className="text-foreground-subtle mt-0.5 text-xs font-medium">{subtitle}</p>
              )}
            </div>
          )}
        </div>
        {description && (
          <div className="mt-4">
            <p className="text-foreground-muted text-sm leading-relaxed">{description}</p>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={cardStyles} {...props}>
      {children}
    </div>
  );
}

// Card sub-components with refined spacing
interface CardSubComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ref'> {
  ref?: Ref<HTMLDivElement>;
}

interface CardTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'ref'> {
  ref?: Ref<HTMLHeadingElement>;
}

interface CardTextProps extends Omit<HTMLAttributes<HTMLParagraphElement>, 'ref'> {
  ref?: Ref<HTMLParagraphElement>;
}

export function CardHeader({ ref, className, ...props }: CardSubComponentProps) {
  return <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />;
}

export function CardTitle({ ref, className, ...props }: CardTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn('text-foreground text-base leading-tight font-black tracking-tight', className)}
      {...props}
    />
  );
}

export function CardByline({ ref, className, ...props }: CardTextProps) {
  return (
    <p
      ref={ref}
      className={cn('text-foreground-subtle mt-0.5 text-xs font-medium', className)}
      {...props}
    />
  );
}

export function CardDescription({ ref, className, ...props }: CardTextProps) {
  return (
    <p
      ref={ref}
      className={cn('text-foreground-muted mt-1.5 text-sm leading-relaxed', className)}
      {...props}
    />
  );
}

export function CardContent({ ref, className, ...props }: CardSubComponentProps) {
  return <div ref={ref} className={cn('mt-4', className)} {...props} />;
}

export function CardFooter({ ref, className, ...props }: CardSubComponentProps) {
  return (
    <div
      ref={ref}
      className={cn('border-border mt-4 flex items-center border-t pt-4', className)}
      {...props}
    />
  );
}

export default Card;
