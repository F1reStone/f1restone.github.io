import { heroLogoFieldDefaults, type HeroLogoFieldOptions } from './types';
import type { createLogoField } from './renderer';

class FirestoneLogoField extends HTMLElement {
  private scene?: ReturnType<typeof createLogoField>;
  private abort?: AbortController;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private frame = 0;
  private previousTime = 0;
  private visible = true;
  private animated = true;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  async connectedCallback() {
    if (this.abort) return;
    const abort = new AbortController();
    this.abort = abort;
    const { signal } = abort;
    this.dataset.renderer = 'fallback';
    this.dataset.running = 'false';
    try {
      const { createLogoField } = await import('./renderer');
      if (signal.aborted) return;
      const options: HeroLogoFieldOptions = {
        ...heroLogoFieldDefaults,
        ...JSON.parse(this.dataset.options || '{}'),
      };
      this.animated = Number.isFinite(options.speed) && options.speed > 0;
      this.scene = createLogoField(this, options);
      this.scene.resize();
      this.dataset.renderer = 'webgl';
      this.resizeObserver = new ResizeObserver(() => this.scene?.resize());
      this.resizeObserver.observe(this);
      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.updateMotion();
      });
      this.intersectionObserver.observe(this);
      window.addEventListener('firestone-effects-change', this.updateMotion, { signal });
      document.addEventListener('visibilitychange', this.updateMotion, { signal });
      this.reducedMotion.addEventListener('change', this.updateMotion, { signal });
      this.addEventListener(
        'firestone-hero-progress',
        (event) => {
          const progress = (event as CustomEvent<{ progress: number }>).detail?.progress;
          if (
            Number.isFinite(progress) &&
            !this.reducedMotion.matches &&
            document.documentElement.dataset.effectHero === 'dynamic'
          ) {
            this.scene?.setProgress(progress);
          }
        },
        { signal }
      );
      this.scene.canvas.addEventListener(
        'webglcontextlost',
        (event) => {
          event.preventDefault();
          this.stop();
          this.dataset.renderer = 'fallback';
          if (this.scene) this.scene.canvas.style.visibility = 'hidden';
        },
        { signal }
      );
      this.scene.canvas.addEventListener(
        'webglcontextrestored',
        () => {
          this.scene?.resize();
          if (this.scene) this.scene.canvas.style.visibility = '';
          this.dataset.renderer = 'webgl';
          this.updateMotion();
        },
        { signal }
      );
      this.updateMotion();
    } catch (error) {
      this.scene?.dispose();
      this.scene = undefined;
      console.warn('Hero light trails are using the static fallback.', error);
    }
  }

  disconnectedCallback() {
    this.stop();
    this.abort?.abort();
    this.abort = undefined;
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.scene?.dispose();
    this.scene = undefined;
  }

  private stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.previousTime = 0;
    this.dataset.running = 'false';
  }

  private updateMotion = () => {
    const dynamic = document.documentElement.dataset.effectHero === 'dynamic';
    if (
      !dynamic ||
      !this.animated ||
      this.reducedMotion.matches ||
      !this.visible ||
      document.hidden ||
      this.dataset.renderer !== 'webgl'
    ) {
      this.stop();
      return;
    }
    if (this.frame) return;
    this.dataset.running = 'true';
    this.frame = requestAnimationFrame(this.tick);
  };

  private tick = (time: number) => {
    const delta = this.previousTime ? Math.min((time - this.previousTime) / 1000, 0.05) : 0;
    this.previousTime = time;
    this.scene?.advance(delta);
    this.frame = requestAnimationFrame(this.tick);
  };
}

if (!customElements.get('firestone-logo-field')) {
  customElements.define('firestone-logo-field', FirestoneLogoField);
}
