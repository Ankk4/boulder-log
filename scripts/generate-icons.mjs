// Renders the SVG masters in assets/brand/ into public/. Output is deterministic.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const icon = resolve(root, 'assets/brand/icon.svg');
const maskable = resolve(root, 'assets/brand/icon-maskable.svg');
const out = (name) => resolve(root, 'public', name);

function render(svgPath, width, target) {
  const svg = readFileSync(svgPath, 'utf8');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  writeFileSync(out(target), png);
}

copyFileSync(icon, out('favicon.svg'));
render(icon, 192, 'icon-192.png');
render(icon, 512, 'icon-512.png');
render(maskable, 512, 'icon-maskable-512.png');
render(maskable, 180, 'apple-touch-icon.png');
