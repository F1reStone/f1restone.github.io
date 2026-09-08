export function headerMotionTiming(): KeyframeAnimationOptions {
  return {
    duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    fill: 'both',
  };
}

export function animateHeaderSurface(
  header: HTMLElement,
  attribute: 'data-menu-expanded' | 'data-search-expanded',
  opening: boolean
) {
  const surface = header.querySelector<HTMLElement>('.hdr-menu-surface');
  const opacity = surface ? getComputedStyle(surface).opacity : '0';
  header.toggleAttribute(attribute, opening);
  if (!surface) return;
  surface.getAnimations().forEach((animation) => animation.cancel());
  const expanded = header.matches('[data-menu-expanded], [data-search-expanded]');
  const animation = surface.animate(
    [{ opacity }, { opacity: expanded ? '1' : '0' }],
    headerMotionTiming()
  );
  void animation.finished.then(
    () => animation.cancel(),
    () => {}
  );
}
