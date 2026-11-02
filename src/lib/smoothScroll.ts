import type Lenis from 'lenis';

const SCROLL_LOCK_CLASS = 'firestone-scroll-locked';

type SmoothScrollSetting = 'off' | 'on';
type LenisConstructor = (typeof import('lenis'))['default'];

function normalisePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isLenisAllowed(): boolean {
  return document.documentElement.dataset.effectSmoothScroll === 'on' && !prefersReducedMotion();
}

/**
 * Set up the page-scroll API used by dialogs, search, the mobile menu, and
 * back-to-top. Lenis itself is loaded lazily and only when the performance
 * gate in BaseLayout allows it.
 *
 * Lenis smooths wheel/trackpad input. On touch devices it adds non-passive
 * touch listeners and a continuous rAF loop without smoothing native touch
 * scrolling, so those devices keep native scrolling and skip the library
 * entirely unless the user explicitly enables it in the motion settings.
 */
export function initSmoothScroll(): void {
  if (typeof window === 'undefined' || window.__firestoneScroll) return;

  let lenis: Lenis | null = null;
  let lockCount = 0;
  let generation = 0;

  const disableLenis = (): void => {
    generation += 1;
    if (!lenis) return;
    lenis.destroy();
    lenis = null;
  };

  const enableLenis = async (): Promise<void> => {
    if (lenis || !isLenisAllowed()) return;

    const token = ++generation;
    let LenisClass: LenisConstructor;
    try {
      LenisClass = (await import('lenis')).default;
    } catch {
      return;
    }

    if (token !== generation || lenis || !isLenisAllowed()) return;

    try {
      lenis = new LenisClass({
        autoRaf: true,
        lerp: 0.1,
        smoothWheel: true,
        // Touch stays native. Lenis' syncTouch mode has a history of mobile
        // jitter and pull-to-refresh conflicts; this site does not use it.
        syncTouch: false,
        autoResize: true,
        anchors: false,
        respectReducedMotion: true,
      });
      if (lockCount > 0) lenis.stop();
    } catch {
      // Smooth scrolling is an enhancement; native scrolling remains usable.
      lenis = null;
    }
  };

  const scrollTo: FirestoneScrollApi['scrollTo'] = (target, options = {}) => {
    if (lenis) {
      lenis.scrollTo(target, options);
      return;
    }

    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior });
    } else if (typeof target === 'string') {
      document.querySelector(target)?.scrollIntoView({ behavior, block: 'start' });
    } else {
      target.scrollIntoView({ behavior, block: 'start' });
    }
  };

  const lock = (): void => {
    lockCount += 1;
    if (lockCount !== 1) return;
    lenis?.stop();
    // Lock the root, not <body>: `body { overflow: hidden }` turns the body
    // into the scroll container and breaks sticky headers. `<html>` keeps the
    // document as the scrollport, so sticky positioning still resolves.
    document.documentElement.classList.add(SCROLL_LOCK_CLASS);
  };

  const unlock = (): void => {
    if (lockCount === 0) return;
    lockCount -= 1;
    if (lockCount !== 0) return;
    lenis?.start();
    document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
  };

  const api: FirestoneScrollApi = {
    scrollTo,
    lock,
    unlock,
    get isSmooth() {
      return Boolean(lenis && !lenis.prefersReducedMotion);
    },
  };

  // Own same-page hash navigation so the URL hash, the fixed-header offset
  // (`scroll-padding-top`), and Lenis' animation stay in sync. Lenis' built-in
  // anchor handler does not update the hash; doing it here also lets the TOC's
  // click lock run before the scroll starts. This stays active without Lenis
  // and falls back to native smooth scrolling.
  document.addEventListener('click', (event) => {
    if (lockCount > 0 || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = event
      .composedPath()
      .find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement);
    if (!anchor || anchor.hasAttribute('download')) return;
    if (anchor.target && anchor.target !== '_self') return;
    if (anchor.hasAttribute('data-no-smooth-scroll')) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (normalisePath(url.pathname) !== normalisePath(window.location.pathname)) return;
    if (!url.hash || url.hash === '#') return;

    let id: string;
    try {
      id = decodeURIComponent(url.hash.slice(1));
    } catch {
      return;
    }

    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    if (window.location.hash !== url.hash) {
      try {
        window.history.pushState(null, '', url.hash);
      } catch {
        // Some embedded contexts reject history updates; still perform the scroll.
      }
    }

    // Article blocks start offset by their reveal transform. Snap the
    // destination to its final position before Lenis measures it, otherwise
    // the heading lands one reveal-distance above the header offset.
    target.classList.add('reveal-instant');
    scrollTo(target);
  });

  window.addEventListener('firestone-effects-change', (event) => {
    const detail = (event as CustomEvent<{ smoothScroll?: SmoothScrollSetting }>).detail;
    if (detail?.smoothScroll === 'on') {
      void enableLenis();
    } else if (detail?.smoothScroll === 'off') {
      disableLenis();
    }
  });

  window.__firestoneScroll = api;

  if (isLenisAllowed()) void enableLenis();
}
