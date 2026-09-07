import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(process.env.SITE_TEST_DIST || 'dist');
const english = existsSync(join(root, 'en-US/index.html'));
const exists = (url: string) => {
  const pathname = decodeURIComponent(new URL(url, 'https://fire-stone.co').pathname);
  return existsSync(join(root, pathname)) || existsSync(join(root, pathname, 'index.html'));
};

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()
  );
});

test('generated SEO describes real pages and assets', async ({ page }) => {
  const documents = readdirSync(root, { recursive: true })
    .filter((file): file is string => typeof file === 'string' && file.endsWith('.html'))
    .map((file) => ({ file, html: readFileSync(join(root, file), 'utf8') }));
  const results = await page.evaluate(
    (documents) =>
      documents.map(({ file, html }) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const attr = (selector: string, key: string) =>
          doc.querySelector(selector)?.getAttribute(key);
        return {
          file,
          title: doc.title,
          description: attr('meta[name="description"]', 'content'),
          canonical: attr('link[rel="canonical"]', 'href'),
          canonicals: doc.querySelectorAll('link[rel="canonical"]').length,
          language: doc.documentElement.lang,
          fallback: doc.documentElement.hasAttribute('data-locale-fallback-source'),
          ogLocale: attr('meta[property="og:locale"]', 'content'),
          noindex: attr('meta[name="robots"]', 'content')?.includes('noindex'),
          image: attr('meta[property="og:image"]', 'content'),
          alternates: [...doc.querySelectorAll('link[hreflang]')].map((el) =>
            el.getAttribute('href')!
          ),
          schemas: [...doc.querySelectorAll('script[type="application/ld+json"]')].map((el) =>
            JSON.parse(el.textContent || '{}')
          ),
          links: [...doc.querySelectorAll('a[href]')]
            .map((el) => el.getAttribute('href')!)
            .filter((href) => href.startsWith('/') && !href.startsWith('//')),
        };
      }),
    documents
  );
  const sitemap = readFileSync(join(root, 'sitemap-0.xml'), 'utf8');
  const failures: string[] = [];
  for (const result of results) {
    const check = (value: unknown, message: string) => {
      if (!value) failures.push(`${result.file}: ${message}`);
    };
    check(result.title && result.description, 'missing title/description');
    check(
      result.canonicals === 1 && result.canonical?.startsWith('https://fire-stone.co/'),
      'invalid canonical'
    );
    check(result.ogLocale === result.language.replace('-', '_'), 'wrong OG locale');
    check(result.image && exists(result.image), `missing sharing image ${result.image}`);
    check(!result.image?.endsWith('.svg'), 'sharing image must be raster');
    const pageUrl = new URL(
      '/' + result.file.replaceAll('\\', '/').replace(/index\.html$/, ''),
      'https://fire-stone.co/'
    ).href;
    if (result.noindex)
      check(!sitemap.includes(`<loc>${pageUrl}</loc>`), 'noindex page in sitemap');
    else check(sitemap.includes(`<loc>${result.canonical}</loc>`), 'canonical absent from sitemap');
    for (const url of result.alternates) check(exists(url), `missing language alternate ${url}`);
    const crumbs = result.schemas.filter((schema) => schema['@type'] === 'BreadcrumbList');
    check(crumbs.length <= 1, 'duplicate breadcrumb schema');
    for (const schema of crumbs) {
      for (const item of schema.itemListElement)
        check(exists(item.item), `missing breadcrumb target ${item.item}`);
      check(
        new URL(schema.itemListElement.at(-1).item).pathname.replace(/\/$/, '') ===
          new URL(result.canonical!).pathname.replace(/\/$/, ''),
        'breadcrumb ends on another page'
      );
    }
    if (!result.noindex || result.fallback)
      for (const href of result.links) check(exists(href), `broken internal link ${href}`);
  }
  expect(failures).toEqual([]);
});

test('shared views preserve desktop, mobile and no-JavaScript content', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('firestone-hero-effect-1 canvas')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/as260-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/open-weights-and-american-ai-leadership/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/as260-article-mobile.png' });

  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    await context.route('**/*', (route) =>
      new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()
    );
    const staticPage = await context.newPage();
    await staticPage.goto('http://127.0.0.1:4399/');
    await expect(staticPage.locator('h1')).toBeVisible();
    const image = staticPage.locator('.hero-effect-1__picture--portrait img');
    await expect(image).toBeVisible();
    expect(await image.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});

test('mobile navigation, search and theme controls work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.hdr-hamburger').click();
  await expect(page.locator('.hdr-hamburger')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hdr-hamburger')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.search-trigger').click();
  await page.locator('.search-modal input').fill('开放权重');
  await expect(page.locator('.search-modal a[href*="open-weights"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.ttg-trigger').first().click();
  await page.locator('[data-mode="light"]').first().click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.screenshot({ path: 'test-results/as260-mobile.png' });
  expect(errors).toEqual([]);
});

