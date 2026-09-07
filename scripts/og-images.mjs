import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSync } from 'fontkit';
import sharp from 'sharp';

const decode = (value) =>
  value.replace(
    /&(amp|quot|apos|lt|gt);/g,
    (_, key) => ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' })[key]
  );

// Outline the bundled CJK font so headless Linux builds need no system fonts.
export async function generateOgImages(root) {
  const font = openSync(
    fileURLToPath(new URL('../public/fonts/source-han-sans-sc-variable.woff2', import.meta.url))
  );
  async function walk(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return 0;
      throw error;
    }
    let count = 0;
    for (const entry of entries) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) {
        count += await walk(file);
        continue;
      }
      if (!file.endsWith('.svg')) continue;
      const svg = (await readFile(file, 'utf8')).replace(
        /<text\b([^>]*)>([^<]*)<\/text>/g,
        (_, attributes, text) => {
          const attrs = Object.fromEntries(
            [...attributes.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]])
          );
          const run = font.layout(decode(text));
          const spacing = Number(attrs['letter-spacing'] || 0);
          const advance = run.positions.reduce((sum, pos) => sum + pos.xAdvance, 0);
          const scale = Math.min(
            Number(attrs['font-size'] || 16) / font.unitsPerEm,
            (1040 - spacing * run.glyphs.length) / Math.max(1, advance)
          );
          const width = run.positions.reduce((sum, pos) => sum + pos.xAdvance * scale + spacing, 0);
          let x = Number(attrs.x || 0) - (attrs['text-anchor'] === 'end' ? width : 0);
          const y = Number(attrs.y || 0);
          const paths = run.glyphs
            .map((glyph, index) => {
              const pos = run.positions[index];
              const path = `<path transform="translate(${x + pos.xOffset * scale},${y - pos.yOffset * scale}) scale(${scale},${-scale})" d="${glyph.path.toSVG()}"/>`;
              x += pos.xAdvance * scale + spacing;
              return path;
            })
            .join('');
          return `<g fill="${attrs.fill || '#ffffff'}" opacity="${attrs['fill-opacity'] || 1}">${paths}</g>`;
        }
      );
      await sharp(Buffer.from(svg))
        .flatten({ background: '#111111' })
        .png()
        .toFile(file.replace(/\.svg$/, '.png'));
      count++;
    }
    return count;
  }
  return walk(join(root, 'og'));
}
