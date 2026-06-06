#!/usr/bin/env node
/**
 * visual-diff.mjs — Screenshot diff: KO fork vs React
 * Agent 3 runs this after each major component.
 *
 * Setup: npm install -D playwright pixelmatch pngjs
 *        npx playwright install chromium
 * Usage: node tools/visual-diff.mjs
 */
import { chromium } from 'playwright';
import { PNG }      from 'pngjs';
import pixelmatch   from 'pixelmatch';
import fs           from 'fs';
import path         from 'path';

const KO_URL    = process.env.KO_URL    || 'http://localhost:3001/index.html';
const REACT_URL = process.env.REACT_URL || 'http://localhost:5173';
const OUT       = path.resolve('./visual-diff-output');
const VIEWPORTS = [
  { name:'desktop', width:1280, height:900 },
  { name:'tablet',  width:768,  height:1024 },
];

fs.mkdirSync(OUT, { recursive:true });

const browser = await chromium.launch();
let fails = 0;

console.log('\n🔍 Visual Diff — KO fork vs React\n');

for (const vp of VIEWPORTS) {
  console.log(`── ${vp.name} (${vp.width}×${vp.height})`);
  const page = await browser.newPage();
  await page.setViewportSize(vp);

  const koF    = path.join(OUT, `${vp.name}-ko.png`);
  const reactF = path.join(OUT, `${vp.name}-react.png`);
  const diffF  = path.join(OUT, `${vp.name}-diff.png`);

  await page.goto(KO_URL,    { waitUntil:'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path:koF, fullPage:true });

  await page.goto(REACT_URL, { waitUntil:'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path:reactF, fullPage:true });
  await page.close();

  const ref = PNG.sync.read(fs.readFileSync(koF));
  const cur = PNG.sync.read(fs.readFileSync(reactF));
  const diff = new PNG({ width:ref.width, height:ref.height });
  const px = pixelmatch(ref.data, cur.data, diff.data, ref.width, ref.height, { threshold:0.005 });
  fs.writeFileSync(diffF, PNG.sync.write(diff));

  if (px === 0) { console.log(`  ✅ Pixel-perfect`); }
  else { console.log(`  ❌ ${px} pixels differ — diff: ${diffF}`); fails++; }
}

await browser.close();
console.log(`\n${fails===0 ? '✅ All viewports match' : `❌ ${fails} viewport(s) failed`}\n`);
process.exit(fails > 0 ? 1 : 0);
