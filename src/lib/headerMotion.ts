export function headerMotionTiming(): KeyframeAnimationOptions {
  return {
    duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    fill: 'both',
  };
}
