import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '../theme/brand';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}
interface Manifest {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
}

const manifest = JSON.parse(read('public/manifest.json')) as Manifest;

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';";

function pngSize(rel: string): string {
  const buf = fs.readFileSync(path.join(root, rel));
  return `${String(buf.readUInt32BE(16))}x${String(buf.readUInt32BE(20))}`;
}

describe('branding', () => {
  it('manifest is valid for the base path', () => {
    expect(manifest.name).toBe('Matside');
    expect(manifest.short_name).toBe('Matside');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.background_color).toBe(brand.dark.background);
    expect(manifest.theme_color).toBe(brand.dark.paper);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('/')).toBe(false);
      expect(fs.existsSync(path.join(root, 'public', icon.src))).toBe(true);
    }
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });

  it('icon PNGs exist with declared sizes', () => {
    for (const icon of manifest.icons) {
      expect(pngSize(`public/${icon.src}`)).toBe(icon.sizes);
    }
    expect(pngSize('public/apple-touch-icon.png')).toBe('180x180');
  });

  it('index.html links manifest, icons and theme-color', () => {
    const html = read('index.html');
    expect(html).toMatch(/rel="manifest"/);
    expect(html).toMatch(/rel="icon"[^>]*favicon\.svg/);
    expect(html).toMatch(/rel="apple-touch-icon"/);
    expect(html).toContain(`name="theme-color" content="${brand.dark.paper}"`);
    expect(html).toContain('<title>Matside</title>');
    expect(html).toContain(`content="${CSP}"`);
  });

  it('database name is unchanged', () => {
    expect(read('src/db/database.ts')).toContain("super('boulderLog')");
  });
});

describe('base stylesheet', () => {
  it('base stylesheet has no starter rules', () => {
    expect(fs.existsSync(path.join(root, 'src/App.css'))).toBe(false);
    const cssPath = path.join(root, 'src/index.css');
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8');
      expect(css).not.toContain('place-items');
      expect(css).not.toContain('prefers-color-scheme');
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});

describe('brand name', () => {
  it('manifest and index.html use the brand name', () => {
    expect(manifest.name).toBe('Matside');
    expect(manifest.short_name).toBe('Matside');
    expect(read('index.html')).toContain('<title>Matside</title>');
    const readme = read('README.md');
    expect(readme.split('\n')[0]).toBe('# Matside');
    expect(readme).toContain('docs/brand.md');
  });
});
