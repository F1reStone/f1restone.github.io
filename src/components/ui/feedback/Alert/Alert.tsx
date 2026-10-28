import { type HTMLAttributes, type Ref, type ReactNode, useState } from 'react';
import { t, defaultLocale, type Locale } from '@/i18n';
import { cn } from '@/lib/cn';
import {
  alertVariants,
  alertIconColors,
  alertAccentColors,
  type AlertVariants,
} from './alert.variants';

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ref' | 'title'> {
  locale?: Locale;
  ref?: Ref<HTMLDivElement>;
  variant?: NonNullable<AlertVariants['variant']>;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
}

const iconPaths: Record<string, string> = {
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01',
  success: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  warning:
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  error: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM15 9l-6 6M9 9l6 6',
};

export function Alert({
  locale = defaultLocale,
  ref,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className,
  children,
  ...rest
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hiding, setHiding] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setHiding(true);
    setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, 150);
  };

  return (
    <div
      ref={ref}
      className={cn(alertVariants({ variant }), hiding && 'scale-[0.98] opacity-0', className)}
      style={{ transition: 'opacity 150ms ease-out, transform 150ms ease-out' }}
      role="alert"
      {...rest}
    >
      <div className={cn('absolute top-0 bottom-0 left-0 w-1', alertAccentColors[variant])} />

      <div
        className={cn(
          'mt-0.5 shrink-0 drop-shadow-[0_0_8px_currentColor]',
          alertIconColors[variant]
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          {iconPaths[variant]
            .split('M')
            .filter(Boolean)
            .map((d, i) => (
              <path key={i} d={`M${d}`} />
            ))}
        </svg>
      </div>

      <div className="min-w-0 flex-1 pl-1">
        {title && <div className="text-foreground mb-1 text-lg font-bold">{title}</div>}
        <div className="text-foreground-muted text-sm leading-relaxed">{children}</div>
      </div>

      {dismissible && (
        <button
          type="button"
          className="text-foreground-muted hover:text-foreground focus-visible:text-foreground hover:bg-secondary -mt-1 -mr-1 shrink-0 rounded-md p-1 transition-colors"
          aria-label={t('common.dismiss', locale)}
          onClick={handleDismiss}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Alert;
