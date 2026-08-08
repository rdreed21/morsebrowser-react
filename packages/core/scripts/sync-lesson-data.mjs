#!/usr/bin/env node
/**
 * Sync lesson catalog + presets from the club Knockout app
 * (LongIslandCW/morsebrowser main):
 *   - lesson catalog:  <ko>/src/wordfilesconfigs/wordlists.json
 *                      -> packages/core/src/lessons/wordlists.json
 *   - presets:         <ko>/src/presets/**
 *                      -> packages/core/src/presets/data/**
 *
 * Wordfiles themselves are still handled by the existing per-app syncs
 * (apps/mobile/scripts/sync-wordfiles.mjs, apps/web/vite-wordfiles-plugin.ts).
 *
 * Source repo resolution (first hit wins):
 *   MORSEBROWSER_KO_DIR / MORSEBROWSER_DEV_DIR env override, else sibling
 *   checkouts named morsebrowser, licw-morsebrowser, or morsebrowser_dev.
 *
 * Usage: node packages/core/scripts/sync-lesson-data.mjs [--check]
 *   --check  exit 1 if anything is out of sync, without copying
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(coreRoot, '../..');
const checkOnly = process.argv.includes('--check');

const SIBLING_NAMES = ['morsebrowser', 'licw-morsebrowser', 'morsebrowser_dev'];

function resolveKoRepo() {
  const envDir = process.env.MORSEBROWSER_KO_DIR || process.env.MORSEBROWSER_DEV_DIR;
  if (envDir) return path.resolve(envDir);

  for (const name of SIBLING_NAMES) {
    const sibling = path.resolve(workspaceRoot, '..', name);
    if (fs.existsSync(path.join(sibling, 'src/wordfilesconfigs/wordlists.json'))) {
      return sibling;
    }
  }
  return null;
}

const koRepo = resolveKoRepo();
if (!koRepo) {
  console.warn(
    '[sync-lesson-data] Knockout source repo not found.\n'
    + '  Clone LongIslandCW/morsebrowser next to morsebrowser-react as `morsebrowser`,\n'
    + '  or set MORSEBROWSER_KO_DIR (legacy: MORSEBROWSER_DEV_DIR).',
  );
  process.exit(0);
}

const pairs = [
  {
    label: 'catalog',
    src: path.join(koRepo, 'src/wordfilesconfigs/wordlists.json'),
    dst: path.join(coreRoot, 'src/lessons/wordlists.json'),
  },
];

// Presets: mirror every file under src/presets into src/presets/data
const presetsSrcRoot = path.join(koRepo, 'src/presets');
const presetsDstRoot = path.join(coreRoot, 'src/presets/data');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && !entry.name.startsWith('.') ? [full] : [];
  });
}
const srcPresetRels = new Set();
if (fs.existsSync(presetsSrcRoot)) {
  for (const src of walk(presetsSrcRoot)) {
    const rel = path.relative(presetsSrcRoot, src);
    srcPresetRels.add(rel);
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

// Remove preset files that no longer exist upstream (configs/sets churn).
let removed = 0;
if (fs.existsSync(presetsDstRoot) && srcPresetRels.size > 0) {
  for (const dst of walk(presetsDstRoot)) {
    const rel = path.relative(presetsDstRoot, dst);
    if (srcPresetRels.has(rel)) continue;
    drifted++;
    if (checkOnly) {
      console.error(`[sync-lesson-data] ORPHAN PRESET: ${rel}`);
    } else {
      fs.unlinkSync(dst);
      removed++;
      console.log(`[sync-lesson-data] removed orphan preset ${rel}`);
    }
  }
}

if (checkOnly) {
  console.log(`[sync-lesson-data] check: ${pairs.length} files, ${drifted} out of sync`);
  process.exit(drifted > 0 ? 1 : 0);
}
console.log(
  `[sync-lesson-data] ${pairs.length} files checked, ${updated} updated`
  + (removed ? `, ${removed} orphans removed` : '')
  + ` from ${koRepo}`,
);
