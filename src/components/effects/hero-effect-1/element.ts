import { heroEffect1Defaults, type HeroEffect1Options } from './types';
import type { createHeroEffect1 } from './renderer';

class FirestoneHeroEffect1 extends HTMLElement {
  private scene?: Awaited<ReturnType<typeof createHeroEffect1>>;
  private abort?: AbortController;
  private sceneAbort?: AbortController;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private options: HeroEffect1Options = heroEffect1Defaults;
  private frame = 0;
  private previousTime = 0;
  private visible = true;
  private animated = true;
  private dynamic?: boolean;
  private failed = false;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private portrait = window.matchMedia('(max-aspect-ratio: 1/1)');

  connectedCallback() {
    if (this.abort) return;
    this.abort = new AbortController();
    const { signal } = this.abort;
    this.dataset.running = 'false';
    try {
      this.options = {
        ...heroEffect1Defaults,
        ...JSON.parse(this.dataset.options || '{}'),
      };
    } catch {
      this.showFallback();
      return;
    }
    this.animated = this.options.morphSpeed > 0 || this.options.rotationSpeed > 0;
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.updateMotion();
    });
    this.intersectionObserver.observe(this);
    window.addEventListener('firestone-effects-change', this.updateMode, { signal });
    document.addEventListener('visibilitychange', this.updateMotion, { signal });
    this.reducedMotion.addEventListener('change', this.updateMode, { signal });
    this.portrait.addEventListener('change', this.updateFallback, { signal });
    this.updateMode();
  }

  disconnectedCallback() {
    this.abort?.abort();
    this.abort = undefined;
    this.disposeScene();
    this.intersectionObserver?.disconnect();
    this.removeFallback();
    this.dynamic = undefined;
    this.failed = false;
    this.visible = true;
  }

  private removeFallback() {
    this.querySelector('.hero-effect-1__fallback > picture')?.remove();
  }

  private showFallback() {
    this.dataset.renderer = 'fallback';
    const orientation = this.portrait.matches ? 'portrait' : 'landscape';
    const fallback = this.querySelector('.hero-effect-1__fallback');
    const current = fallback?.querySelector(':scope > picture');
    if (current?.classList.contains(`hero-effect-1__picture--${orientation}`)) return;
    const template = fallback?.querySelector<HTMLTemplateElement>(
      `template[data-hero-fallback="${orientation}"]`
    );
    current?.remove();
    // Template images stay inert until static mode or GPU failure needs them.
    if (template) fallback?.append(template.content.cloneNode(true));
  }

  private updateFallback = () => {
    if (this.dataset.renderer === 'fallback') this.showFallback();
  };

  private updateMode = () => {
    const dynamic =
      document.documentElement.dataset.effectHero === 'dynamic' && !this.reducedMotion.matches;
    if (this.dynamic !== dynamic) this.failed = false;
    this.dynamic = dynamic;
    if (!dynamic || this.failed) {
      this.disposeScene();
      this.showFallback();
      return;
    }
    this.removeFallback();
    if (!this.sceneAbort) void this.startScene();
    else this.updateMotion();
  };

  private async startScene() {
    const abort = new AbortController();
    this.sceneAbort = abort;
    const { signal } = abort;
    this.dataset.renderer = 'pending';
    try {
      if (!navigator.gpu) throw new Error('WebGPU unavailable');
      const { createHeroEffect1 } = await import('./renderer');
      if (signal.aborted) return;
      const scene = await createHeroEffect1(this, this.options, signal, () => {
        if (this.sceneAbort !== abort) return;
        this.failed = true;
        this.disposeScene();
        this.showFallback();
      });
      if (signal.aborted) {
        scene.dispose();
        return;
      }
      this.scene = scene;
      this.scene.resize();
      this.dataset.renderer = 'webgpu';
      this.resizeObserver = new ResizeObserver(() => this.scene?.resize());
      this.resizeObserver.observe(this);
      this.updateMotion();
    } catch (error) {
      if (signal.aborted) return;
      this.failed = true;
      this.disposeScene();
      this.showFallback();
      console.warn('Hero gradient is using the static fallback.', error);
    }
  }

  private disposeScene() {
    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.sceneAbort?.abort();
    this.sceneAbort = undefined;
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
    if (
      !this.dynamic ||
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
