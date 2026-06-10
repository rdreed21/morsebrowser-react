#!/usr/bin/env node
/**
 * Copy LICW wordfiles into apps/mobile/assets/wordfiles for Metro + device bundles.
 * Source: morsebrowser_dev sibling repo, or WORDFILES_DIR env override.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const dest = path.join(mobileRoot, 'assets', 'wordfiles');

function resolveSource() {
  if (process.env.WORDFILES_DIR) {
    return path.resolve(process.env.WORDFILES_DIR);
  }
  const sibling = path.resolve(mobileRoot, '../../../morsebrowser_dev/src/wordfiles');
  if (fs.existsSync(sibling)) return sibling;
  return null;
}

const source = resolveSource();
if (!source) {
  console.warn(
    '[sync-wordfiles] No wordfiles source found.\n'
    + '  Clone morsebrowser_dev next to morsebrowser-react, or set WORDFILES_DIR.',
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
  if (!fs.existsSync(dst) || fs.statSync(src).mtimeMs > fs.statSync(dst).mtimeMs) {
    fs.copyFileSync(src, dst);
    copied++;
  }
}
console.log(`[sync-wordfiles] ${files.length} files at ${dest} (${copied} updated from ${source})`);
