import { mkdir, stat } from 'node:fs/promises';
import { chromium } from '/home/hatch/workspace/tools/playwright-lab/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
await mkdir(join(here, 'candidates'), { recursive: true });
const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', args: ['--no-sandbox'] });
const shots = ['cover', 'canyon', 'takeoff', 'storm', 'landing', 'chase', 'chase-low', 'chase-storm'].map((name, i) => [`${i+1}-${name}.png`, name]);
for (const [file, shot] of shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', error => { throw error; });
  await page.goto('file://' + join(here, 'game/index.html') + `?shot=${shot}&seed=7`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(here, 'candidates', file) });
  await page.close();
  console.log('shot', file, (await stat(join(here, 'candidates', file))).size, 'bytes');
}
await browser.close();
console.log('done');
