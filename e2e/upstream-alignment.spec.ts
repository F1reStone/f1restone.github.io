import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.env.SITE_TEST_DIST || 'dist');

test.beforeEach(async ({ page }) => {
  // Exercise the facade without relying on third-party uptime or loading a real player.
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

for (const width of [390, 1440]) {
  test(`YouTube remains a facade until keyboard activation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/components/');
    const embed = page.locator('.yt-embed').first();
    await expect(embed.locator('iframe')).toHaveCount(0);
    await embed.scrollIntoViewIfNeeded();
    await embed.locator('xpath=ancestor::section[1]').screenshot({ path: `test-results/alignment-patterns-${width}.png`, style: '[data-locale-fallback], #consent-banner, .notice-stack { visibility: hidden !important; }' });
    const button = embed.getByRole('button');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(embed.locator('iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/QONgJurkigk?autoplay=1');
    await expect(embed.locator('iframe')).toHaveAttribute('title', 'YouTube embed preview');
    await expect(button).toHaveCount(0);
    expect(await embed.evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(width);
  });
}

test('YouTube offers a usable no-JavaScript watch link', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('http://127.0.0.1:4399/components/');
  await expect(page.locator('.yt-embed a')).toBeVisible();
  await expect(page.locator('.yt-embed a')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=QONgJurkigk');
  await context.close();
});

test('single project media keeps its natural ratio and mobile TOC unfolds', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/firestone-website/');
  const images = page.locator('[data-carousel-slide] img');
  if (await images.count() === 1) {
    await expect(images.first()).toHaveCSS('aspect-ratio', /^auto(?:\s|$)/);
    const ratio = await images.first().evaluate(img => {
      const rect = img.getBoundingClientRect();
      return { rendered: rect.width / rect.height, natural: Number(img.getAttribute('width')) / Number(img.getAttribute('height')) };
    });
    expect(ratio.rendered).toBeCloseTo(ratio.natural, 1);
  }
  // The website project has only one heading and correctly omits its TOC.
  await page.goto('/projects/sparkforge/');
  const toc = page.locator('details[data-toc]').first();
  await expect(toc).toBeVisible();
  await expect(toc).not.toHaveAttribute('open');
  await toc.locator('summary').click();
  await expect(toc).toHaveAttribute('open');
  await expect(toc.locator('[data-toc-main]')).toHaveCSS('height', /^(?!0px).+/);
  await toc.locator('a').first().click();
  await expect(toc).not.toHaveAttribute('open');
});

test('manifest and favicon variants point at generated files', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  for (const icon of manifest.icons) expect(existsSync(resolve(root, icon.src.slice(1)))).toBe(true);
  for (const file of ['favicon.ico', 'favicon-32x32.png', 'apple-touch-icon.png']) {
    expect((await request.get(`/${file}`)).ok()).toBe(true);
  }
});

test('MDX helpers preserve requested locale and mixed galleries remain keyboard operable', async ({ page }) => {
  test.skip(!existsSync(resolve(root, 'en-US/blog/as260-patterns/index.html')), 'Isolated bilingual fixture');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en-US/blog/as260-patterns/');
  await expect(page.locator('.test-post-link')).toHaveAttribute('href', /\/en-US\/blog\/as260-check-en\/?$/);
  await expect(page.locator('.yt-play')).toHaveAccessibleName('Play video: MDX video fixture');
  const video = page.locator('[data-gallery-slide] video');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).toHaveAttribute('poster', /\/_astro\/.+/);
  const imageSlide = page.locator('[data-slide-type="image"]').first();
  await imageSlide.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Media lightbox' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(imageSlide).toBeFocused();
});

test('opt-in blog CTA and Footer newsletter render localized controls', async ({ page }) => {
  test.skip(!existsSync(resolve(root, 'en-US/blog/as260-patterns/index.html')), 'Isolated bilingual fixture');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en-US/blog/as260-patterns/');
  const newsletter = page.locator('footer .newsletter-form');
  await expect(newsletter.getByRole('button', { name: 'Subscribe', exact: true })).toBeDisabled();
  await expect(newsletter.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explore the project', exact: true })).toBeVisible();
  await newsletter.scrollIntoViewIfNeeded();
  const notice = page.locator('[data-locale-fallback]');
  if (await notice.count()) await notice.getByRole('button').first().click();
  expect(await newsletter.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await newsletter.screenshot({ path: 'test-results/alignment-footer-mobile.png', style: '[data-locale-fallback], #consent-banner, .notice-stack { visibility: hidden !important; }' });
});
