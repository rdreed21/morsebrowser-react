#!/usr/bin/env node
/**
 * Generate manifests listing every file under assets/wordfiles and
 * assets/presets, plus a content hash of both directories.
 *
 * Android can't enumerate `asset://` directories at runtime (AssetManager
 * has no "list" support via expo-file-system), so
 * ensureWordfilesCached()/ensurePresetsCached() require() these manifests
 * to know what to copy out of the APK's assets into documentDirectory.
 *
 * The hash lets cacheStamp() detect updated wordfiles/presets even when
 * expoConfig.version hasn't changed (e.g. dev/preview builds pinned at
 * "1.0.0"), so a refreshed sync gets re-copied instead of being masked by
 * a stale `.ready` marker.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
    return [];
  }
  const files = listFilesRecursive(dir).sort();
  fs.writeFileSync(dest, `${JSON.stringify(files, null, 2)}\n`);
  console.log(`[generate-asset-manifests] ${name}-manifest.json: ${files.length} files`);
  return files;
}

function hashFiles(dir, files) {
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update(fs.readFileSync(path.join(dir, file)));
  }
  return hash;
}

const wordfilesDir = path.join(assetsRoot, 'wordfiles');
const presetsDir = path.join(assetsRoot, 'presets');
const wordfiles = writeManifest('wordfiles', wordfilesDir);
const presets = writeManifest('presets', presetsDir);

const combinedHash = crypto.createHash('sha256');
combinedHash.update(hashFiles(wordfilesDir, wordfiles).digest());
combinedHash.update(hashFiles(presetsDir, presets).digest());
const hash = combinedHash.digest('hex').slice(0, 16);

fs.writeFileSync(path.join(assetsRoot, 'lesson-data-version.json'), `${JSON.stringify({ hash }, null, 2)}\n`);
console.log(`[generate-asset-manifests] lesson-data-version.json: ${hash}`);
