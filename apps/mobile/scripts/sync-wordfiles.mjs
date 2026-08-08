#!/usr/bin/env node
/**
 * Copy LICW wordfiles into apps/mobile/assets/wordfiles for Metro + device bundles.
 * Source: LongIslandCW/morsebrowser (club) wordfiles, or WORDFILES_DIR env override.
 *
 * Resolution (first hit wins):
 *   WORDFILES_DIR env, else <ko>/src/wordfiles where ko is resolved via
 *   MORSEBROWSER_KO_DIR / MORSEBROWSER_DEV_DIR or sibling checkouts named
 *   morsebrowser, licw-morsebrowser, or morsebrowser_dev.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(mobileRoot, '../..');
const dest = path.join(mobileRoot, 'assets', 'wordfiles');
const force = process.argv.includes('--force');

const SIBLING_NAMES = ['morsebrowser', 'licw-morsebrowser', 'morsebrowser_dev'];

function resolveSource() {
  if (process.env.WORDFILES_DIR) {
    return path.resolve(process.env.WORDFILES_DIR);
  }
  const envDir = process.env.MORSEBROWSER_KO_DIR || process.env.MORSEBROWSER_DEV_DIR;
  if (envDir) {
    const wordfiles = path.join(path.resolve(envDir), 'src/wordfiles');
    if (fs.existsSync(wordfiles)) return wordfiles;
  }
  for (const name of SIBLING_NAMES) {
    const sibling = path.resolve(workspaceRoot, '..', name, 'src/wordfiles');
    if (fs.existsSync(sibling)) return sibling;
  }
  return null;
}

const source = resolveSource();
if (!source) {
  console.warn(
    '[sync-wordfiles] No wordfiles source found.\n'
    + '  Clone LongIslandCW/morsebrowser next to morsebrowser-react as `morsebrowser`,\n'
    + '  or set WORDFILES_DIR / MORSEBROWSER_KO_DIR.',
  );
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
const files = fs.readdirSync(source).filter(f => !f.startsWith('.'));
let copied = 0;
for (const file of files) {
  const src = path.join(source, file);
  const dst = path.join(dest, file);
  if (!fs.statSync(src).isFile()) continue;
  const needsCopy = force
    || !fs.existsSync(dst)
    || !fs.readFileSync(src).equals(fs.readFileSync(dst));
  if (needsCopy) {
    fs.copyFileSync(src, dst);
    copied++;
  }
}
console.log(`[sync-wordfiles] ${files.length} files at ${dest} (${copied} updated from ${source})`);
