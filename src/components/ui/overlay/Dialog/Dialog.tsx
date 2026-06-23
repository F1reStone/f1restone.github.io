import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import Icon from '../../primitives/Icon/Icon.astro';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  className,
  children,
  footer,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!panelRef.current) return [];
    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => !el.hasAttribute('disabled'));
  }, []);

  // Body scroll lock and focus management on open/close
  useEffect(() => {
    if (open) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.classList.add('overflow-hidden');

      // Focus first focusable element after render
      requestAnimationFrame(() => {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      });
    } else {
      document.body.classList.remove('overflow-hidden');
      previousActiveElementRef.current?.focus();
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open, getFocusableElements]);

  // Focus trap and Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, getFocusableElements]);

  if (!open) return null;

  const titleId = title ? 'dialog-title' : undefined;
  const descriptionId = description ? 'dialog-description' : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {/* Backdrop */}
      {/* FireStone: [Inject the standard Liquid Glass backdrop and custom easing] */}
      <div
        className="fixed inset-0 bg-background/40 backdrop-blur-md opacity-100 transition-opacity duration-300 ease-[var(--ease-default)]"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog Panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div
          ref={panelRef}
          className={cn(
            'relative w-full',
            sizes[size],
            'bg-background/80 rounded-3xl border border-border/50 shadow-2xl backdrop-blur-lg',
            'scale-100 opacity-100 transition-all duration-300 ease-[var(--ease-default)]',
            className
          )}
        >
          {/* Close Button */}
          <button
            type="button"
            className={cn(
              'absolute top-4 right-4 p-1.5 rounded-full text-foreground-muted dialog-close-btn',
              'hover:bg-foreground hover:text-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            onClick={onClose}
            aria-label="关闭对话框"
          >
            <Icon name="x" class="w-5 h-5" />
          </button>

          {/* Header */}
          {(title || description) && (
            <div className="p-6 pb-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg font-bold tracking-tight text-foreground pr-8"
                >
                  {title}
                </h2>
              )}
              {/* FireStone: [Align React Dialog typography with the refined 13px/leading-relaxed standard] */}
              {description && (
                <p
                  id={descriptionId}
                  className="mt-1.5 text-xs leading-relaxed text-foreground-muted"
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Dialog;
