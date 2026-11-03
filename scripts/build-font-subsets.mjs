/* eslint-disable no-console -- build progress is intentionally printed. */
/**
 * Builds the self-hosted Source Han Sans CN web font from the master file.
 *
 * Two strategies are supported:
 * - minimal: extract only the characters used by the site into one compact face.
 * - full: split the complete font into unicode-range chunks for arbitrary text.
 *
 * The default is `full`. Override it per build with `--mode=minimal|full` or
 * `FONT_SUBSET_MODE`; the CLI flag wins over the environment variable.
 * Both modes write the same `font.css` contract and a small `manifest.json`, so
 * the layout and styles do not need mode-specific branches.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fontSplit } from 'cn-font-split';

const root = path.resolve(import.meta.dirname, '..');
const sourceFont = path.join(root, 'src/assets/fonts/source-han-sans-cn-variable.woff2');
const outDir = path.join(root, 'public/fonts/source-han-sans-cn');
const cssOut = path.join(outDir, 'font.css');
const manifestOut = path.join(outDir, 'manifest.json');
const family = 'Source Han Sans CN Variable';

/**
 * The persistent default. `pnpm fonts:build` uses this unless a CLI flag or
 * environment override is present.
 */
const defaultMode = 'full';

function readMode() {
  const cliMode = process.argv
    .slice(2)
    .find((argument) => argument.startsWith('--mode='))
    ?.slice('--mode='.length);
  const rawMode = cliMode ?? process.env.FONT_SUBSET_MODE ?? defaultMode;
  const selectedMode = rawMode.trim().toLowerCase();

  if (selectedMode !== 'minimal' && selectedMode !== 'full') {
    throw new Error(`Unknown font subset mode "${rawMode}". Use "minimal" or "full".`);
  }

  return selectedMode;
}

const mode = readMode();
const isFull = mode === 'full';

if (!fs.existsSync(sourceFont)) {
  throw new Error(
    `Missing font source: ${path.relative(root, sourceFont)}. ` +
      'Place the Source Han Sans CN variable WOFF2 at this path before building.'
  );
}

const textExtensions = new Set([
  '.astro',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mdx',
  '.css',
  '.yaml',
  '.yml',
  '.txt',
]);

/**
 * Collect the CJK and CJK-punctuation code points that can appear in rendered
 * copy. Latin text keeps its existing display font, so it does not need a
 * chunk here. A new character outside this set falls back to the platform
 * font until the script is run again (predev/prebuild do that automatically).
 */
function collectCharacters() {
  const characters = new Set();
  const isCjk = (cp) =>
    (cp >= 0x2e80 && cp <= 0x9fff) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xffef) ||
    (cp >= 0x3000 && cp <= 0x303f) ||
    (cp >= 0x3040 && cp <= 0x30ff) ||
    [
      0x00b7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2027, 0x203c, 0x2047,
      0x22ef,
    ].includes(cp);

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (textExtensions.has(path.extname(entry.name))) {
        for (const character of fs.readFileSync(fullPath, 'utf8')) {
          const cp = character.codePointAt(0);
          if (cp && isCjk(cp)) characters.add(cp);
        }
      }
    }
  }

  walk(path.join(root, 'src'));
  return [...characters].sort((a, b) => a - b);
}

function ensureNativeBinary() {
  const distDir = path.join(root, 'node_modules/cn-font-split/dist');
  const hasBinary = fs
    .readdirSync(distDir)
    .some((file) => file.startsWith('libffi-') && /\.(dll|so|dylib)$/i.test(file));

  if (hasBinary) return;

  // pnpm may intentionally skip dependency install scripts. In that case the
  // splitter's platform binary is absent; download it before using the API.
  const cli = path.join(root, 'node_modules/cn-font-split/dist/cli.js');
  execFileSync(process.execPath, [cli, 'i', 'default'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}

const characters = isFull ? null : collectCharacters();
if (!isFull && characters.length === 0) {
  throw new Error('No CJK characters found in src; refusing to build an empty font subset.');
}

ensureNativeBinary();
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

await fontSplit({
  input: fs.readFileSync(sourceFont),
  outDir,
  // Minimal keeps only the scanned characters in one request. Full keeps the
  // complete font and lets cn-font-split create unicode-range chunks, so the
  // browser can fetch the ranges required by arbitrary text on demand.
  ...(isFull
    ? {
        autoSubset: true,
        languageAreas: true,
        subsetRemainChars: true,
        reduceMins: true,
      }
    : {
        subsets: [characters],
        subsetRemainChars: false,
        autoSubset: false,
        languageAreas: false,
      }),
  fontFeature: true,
  renameOutputFont: '[hash:8].[ext]',
  testHtml: false,
  reporter: false,
  silent: true,
  css: {
    fontFamily: family,
    fontWeight: '250 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    localFamily: [family, 'Source Han Sans CN VF'],
    compress: true,
  },
});

// This stylesheet is linked asynchronously from BaseLayout. It must therefore
// stay in public/, with root-absolute chunk URLs, instead of being bundled into
// the render-blocking global CSS.
const generatedCssPath = path.join(outDir, 'result.css');
let css = fs.readFileSync(generatedCssPath, 'utf8');
css = css.replace(/url\((['"]?)\.\/([^'")]+\.woff2)\1\)/g, 'url("/fonts/source-han-sans-cn/$2")');
fs.writeFileSync(cssOut, css);
fs.rmSync(generatedCssPath, { force: true });
fs.rmSync(path.join(outDir, 'index.proto'), { force: true });

const chunks = fs
  .readdirSync(outDir)
  .filter((file) => file.endsWith('.woff2'))
  .sort();
const totalBytes = chunks.reduce((sum, file) => sum + fs.statSync(path.join(outDir, file)).size, 0);
const preload =
  mode === 'minimal' && chunks.length === 1 ? `/fonts/source-han-sans-cn/${chunks[0]}` : null;

// BaseLayout reads this manifest at build time. Minimal preloads its single
// face at low priority; full mode deliberately skips preload because many
// unicode-range chunks are fetched on demand instead.
fs.writeFileSync(
  manifestOut,
  JSON.stringify(
    {
      mode,
      family,
      chunks: chunks.length,
      totalBytes,
      characters: characters?.length ?? null,
      preload,
    },
    null,
    2
  ) + '\n'
);

const size =
  totalBytes >= 1024 * 1024
    ? `${(totalBytes / 1024 / 1024).toFixed(2)} MiB`
    : `${(totalBytes / 1024).toFixed(0)} KiB`;
console.log(
  `[fonts] mode=${mode}: ${chunks.length} Source Han Sans CN chunk${chunks.length === 1 ? '' : 's'} ` +
    `(${size})` +
    (characters ? ` for ${characters.length} characters` : '') +
    (preload ? `; low-priority preload ${preload}` : '; preload disabled')
);

// The splitter's native FFI teardown can crash after all files are written on
// some Node/Windows builds. Exit explicitly once the generated assets are on
// disk so a successful split is not reported as a failed build step.
process.exit(0);
