import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()
  );
});

for (const width of [390, 1440]) {
  test(`Header search expands, resizes results and reverses at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
    await page.goto('/');
    const trigger = page.locator('.search-trigger');
    const modal = page.locator('.search-modal');
    const panel = modal.locator('.search-panel');
    const input = modal.locator('input');
    await trigger.click();
    await expect(input).toBeFocused();
    const opening = await panel.evaluate((element) => {
      const animation = element.getAnimations()[0];
      animation.pause();
      animation.currentTime = 200;
      const result = {
        duration: animation.effect!.getTiming().duration,
        easing: animation.effect!.getTiming().easing,
        clip: getComputedStyle(element).clipPath,
        opacity: Number(getComputedStyle(element).opacity),
        width: element.getBoundingClientRect().width,
        top: element.getBoundingClientRect().top,
        headerBottom: document.querySelector('body > header')!.getBoundingClientRect().bottom,
      };
      animation.play();
      return result;
    });
    expect(opening.duration).toBe(800);
    expect(opening.easing).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
    expect(opening.opacity).toBeGreaterThan(0);
    expect(opening.opacity).toBeLessThan(1);
    expect(opening.clip).not.toBe('none');
    expect(opening.top).toBeCloseTo(opening.headerBottom, 0);
    expect(opening.width).toBeGreaterThan(width - 30);
    await expect(page.locator('body > header .hdr-menu-surface')).toHaveCSS('opacity', '1');
    await input.fill('开放权重');
    await expect(modal.locator('a[href*="open-weights"]')).toBeVisible();
    await panel.evaluate((element) => Promise.all(element.getAnimations().map((a) => a.finished)));
    await input.fill('FireStone');
    await expect.poll(() => modal.locator('.search-result').count()).toBeGreaterThan(1);
    await panel.evaluate((element) => Promise.all(element.getAnimations().map((a) => a.finished)));
    const expandedHeight = (await panel.boundingBox())!.height;
    await input.fill('');
    await expect(modal.locator('.search-result')).toHaveCount(0);
    const heightTransition = await panel.evaluate((element) => {
      const animation = element.getAnimations().find((animation) =>
        (animation.effect as KeyframeEffect).getKeyframes().some((frame) => 'height' in frame)
      )!;
      animation.pause();
      animation.currentTime = 0;
      const start = element.getBoundingClientRect().height;
      animation.currentTime = 200;
      const middle = element.getBoundingClientRect().height;
      animation.currentTime = 600;
      const end = element.getBoundingClientRect().height;
      animation.play();
      return { start, middle, end };
    });
    expect(heightTransition.middle).toBeLessThan(heightTransition.start);
    expect(heightTransition.middle).toBeGreaterThan(heightTransition.end);
    await panel.evaluate((element) => Promise.all(element.getAnimations().map((a) => a.finished)));
    expect((await panel.boundingBox())!.height).toBeLessThan(expandedHeight);
    expect((await panel.boundingBox())!.y + (await panel.boundingBox())!.height).toBeLessThan(800);
    await page.screenshot({ path: `test-results/search-${width}.png` });

    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    // A stale close completion must not hide a reopened dropdown.
    await page.keyboard.press('Control+k');
    await expect(input).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await panel.evaluate((element) => Promise.all(element.getAnimations().map((a) => a.finished)));
    await expect(modal).toBeVisible();
    await modal.locator('.search-backdrop').click({ position: { x: 10, y: 700 } });
    await expect(modal).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await expect(page.locator('main').first()).not.toHaveAttribute('inert');
    await page.emulateMedia({ colorScheme: 'dark' });
    await trigger.click();
    await expect(input).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(modal.locator('button[data-search-close]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await expect(page.locator('body > header .hdr-menu-surface')).toHaveCSS('opacity', '1');
    const colors = await panel.evaluate((element) => ({
      panel: getComputedStyle(element).backgroundColor,
      header: getComputedStyle(document.querySelector('body > header .hdr-menu-surface')!).backgroundColor,
    }));
    expect(colors.panel).toBe(colors.header);
    await page.screenshot({ path: `test-results/search-dark-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });
}

test('mobile search fits a shrinking or panned visual viewport and switches with navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/sparkforge/');
  const header = page.locator('body > header');
  const trigger = header.locator('.search-trigger');
  const hamburger = header.locator('.hdr-hamburger');
  const input = page.locator('.search-input');
  await hamburger.click();
  await trigger.click();
  await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toBeFocused();
  await input.fill('FireStone');
  await expect.poll(() => page.locator('.search-result').count()).toBeGreaterThan(1);
  // Simulate iOS visual-only keyboard resizing without shrinking the layout viewport.
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
    Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 40 });
    viewport.dispatchEvent(new Event('resize'));
    viewport.dispatchEvent(new Event('scroll'));
  });
  const geometry = await page.evaluate(() => {
    const input = document.querySelector('.search-input')!.getBoundingClientRect();
    const panel = document.querySelector('.search-panel')!.getBoundingClientRect();
    const results = document.querySelector('.search-results')!;
    return {
      inputTop: input.top,
      inputBottom: input.bottom,
      panelBottom: panel.bottom,
      scrolls: results.scrollHeight > results.clientHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(geometry.inputTop).toBeGreaterThanOrEqual(40);
  expect(geometry.inputBottom).toBeLessThan(400);
  expect(geometry.panelBottom).toBeLessThan(400);
  expect(geometry.scrolls).toBe(true);
  expect(geometry.overflow).toBe(false);
  await page.screenshot({ path: 'test-results/search-keyboard-viewport.png' });
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Reflect.deleteProperty(viewport, 'height');
    Reflect.deleteProperty(viewport, 'offsetTop');
    viewport.dispatchEvent(new Event('resize'));
  });
  await page.setViewportSize({ width: 390, height: 390 });
  expect((await page.locator('.search-panel').boundingBox())!.height).toBeLessThan(320);
  await hamburger.click();
  await expect(page.locator('.search-modal')).toBeHidden();
  await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(header.locator('.mobile-menu-panel')).toBeHidden();
});

test('glass social buttons retain independent stagger and hover transforms', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const button = page.locator('.hdr-hamburger');
  await button.click();
  const social = page.locator('.mobile-menu-social');
  expect(await social.count()).toBeGreaterThan(1);
  const timing = await social.evaluateAll((elements) =>
    elements.map((element) => {
      const animation = element.getAnimations()[0];
      return animation.effect!.getTiming();
    })
  );
  for (let index = 0; index < timing.length; index++) {
    expect(timing[index].duration).toBe(600);
    if (index) expect(timing[index].delay - timing[index - 1].delay).toBeCloseTo(75);
  }
  await social
    .last()
    .evaluate((element) => Promise.all(element.getAnimations().map((a) => a.finished)));
  await social.first().locator('a').hover();
  await expect(social.first().locator('a')).not.toHaveCSS('transform', 'none');
  await button.click();
  expect(
    await social
      .first()
      .evaluate((el) => el.getAnimations().some((a) => !(a instanceof CSSAnimation)))
  ).toBe(true);
  await button.click();
  await expect(page.locator('.mobile-menu-panel')).toBeVisible();
  await button.click();
  await expect(page.locator('.mobile-menu-panel')).toBeHidden();
});
