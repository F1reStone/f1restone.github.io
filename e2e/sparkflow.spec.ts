import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route =>
    new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

for (const width of [390, 1440]) {
  test(`SparkFlow leads the library and supports keyboard interaction at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/components/');
    await page.locator('#consent-decline-all').click();
    const section = page.locator('#sparkflow');
    await expect(section.locator('button')).toHaveCount(7);
    expect(await section.evaluate(el => el.parentElement?.querySelector('section') === el)).toBe(true);
    await section.scrollIntoViewIfNeeded();
    expect(await section.evaluate(el => {
      const box = el.getBoundingClientRect();
      return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth;
    })).toBe(true);

    const text = section.getByRole('button', { name: 'Text glow', exact: true });
    await text.hover();
    await expect(text).toHaveCSS('text-shadow', /10px/);
    await text.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
    const hoverColor = await text.evaluate(el => getComputedStyle(el).color);
    await page.mouse.move(0, 0);
    await text.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(text).toBeFocused();
    await expect(text).toHaveCSS('color', hoverColor);
    await expect(text).toHaveCSS('text-shadow', /10px/);

    await page.evaluate(async () => {
      await document.fonts.ready;
      document.documentElement.dataset.effectVariableFont = 'on';
    });
    for (const name of ['Centered weight shift', 'Left aligned weight shift']) {
      const control = section.getByRole('button', { name, exact: true });
      const before = (await control.boundingBox())!;
      const weight = await control.evaluate(el => Number(getComputedStyle(el).fontWeight));
      await control.focus();
      await expect.poll(() => control.evaluate(el => Number(getComputedStyle(el).fontWeight))).toBeGreaterThan(weight);
      await control.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
      const after = (await control.boundingBox())!;
      expect(after.width).toBeCloseTo(before.width, 0);
      expect(after.x).toBeCloseTo(before.x, 0);
    }
    await section.screenshot({ path: `test-results/sparkflow-${width}.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(section.locator('.weight-shift')).toHaveCSS('transition-duration', '0s');
    await expect(text).toHaveCSS('text-shadow', 'none');
  });
}

test('Footer text and icons respond to keyboard focus in both themes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#consent-decline-all').click();
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, theme);
    for (const selector of ['footer .footer-group-link:has(svg)', 'footer .footer-legal-links a:has(svg)']) {
      const control = page.locator(selector).first();
      await control.hover();
      // Font/theme initialization can replace transitions; wait for the final state.
      await expect.poll(() => control.evaluate(el =>
        el.getAnimations().filter(a => a.playState === 'running').length
      )).toBe(0);
      const color = await control.evaluate(el => getComputedStyle(el).color);
      await page.mouse.move(0, 0);
      await control.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(control).toBeFocused();
      await expect(control).toHaveCSS('color', color);
      await expect(control.locator('svg')).toHaveCSS('filter', /10px/);
    }
  }
});
