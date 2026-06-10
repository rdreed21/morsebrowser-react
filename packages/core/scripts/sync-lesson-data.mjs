#!/usr/bin/env node
/**
 * Sync the two lesson-data pieces that previously had NO automation
 * (see LESSON_DATA_PIPELINE.md):
 *   - lesson catalog:  morsebrowser_dev/src/wordfilesconfigs/wordlists.json
 *                      -> packages/core/src/lessons/wordlists.json
 *   - presets:         morsebrowser_dev/src/presets/**
 *                      -> packages/core/src/presets/data/**
 *
 * Wordfiles themselves are still handled by the existing per-app syncs
 * (apps/mobile/scripts/sync-wordfiles.mjs, apps/web/vite-wordfiles-plugin.ts).
 *
 * Source repo resolution: MORSEBROWSER_DEV_DIR env override, else the
 * sibling checkout next to this repo.
 *
 * Usage: node packages/core/scripts/sync-lesson-data.mjs [--check]
 *   --check  exit 1 if anything is out of sync, without copying
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreRoot = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');

function resolveDevRepo() {
  if (process.env.MORSEBROWSER_DEV_DIR) {
    return path.resolve(process.env.MORSEBROWSER_DEV_DIR);
  }
  const sibling = path.resolve(coreRoot, '../../../morsebrowser_dev');
  return fs.existsSync(sibling) ? sibling : null;
}

const devRepo = resolveDevRepo();
if (!devRepo) {
  console.warn(
    '[sync-lesson-data] morsebrowser_dev not found.\n'
    + '  Clone it next to morsebrowser-react, or set MORSEBROWSER_DEV_DIR.',
  );
  process.exit(0);
}

const pairs = [
  {
    label: 'catalog',
    src: path.join(devRepo, 'src/wordfilesconfigs/wordlists.json'),
    dst: path.join(coreRoot, 'src/lessons/wordlists.json'),
  },
];

// Presets: mirror every file under src/presets into src/presets/data
const presetsSrcRoot = path.join(devRepo, 'src/presets');
const presetsDstRoot = path.join(coreRoot, 'src/presets/data');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && !entry.name.startsWith('.') ? [full] : [];
  });
}
if (fs.existsSync(presetsSrcRoot)) {
  for (const src of walk(presetsSrcRoot)) {
    const rel = path.relative(presetsSrcRoot, src);
    pairs.push({ label: `preset ${rel}`, src, dst: path.join(presetsDstRoot, rel) });
  }
}

let updated = 0;
let drifted = 0;
for (const { label, src, dst } of pairs) {
  const same = fs.existsSync(dst) && fs.readFileSync(src).equals(fs.readFileSync(dst));
  if (same) continue;
  drifted++;
  if (checkOnly) {
    console.error(`[sync-lesson-data] OUT OF SYNC: ${label} (${dst})`);
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    updated++;
    console.log(`[sync-lesson-data] updated ${label}`);
  }
}

if (checkOnly) {
  console.log(`[sync-lesson-data] check: ${pairs.length} files, ${drifted} out of sync`);
  process.exit(drifted > 0 ? 1 : 0);
}
console.log(`[sync-lesson-data] ${pairs.length} files checked, ${updated} updated from ${devRepo}`);
