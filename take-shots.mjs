import { chromium } from '/home/hatch/workspace/tools/playwright-lab/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', args: ['--no-sandbox'] });
const shots = [
  ['1-cover.png', 'cover'],
  ['2-takeoff.png', 'takeoff'],
  ['3-canyon.png', 'canyon'],
  ['4-landing.png', 'landing'],
];
for (const [file, shot] of shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('file://' + join(here, 'game/index.html') + `?shot=${shot}&seed=7`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(here, 'screenshots', file) });
  await page.close();
  console.log('shot', file);
}
await browser.close();
console.log('done');
