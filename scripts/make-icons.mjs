// Renders public/icon.svg to the PNG sizes the PWA manifest needs.
// Uses Playwright's Chromium (no extra image deps). Run: npm run icons
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Playwright may be installed globally (not a project dependency).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
