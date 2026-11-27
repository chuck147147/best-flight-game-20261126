import { mkdir, stat } from 'node:fs/promises';
import { chromium } from '/home/hatch/workspace/tools/playwright-lab/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
await mkdir(join(here, 'candidates'), { recursive: true });
const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', args: ['--no-sandbox'] });
const shots = [
  ['1-cover-a.png', 'chase', 7],
  ['1-cover-b.png', 'chase-b', 7],
  ['2-river-a.png', 'chase-low', 7],
  ['2-river-b.png', 'chase-low-b', 7],
  ['3-storm-a.png', 'chase-storm', 7],
  ['3-storm-b.png', 'chase-storm-b', 7],
  ['4-canyon-a.png', 'canyon', 7],
  ['4-canyon-b.png', 'canyon', 12],
  ['5-takeoff.png', 'takeoff', 7],
  ['6-landing.png', 'landing', 7],
];
for (const [file, shot, seed] of shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', error => { throw error; });
  await page.goto('file://' + join(here, 'game/index.html') + `?shot=${shot}&seed=${seed}`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(here, 'candidates', file) });
  await page.close();
  console.log('shot', file, (await stat(join(here, 'candidates', file))).size, 'bytes');
}
await browser.close();
console.log('done');