test('article breadcrumbs preserve CJK labels and reading time', async ({ page }) => {
  await page.goto('/blog/open-weights-and-american-ai-leadership/');
  const breadcrumb = page.locator('nav[aria-label="面包屑导航"]');
  await expect(breadcrumb).toContainText('开放权重与美国 AI 领导力');
  await expect(breadcrumb).not.toContainText('%E');
  await expect(page.locator('body')).not.toContainText('预计阅读时间 1 分钟');
});

test('English chrome and untranslated-content notice are connected', async ({ page }) => {
  test.skip(!english, 'English routes are intentionally disabled in the production config.');
  await page.goto('/en-US/');
  await expect(page.locator('[data-locale-fallback]')).toHaveAttribute('lang', 'en-US');
  const chrome = await page.locator('body > header, body > footer').evaluateAll((elements) =>
    elements.map((element) => {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.lang-wrapper, script, style').forEach((el) => el.remove());
      return clone.textContent;
    })
  );
  expect(chrome.join('')).not.toMatch(/[\u4e00-\u9fff]/);
  await expect(page.locator('.search-trigger').first()).toHaveAttribute('aria-label', 'Search');
  await page.goto('/en-US/blog/open-weights-and-american-ai-leadership/');
  await expect(page.locator('[data-locale-fallback]')).toBeVisible();
  await expect(page.locator('[data-locale-fallback]')).toContainText(
    'not available in your current language'
  );
  await expect(page.locator('[data-locale-fallback] a')).toHaveAttribute('href', '/en-US');
  await page.locator('[data-dismiss-fallback]').click();
  await expect(page.locator('[data-locale-fallback]')).toBeHidden();
});

test('consent and effect settings use the active language', async ({ page }) => {
  await page.goto(english ? '/en-US/' : '/');
  if (english) await page.locator('[data-dismiss-fallback]').click();
  const banner = page.locator('#consent-banner');
  test.skip((await banner.count()) === 0, 'Consent UI is disabled by build configuration.');
  await expect(banner).toBeVisible();
  if (english) await expect(banner).not.toContainText(/[\u4e00-\u9fff]/);
  await page.locator('#consent-decline-all').click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('cookie-consent')!).categories.analytics
    )
  ).toBe(false);
  await page.locator('footer [data-consent-settings-trigger]').first().click();
  await expect(page.locator('#consent-settings')).toBeVisible();
  if (english) await expect(page.locator('#consent-settings')).not.toContainText(/[\u4e00-\u9fff]/);
  await expect(page.locator('#consent-settings [data-dialog-close]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#consent-settings')).toBeHidden();
  await page.locator('footer [data-dynamic-effects-trigger]').first().click();
  await expect(page.locator('#dynamic-effects-settings')).toBeVisible();
  if (english)
    await expect(page.locator('#dynamic-effects-settings')).not.toContainText(/[\u4e00-\u9fff]/);
});

