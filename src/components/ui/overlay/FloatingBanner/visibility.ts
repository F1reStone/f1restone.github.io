import { updateBannerLayout } from './stack';

const exits = new WeakMap<HTMLElement, { animation: Animation; finished: Promise<void> }>();

export function showFloatingBanner(banner: HTMLElement) {
  exits.get(banner)?.animation.cancel();
  exits.delete(banner);
  banner.inert = false;
  updateBannerLayout(() => {
    banner.hidden = false;
  });
  banner.classList.add('floating-banner--visible');
}

export function hideFloatingBanner(banner: HTMLElement): Promise<void> {
  const pending = exits.get(banner);
  if (pending) return pending.finished;
  if (banner.hidden) return Promise.resolve();
  const finish = () => {
    updateBannerLayout(() => {
      banner.hidden = true;
    });
    banner.classList.remove('floating-banner--visible', 'consent-banner--visible');
    banner.inert = false;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return Promise.resolve();
  }
  const style = getComputedStyle(banner);
  const duration = style.getPropertyValue('--transition-slow').trim();
  // Animate the painted state: the entrance animation may still be filling it.
  const animation = banner.animate(
    [
      { opacity: style.opacity, transform: style.transform },
      {
        opacity: 0,
        transform: `translate3d(0, ${style.getPropertyValue('--banner-offset').trim()}, 0)`,
      },
    ],
    {
      duration: parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000) || 300,
      easing: style.getPropertyValue('--ease-default').trim() || 'ease',
      fill: 'forwards',
    }
  );
  banner.inert = true;
  const finished = animation.finished.then(
    () => {
      if (exits.get(banner)?.animation !== animation) return;
      finish();
      exits.delete(banner);
      animation.cancel();
    },
    () => {}
  );
  exits.set(banner, { animation, finished });
  return finished;
}
