import fs from 'fs';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

function resolvePresetsDir(): string {
  if (process.env.PRESETS_DIR) {
    return path.resolve(process.env.PRESETS_DIR);
  }
  return path.resolve(__dirname, '../../packages/core/src/presets/data');
}

function servePresetFile(presetsDir: string, urlPath: string, res: import('http').ServerResponse): boolean {
  let relative: string;
  try {
    relative = decodeURIComponent(urlPath.split('?')[0].replace(/^\/presets\//, ''));
  } catch {
    return false;
  }
  if (!relative || relative.includes('..')) return false;

  const filePath = path.join(presetsDir, relative);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function presetsMiddleware(presetsDir: string) {
  return (req: { url?: string }, res: import('http').ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/presets/')) return next();
    if (servePresetFile(presetsDir, req.url, res)) return;
    res.statusCode = 404;
    res.end(`Preset file not found: ${req.url}`);
  };
}

function copyPresetsToDist(presetsDir: string, outDir: string, warn: (msg: string) => void): void {
  if (!fs.existsSync(presetsDir)) {
    warn(`[presets] Build copy skipped — not found: ${presetsDir}`);
    return;
  }
  const dest = path.join(outDir, 'presets');
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(presetsDir, dest, { recursive: true });
}

/** Dev server + production copy for KO preset JSON (sets + configs). */
export function presetsDevPlugin(): Plugin {
  const presetsDir = resolvePresetsDir();
  let outDir = '';

  return {
    name: 'morsebrowser-presets',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (outDir) copyPresetsToDist(presetsDir, outDir, msg => console.warn(msg));
    },
    configureServer(server: ViteDevServer) {
      if (!fs.existsSync(presetsDir)) {
        server.config.logger.warn(
          `[presets] Directory not found: ${presetsDir}\n`
          + '  Set PRESETS_DIR to the presets data root.',
        );
        return;
      }
      server.config.logger.info(`[presets] Serving from ${presetsDir}`);
      server.middlewares.use(presetsMiddleware(presetsDir));
    },
  };
}
