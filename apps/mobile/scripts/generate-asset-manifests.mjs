#!/usr/bin/env node
/**
 * Generate manifests listing every file under assets/wordfiles and
 * assets/presets. Android can't enumerate `asset://` directories at
 * runtime (AssetManager has no "list" support via expo-file-system), so
 * ensureWordfilesCached()/ensurePresetsCached() require() these manifests
 * to know what to copy out of the APK's assets into documentDirectory.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const assetsRoot = path.join(mobileRoot, 'assets');

function listFilesRecursive(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full, base));
    } else {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

function writeManifest(name, dir) {
  const dest = path.join(assetsRoot, `${name}-manifest.json`);
  if (!fs.existsSync(dir)) {
    fs.writeFileSync(dest, '[]\n');
    console.warn(`[generate-asset-manifests] ${dir} not found, wrote empty ${name}-manifest.json`);
    return;
  }
  const files = listFilesRecursive(dir).sort();
  fs.writeFileSync(dest, `${JSON.stringify(files, null, 2)}\n`);
  console.log(`[generate-asset-manifests] ${name}-manifest.json: ${files.length} files`);
}

writeManifest('wordfiles', path.join(assetsRoot, 'wordfiles'));
writeManifest('presets', path.join(assetsRoot, 'presets'));
