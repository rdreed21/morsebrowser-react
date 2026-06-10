import fs from 'fs';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

function resolveWordfilesDir(): string {
  if (process.env.WORDFILES_DIR) {
    return path.resolve(process.env.WORDFILES_DIR);
  }
  // Default: sibling KO fork checked out next to morsebrowser-react
  return path.resolve(__dirname, '../../../morsebrowser_dev/src/wordfiles');
}

function serveWordfile(wordfilesDir: string, urlPath: string, res: import('http').ServerResponse): boolean {
  // Browsers request "Fam_Words - 4.txt" as "Fam_Words%20-%204.txt" — decode
  // like the Metro middleware does, or every filename with a space 404s.
  // Decode BEFORE basename so encoded separators can't smuggle in "..".
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return false;
  }
  const fileName = path.basename(decoded);
  if (!fileName || fileName === '.' || fileName === '..') return false;

  const filePath = path.resolve(wordfilesDir, fileName);
  if (!filePath.startsWith(wordfilesDir + path.sep)) return false;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;

  const type = fileName.endsWith('.json') ? 'application/json' : 'text/plain; charset=utf-8';
  res.statusCode = 200;
  res.setHeader('Content-Type', type);
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function wordfilesMiddleware(wordfilesDir: string) {
  return (req: { url?: string }, res: import('http').ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/wordfiles/')) return next();
    if (serveWordfile(wordfilesDir, req.url, res)) return;
    res.statusCode = 404;
    res.end(`Word file not found: ${path.basename(req.url)}`);
  };
}

function copyWordfilesToDist(wordfilesDir: string, outDir: string, warn: (msg: string) => void): void {
  if (!fs.existsSync(wordfilesDir)) {
    warn(`[wordfiles] Build copy skipped — not found: ${wordfilesDir}`);
    return;
  }
  const dest = path.join(outDir, 'wordfiles');
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(wordfilesDir, dest, { recursive: true });
}

/** Dev server + production copy for KO lesson .txt/.json files. */
export function wordfilesDevPlugin(): Plugin {
  const wordfilesDir = resolveWordfilesDir();
  let outDir = '';

  return {
    name: 'morsebrowser-wordfiles',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (outDir) copyWordfilesToDist(wordfilesDir, outDir, msg => console.warn(msg));
    },
    configureServer(server: ViteDevServer) {
      if (!fs.existsSync(wordfilesDir)) {
        server.config.logger.warn(
          `[wordfiles] Directory not found: ${wordfilesDir}\n`
          + '  Set WORDFILES_DIR or clone morsebrowser_dev next to morsebrowser-react.',
        );
        return;
      }
      server.config.logger.info(`[wordfiles] Serving from ${wordfilesDir}`);
      server.middlewares.use(wordfilesMiddleware(wordfilesDir));
    },
  };
}
