const { cpSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');

const src = __dirname;
const dist = join(__dirname, 'dist');

const assets = [
  'index.html',
  'about.html',
  'commission.html',
  'drops.html',
  'legal.html',
  'licensing.html',
  'mothersday.html',
  'drops.json',
  'radio.json',
  'robots.txt',
  'sitemap.xml',
  '_headers',
  'css',
  'js',
  'images',
  'music',
];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const item of assets) {
  const srcPath = join(src, item);
  const destPath = join(dist, item);
  try {
    cpSync(srcPath, destPath, { recursive: true, force: true });
    console.log(`✓ ${item}`);
  } catch (e) {
    console.warn(`  skipped: ${item} — ${e.message}`);
  }
}

console.log('\nBuild complete → dist/');
console.log('Deploy dist/ to Cloudflare Pages (publish directory: dist)');