test('prefixed fallback pages render without JavaScript and stack above Cookie consent', async ({
  page,
  browser,
}) => {
  test.skip(!english, 'Only enabled locales receive fallback routes.');
  for (const source of [
    '/blog/open-weights-and-american-ai-leadership/',
    '/projects/sparkforge/',
    '/legal/privacy-policy/',
    '/components/',
    '/blog/tag/人工智能/',
    '/about/',
    '/ai/',
  ]) {
    const response = await page.goto('/en-US' + source);
    expect(response?.status(), source).toBe(200);
    await expect(page.locator('[data-locale-fallback]')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new URL(source, 'https://fire-stone.co/').href
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(new URL(page.url()).pathname).toBe(new URL('/en-US' + source, page.url()).pathname);
    await expect(page.locator('a[href*="requestedLocale"]')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en-US/blog/open-weights-and-american-ai-leadership/');
  const notice = page.locator('[data-locale-fallback]');
  const cookie = page.locator('#consent-banner');
  if (await cookie.count()) {
    await expect(cookie).toBeVisible();
    await expect
      .poll(async () => {
        const a = await notice.boundingBox();
        const b = await cookie.boundingBox();
        return !!a && !!b && a.y >= 0 && a.y + a.height < b.y && b.y + b.height <= 844;
      })
      .toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/locale-fallback-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/locale-fallback-desktop.png' });
  await notice.locator('[data-dismiss-fallback]').focus();
  await page.keyboard.press('Enter');
  await expect(notice).toBeHidden();
  if (await cookie.count()) {
    await expect(cookie).toBeVisible();
    await page.locator('#consent-decline-all').click();
    await expect(cookie).toBeHidden();
  }
  const missing = await page.goto('/en-US/this-page-does-not-exist/');
  expect(missing?.status()).toBe(404);

  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    await context.route('**/*', (route) =>
      new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()
    );
    const staticPage = await context.newPage();
    await staticPage.goto('http://127.0.0.1:4399/en-US/legal/privacy-policy/');
    await expect(staticPage.locator('[data-locale-fallback]')).toBeVisible();
    await expect(staticPage.locator('h1')).toBeVisible();
    await expect(staticPage.locator('[data-locale-fallback] a')).toHaveAttribute('href', '/en-US');
  } finally {
    await context.close();
  }
});

test('language banner makes room for delayed Cookie consent without another scrollbar', async ({
  page,
}) => {
  test.skip(!english, 'Requires a locale fallback page.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const records: { duration: number; easing: string; overflowY: string }[] = [];
    Object.assign(window, { bannerMovements: records });
    new MutationObserver(() => {
      const cookie = document.querySelector('#consent-banner:not([hidden])');
      const notice = document.querySelector('[data-locale-fallback]');
      const stack = document.querySelector('[data-banner-stack]');
      if (!cookie || !notice || !stack) return;
      for (const animation of notice.getAnimations()) {
        const timing = animation.effect?.getTiming();
        if (timing && typeof timing.duration === 'number' && timing.duration > 300)
          records.push({
            duration: timing.duration,
            easing: timing.easing,
            overflowY: getComputedStyle(stack).overflowY,
          });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en-US/blog/open-weights-and-american-ai-leadership/');
  test.skip((await page.locator('#consent-banner').count()) === 0, 'Consent UI is disabled.');
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { bannerMovements?: unknown[] }).bannerMovements?.length ?? 0
      )
    )
    .toBeGreaterThan(0);
  const movements = await page.evaluate(
    () =>
      (
        window as Window & {
          bannerMovements: { duration: number; easing: string; overflowY: string }[];
        }
      ).bannerMovements
  );
  expect(movements[0]).toEqual({
    duration: 450,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'visible',
  });
  await page
    .locator('[data-locale-fallback]')
    .evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
  const centers = await page
    .locator('[data-locale-fallback], #consent-banner')
    .evaluateAll((elements) =>
      elements.map((el) => {
        const content = el.children[0].getBoundingClientRect();
        const actions = el.children[1].getBoundingClientRect();
        return Math.abs(content.y + content.height / 2 - actions.y - actions.height / 2);
      })
    );
  expect(centers.every((distance) => distance < 2)).toBe(true);
});

test('Umami only loads after analytics consent and stops sending after revocation', async ({
  page,
}) => {
  await page.route('**/umami-test.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'window.__umamiTestLoaded = true;' })
  );
  await page.goto('/');
  const configured = await page.evaluate(
    () =>
      typeof (window as unknown as { firestoneUmamiBeforeSend?: unknown })
        .firestoneUmamiBeforeSend === 'function'
  );
  test.skip(!configured, 'Umami is optional; enabled in the isolated i18n/consent test build.');
  await expect(page.locator('script[data-website-id]')).toHaveCount(0);
  await page.locator('#consent-accept-all').click();
  await expect(page.locator('script[data-website-id]')).toHaveCount(1);
  const result = await page.evaluate(() => {
    const w = window as unknown as {
      firestoneUmamiBeforeSend: (type: string, payload: object) => unknown;
    };
    const granted = w.firestoneUmamiBeforeSend('event', { test: true });
    window.dispatchEvent(
      new CustomEvent('consent-updated', { detail: { categories: { analytics: false } } })
    );
    return { granted, denied: w.firestoneUmamiBeforeSend('event', { test: true }) };
  });
  expect(result).toEqual({ granted: { test: true }, denied: false });
});

test('translated content resolves different slugs, preserves reading time and renders Expressive Code', async ({
  page,
}) => {
  test.skip(
    !existsSync(join(root, 'en-US/blog/as260-check-en/index.html')),
    'Temporary content is only present in the isolated i18n build.'
  );
  expect(existsSync(join(root, 'en-US/blog/as260-draft/index.html'))).toBe(false);
  expect(existsSync(join(root, 'projects/en-us/as260-project/index.html'))).toBe(false);
  await page.goto('/blog/as260-check-zh/');
  await expect(page.locator('link[hreflang="en-US"]')).toHaveAttribute(
    'href',
    'https://fire-stone.co/en-US/blog/as260-check-en'
  );
  await page.goto('/en-US/blog/as260-check-en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('link[hreflang="zh-CN"]')).toHaveAttribute(
    'href',
    'https://fire-stone.co/blog/as260-check-zh'
  );
  await expect(page.locator('body')).toContainText('3 min read');
  await expect(page.locator('.expressive-code')).toContainText("const migration = '2.6.0'");
  await expect(page.locator('.expressive-code .copy button')).toHaveAttribute(
    'title',
    'Copy to Clipboard'
  );
  await page.goto('/en-US/projects/as260-project/');
  await expect(page.locator('h1')).toContainText('Migration test project');
  await expect(page.locator('link[hreflang="zh-CN"]')).toHaveAttribute(
    'href',
    'https://fire-stone.co/projects/as260-project'
  );
});
