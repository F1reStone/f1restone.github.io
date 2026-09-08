import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

/** Raster fallbacks reuse FireStone's vector; the theme's auto-letter logo is not substituted. */
export async function generateFaviconImages(root) {
  const source = await readFile(join(root, 'favicon.svg'));
  const sizes = [32, 180, 192, 512];
  const names = ['favicon-32x32.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'];
  const pngs = await Promise.all(sizes.map(size => sharp(source).resize(size, size, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer()));
  await Promise.all(pngs.map((png, i) => writeFile(join(root, names[i]), png)));
  // Supplying explicit frames avoids upscaling a 32px raster into a bulky 256px ICO.
  const iconFrames = await Promise.all([16, 32, 48].map(size => sharp(source).resize(size, size).flatten({ background: '#ffffff' }).png().toBuffer()));
  await writeFile(join(root, 'favicon.ico'), await pngToIco(iconFrames));
}
