#!/usr/bin/env node
/**
 * Copy preset data into apps/mobile/assets/presets for Metro dev serving + device bundles.
 * Source: packages/core/src/presets/data (mirrors metro.config.js dev middleware).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(mobileRoot, '../..');
const source = path.resolve(workspaceRoot, 'packages/core/src/presets/data');
const dest = path.join(mobileRoot, 'assets', 'presets');

if (!fs.existsSync(source)) {
  console.warn(`[sync-presets] No preset data found at ${source}`);
  process.exit(0);
}

let copied = 0;
let total = 0;

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
      continue;
    }
    total++;
    if (!fs.existsSync(dstPath) || fs.statSync(srcPath).mtimeMs > fs.statSync(dstPath).mtimeMs) {
      fs.copyFileSync(srcPath, dstPath);
      copied++;
    }
  }
}

copyDir(source, dest);
console.log(`[sync-presets] ${total} files at ${dest} (${copied} updated from ${source})`);
