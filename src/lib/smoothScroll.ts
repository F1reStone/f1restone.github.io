import Lenis from 'lenis';

const SCROLL_LOCK_CLASS = 'firestone-scroll-locked';

function normalisePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Initialise Lenis once per document and expose the page-scroll controls used
 * by dialogs, the search overlay, the mobile menu, and back-to-top.
 *
 * Lenis scrolls the native document (it does not transform a wrapper), so
 * `position: sticky`, IntersectionObserver, and the existing `window.scrollY`
 * consumers keep working. Overlays request a ref-counted lock from this
 * controller so stacked dialogs do not unlock the page early.
 */
export function initSmoothScroll(): void {
  if (typeof window === 'undefined' || window.__firestoneScroll) return;

  let lenis: Lenis | null = null;
  let lockCount = 0;

  try {
    lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      // Touch stays native: Lenis recommends this for iOS stability, and the
      // page's overlays already manage their own touch behaviour.
      syncTouch: false,
      autoResize: true,
      anchors: false,
      respectReducedMotion: true,
    });
  } catch {
    // Smooth scrolling is an enhancement; native scrolling remains usable.
    lenis = null;
  }

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
  // click lock run before the scroll starts.
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

  window.__firestoneScroll = api;
}
