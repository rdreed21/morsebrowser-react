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
const force = process.argv.includes('--force');

if (!fs.existsSync(source)) {
  console.warn(`[sync-presets] No preset data found at ${source}`);
  process.exit(0);
}

let copied = 0;
let total = 0;
const srcRels = new Set();

function copyDir(src, dst, relBase = '') {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath, rel);
      continue;
    }
    srcRels.add(rel);
    total++;
    const needsCopy = force
      || !fs.existsSync(dstPath)
      || !fs.readFileSync(srcPath).equals(fs.readFileSync(dstPath));
    if (needsCopy) {
      fs.copyFileSync(srcPath, dstPath);
      copied++;
    }
  }
}

function walkFiles(dir, relBase = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, rel));
    else out.push({ rel, full });
  }
  return out;
}

copyDir(source, dest);

let removed = 0;
if (fs.existsSync(dest)) {
  for (const { rel, full } of walkFiles(dest)) {
    if (srcRels.has(rel)) continue;
    fs.unlinkSync(full);
    removed++;
  }
}

console.log(
  `[sync-presets] ${total} files at ${dest} (${copied} updated`
  + (removed ? `, ${removed} orphans removed` : '')
  + ` from ${source})`,
);
