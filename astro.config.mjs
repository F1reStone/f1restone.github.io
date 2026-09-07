import { existsSync } from 'node:fs';
import { generateOgImages } from './scripts/og-images.mjs';
import { readdir, readFile } from 'node:fs/promises';
import { canonicalOf, jsonLdUrlOf, siteUrlDisagreement, disagreementMessage } from './scripts/site-url-agreement.mjs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
//import vercel from '@astrojs/vercel';
//import netlify from '@astrojs/netlify';
import i18nConfig, {
  expressiveCodeFrameTexts,
  getExpressiveCodeLocale,
} from './src/config/i18n.config.ts';

import expressiveCode from 'astro-expressive-code';
import { pluginFramesTexts } from '@expressive-code/plugin-frames';

//const isNetlify = process.env.DEPLOY_TARGET === 'netlify';

/**
 * Pagefind static search index, generated after every `astro build`.
 *
 * Runs in the `astro:build:done` hook so it indexes the *actual* output
 * directory — the Vercel adapter writes to `.vercel/output/static`, Netlify
 * and plain static builds to `dist/` — without the build command needing to
 * know which. The index is served from `/pagefind/` and loaded lazily by
 * `src/components/layout/SearchModal.astro`; `astro dev` has no index, and
 * the search modal explains that instead of erroring.
 */
function pagefind() {
  return {
    name: 'pagefind',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const sitePath = fileURLToPath(dir);
        const outputPath = join(sitePath, 'pagefind');
        const { createIndex, close } = await import('pagefind');
        const { index } = await createIndex();
        const { page_count } = await index.addDirectory({ path: sitePath });
        await index.writeFiles({ outputPath });
        await close();
        logger.info(`indexed ${page_count} pages into ${outputPath}`);
      },
    },
  };
}

/**
 * Native Astro i18n is only wired up when the user opts in *and* has
 * more than one locale configured. With i18n off (the default) this
 * block is undefined and the build emits the exact same routes as
 * before — no /en/ prefix, no extra pages.
 */
const i18nEnabled = i18nConfig.enabled === true && i18nConfig.locales.length > 1;
const astroI18nOptions = i18nEnabled
  ? {
      defaultLocale: i18nConfig.defaultLocale,
      locales: i18nConfig.locales,
      routing: {
        prefixDefaultLocale: false,
        redirectToDefaultLocale: false,
      },
    }
  : undefined;

for (const [locale, texts] of Object.entries(expressiveCodeFrameTexts)) {
  pluginFramesTexts.addLocale(locale, texts);
}

function verifySiteUrl() {
  return {
    name: 'verify-site-url',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);

        async function htmlFiles(directory) {
          const found = [];
          for (const entry of await readdir(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) found.push(...(await htmlFiles(path)));
            else if (entry.name.endsWith('.html')) found.push(path);
          }
          return found;
        }

        // index.html first: it is the page most likely to carry both, and
        // finding it there avoids reading the rest of the site.
        const pages = await htmlFiles(root);
        pages.sort((a, b) => Number(b.endsWith('index.html')) - Number(a.endsWith('index.html')));

        for (const page of pages) {
          const html = await readFile(page, 'utf8');
          const canonical = canonicalOf(html);
          const jsonLd = jsonLdUrlOf(html);
          if (!canonical || !jsonLd) continue; // proves nothing either way

          const found = siteUrlDisagreement(html);
          if (found) throw new Error(disagreementMessage(page.replace(`${root}`, ''), found));

        }

        logger.info(`checked canonical and JSON-LD site addresses across ${pages.length} pages`);
      },
    },
  };
}

for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  output: 'static',
  //adapter: isNetlify ? netlify() : vercel(),
  //site: process.env.SITE_URL || 'https://fire-stone.co/',
  site: process.env.SITE_URL || 'https://fire-stone.co/',
  base: '/',// FireStone: Adapt for GitHub Pages deployment.
  ...(astroI18nOptions ? { i18n: astroI18nOptions } : {}),

  // Astro 7 changed the default to 'jsx', which strips whitespace between
  // inline elements (React-style). Pin to `true` to keep this theme's v6
  // rendering — significant whitespace between inline tags is preserved.

  // FireStone: whitespace between inline elements is preserved for better formatting of text content, so we use 'jsx'.
  compressHTML: 'jsx',


  build: {
    inlineStylesheets: 'always',
  },

  env: {
    schema: {
      SITE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      PUBLIC_GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_UMAMI_WEBSITE_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_UMAMI_SRC: envField.string({ context: 'client', access: 'public', default: 'https://cloud.umami.is/script.js' }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      NEWSLETTER_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
      BING_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
      REPOSITORY_ID: envField.string({ context: 'server', access: 'public', optional: true, default: ''}),
      CATEGORY_ID: envField.string({ context: 'server', access: 'public', optional: true, default: '' }),
      PUBLIC_GOOGLE_MAPS_API_KEY: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      PUBLIC_CONSENT_ENABLED: envField.boolean({ context: 'client', access: 'public', optional: true, default: false }),
      PUBLIC_PRIVACY_POLICY_URL: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
    },
  },

  image: {
    layout: 'constrained',

    // About page images are provided by Steam CDN, so allow that domain for the image optimization.
    //domains: ['shared.fastly.steamstatic.com'],
  },

  integrations: [
    react(),
    expressiveCode({
      defaultLocale: i18nConfig.defaultLocale,
      getBlockLocale: ({ file }) => getExpressiveCodeLocale(file.path),
      styleOverrides: {
        codeFontFamily: 'var(--font-mono)',
        uiFontFamily: 'var(--font-sans)',
      },
    }),
    mdx(),
    sitemap({ filter: (page) => !['/components/', '/404/'].includes(new URL(page).pathname) }),
    icon(),
    pagefind(),
    { name: 'firestone-og-images', hooks: { 'astro:build:done': async ({ dir, logger }) => {
      logger.info(`generated ${await generateOgImages(fileURLToPath(dir))} PNG sharing images`);
    } } },
    verifySiteUrl(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  security: {
    checkOrigin: true,
  },

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

});
