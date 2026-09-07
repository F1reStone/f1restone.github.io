let movement: Animation | undefined;

// Measure only on visibility changes; the browser animates the displacement.
export function updateBannerLayout(change: () => void) {
  const notice = document.querySelector<HTMLElement>('[data-locale-fallback]:not([hidden])');
  if (!notice || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    change();
    return;
  }
  const previousTop = notice.getBoundingClientRect().top;
  movement?.cancel();
  change();
  const displacement = previousTop - notice.getBoundingClientRect().top;
  if (Math.abs(displacement) < 1) return;
  const style = getComputedStyle(notice);
  const duration = style.getPropertyValue('--banner-reflow-duration').trim();
  movement = notice.animate([{ translate: `0 ${displacement}px` }, { translate: '0 0' }], {
    // Production CSS can shorten 450ms to .45s; Web Animations expects milliseconds.
    duration: parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000) || 450,
    easing: style.getPropertyValue('--ease-default').trim() || 'ease',
  });
}
