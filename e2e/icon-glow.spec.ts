import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`icon glow follows controls without changing their surface at ${width}px`, async ({ page }) => {
    await page.route('**/*', route =>
      new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()
    );
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.locator('#consent-decline-all').click();

    // Reuse a rendered Button's classes to exercise the actual SVG pointer policy.
    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('button.group')!;
      const fixture = document.createElement('div');
      fixture.id = 'glow-fixture';
      fixture.style.cssText = 'position:fixed;inset:100px 0 auto;z-index:9999;display:grid;gap:16px;padding:16px;background:var(--color-background)';
      const svg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12h16M12 4l8 8-8 8" /></svg>';
      for (const mode of ['control', 'icon', 'wrapper', 'disabled', 'link']) {
        const control = document.createElement(mode === 'link' ? 'a' : 'button');
        control.id = `glow-${mode}`;
        control.className = mode === 'link' ? 'hover-glow-icon' : button.className;
        if (mode === 'link') control.setAttribute('href', '#glow-fixture');
        control.innerHTML = `<span>Label ${mode}</span>${svg}`;
        if (mode === 'icon') control.querySelector('svg')!.classList.add('hover-glow-icon');
        else if (mode === 'wrapper') {
          const wrapper = document.createElement('span');
          wrapper.className = 'hover-glow-icon';
          wrapper.append(control.querySelector('svg')!);
          control.append(wrapper);
        } else control.classList.add('hover-glow-icon');
        if (mode === 'disabled') control.setAttribute('disabled', '');
        fixture.append(control);
      }
      document.body.append(fixture);
    });

    for (const mode of ['control', 'icon', 'wrapper', 'link']) {
      const control = page.locator(`#glow-${mode}`);
      const icon = control.locator('svg');
      if (mode !== 'link') await expect(icon).toHaveCSS('pointer-events', 'none');
      const surface = await control.evaluate(el => getComputedStyle(el).backgroundColor);
      // Hovering the label must activate the icon, even when the SVG cannot be hit.
      await control.locator('span').first().hover();
      await expect(icon).toHaveCSS('scale', '1.03');
      await expect(icon).toHaveCSS('filter', /10px/);
      await expect(control).toHaveCSS('filter', 'none');
      await expect(control).toHaveCSS('background-color', surface);
      await page.mouse.move(0, 0);
      await expect(icon).toHaveCSS('scale', '1');
      await control.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(control).toBeFocused();
      await expect(icon).toHaveCSS('scale', '1.03');
      await control.evaluate(el => (el as HTMLElement).blur());
    }

    const disabled = page.locator('#glow-disabled');
    const box = (await disabled.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(disabled.locator('svg')).toHaveCSS('scale', '1');
    await expect(disabled.locator('svg')).not.toHaveCSS('filter', /10px/);

    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await page.locator('#glow-control').hover();
    await expect(page.locator('#glow-control svg')).toHaveCSS('scale', 'none');
    await expect(page.locator('#glow-control svg')).toHaveCSS('transition-duration', '0s');
    await expect(page.locator('#glow-control svg')).toHaveCSS('filter', /10px/);
  });
}
