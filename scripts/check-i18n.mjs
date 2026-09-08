import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const configPath = 'src/config/i18n.config.ts';
const original = readFileSync(configPath, 'utf8');
const created = [];
const fixture = (file, body) => {
  if (existsSync(file)) throw new Error(`Refusing to replace an existing fixture: ${file}`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body, { flag: 'wx' });
  created.push(file);
};
const run = (args, env = {}) => {
  const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`pnpm ${args.join(' ')} failed (${result.status})`);
};

try {
  if (!/enabled: (?:false|true),/.test(original)) throw new Error('Cannot locate the i18n switch');
  writeFileSync(configPath, original.replace(/enabled: (?:false|true),/, 'enabled: true,'));
  for (const [locale, slug] of [
    ['zh-CN', 'as260-check-zh'],
    ['en-US', 'as260-check-en'],
  ]) {
    fixture(
      `src/content/blog/${locale}/${slug}.mdx`,
      `---\ntitle: Migration test article\ndescription: Temporary translation fixture\nlocale: ${locale}\nuid: as260-translation-fixture\npublishedAt: 2026-01-01\ntags: [migration-test]\ncomments: false\n---\n\n## Example\n\n${'A temporary paragraph verifies reading time for the translated article. '.repeat(45)}\n\n\x60\x60\x60js\nconst migration = '2.6.0';\n\x60\x60\x60\n`
    );
    fixture(
      `src/content/projects/${locale}/as260-project.mdx`,
      `---\ntitle: Migration test project\ndescription: Temporary project fixture\nlocale: ${locale}\ntags: [migration-test]\n---\n\n## Project\n\nTemporary content for checking locale-aware routes.\n`
    );
  }
  fixture(
    'src/content/blog/en-US/as260-draft.mdx',
    '---\ntitle: Draft must not publish\ndescription: Temporary draft\nlocale: en-US\npublishedAt: 2026-01-01\ndraft: true\n---\nDraft.\n'
  );
  const env = {
    PUBLIC_CONSENT_ENABLED: 'true',
    PUBLIC_UMAMI_WEBSITE_ID: 'as260-test',
    PUBLIC_UMAMI_SRC: '/umami-test.js',
  };
  run(['exec', 'astro', 'build', '--outDir', './test-results/i18n-dist'], env);
  run(['test:e2e'], { SITE_TEST_DIST: './test-results/i18n-dist' });
} finally {
  for (const file of created) unlinkSync(file);
  writeFileSync(configPath, original);
}
