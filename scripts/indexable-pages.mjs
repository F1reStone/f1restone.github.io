import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export function indexablePages() {
  let pages = [];
  let urls = new Set();
  return {
    pages: () => pages,
    filter: (url) => urls.has(decodeURI(new URL(url).pathname).replace(/\/$/, '') || '/'),
    integration: {
      name: 'firestone-indexable-pages',
      hooks: {
        'astro:build:generated': async ({ dir }) => {
          pages = [];
          const root = fileURLToPath(dir);
          async function walk(directory) {
            for (const entry of await readdir(directory, { withFileTypes: true })) {
              const sourcePath = join(directory, entry.name);
              if (entry.isDirectory()) {
                await walk(sourcePath);
                continue;
              }
              if (!entry.name.endsWith('.html')) continue;
              const content = await readFile(sourcePath, 'utf8');
              if (/<meta\s+name="robots"\s+content="[^"]*noindex/.test(content)) continue;
              const url =
                '/' +
                relative(root, sourcePath)
                  .replaceAll('\\', '/')
                  .replace(/index\.html$/, '')
                  .replace(/\.html$/, '');
              pages.push({ url, content, sourcePath });
            }
          }
          await walk(root);
          urls = new Set(pages.map((page) => decodeURI(page.url).replace(/\/$/, '') || '/'));
        },
      },
    },
  };
}
