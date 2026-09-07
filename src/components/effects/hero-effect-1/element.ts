import { heroEffect1Defaults, type HeroEffect1Options } from './types';
import type { createHeroEffect1 } from './renderer';

class FirestoneHeroEffect1 extends HTMLElement {
  private scene?: Awaited<ReturnType<typeof createHeroEffect1>>;
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
      const { createHeroEffect1 } = await import('./renderer');
      if (signal.aborted) return;
      const options: HeroEffect1Options = {
        ...heroEffect1Defaults,
        ...JSON.parse(this.dataset.options || '{}'),
      };
      this.animated = options.morphSpeed > 0 || options.rotationSpeed > 0;
      this.scene = await createHeroEffect1(this, options, signal, () => {
        this.stop();
        this.dataset.renderer = 'fallback';
      });
      if (signal.aborted) {
        this.scene.dispose();
        return;
      }
      this.scene.resize();
      this.dataset.renderer = 'webgpu';
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
      this.updateMotion();
    } catch (error) {
      this.scene?.dispose();
      this.scene = undefined;
      if (signal.aborted) return;
      console.warn('Hero gradient is using the static fallback.', error);
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
      this.dataset.renderer !== 'webgpu'
    ) {
      this.stop();
      return;
    }
    if (this.frame) return;
    this.dataset.running = 'true';
    this.frame = requestAnimationFrame(this.tick);
  };

  private tick = (time: number) => {
    const delta = this.previousTime ? Math.max(0, (time - this.previousTime) / 1000) : 0;
    this.previousTime = time;
    this.scene?.advance(delta);
    this.frame = requestAnimationFrame(this.tick);
  };
}

if (!customElements.get('firestone-hero-effect-1')) {
  customElements.define('firestone-hero-effect-1', FirestoneHeroEffect1);
}
