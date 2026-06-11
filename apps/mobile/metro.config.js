const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const wordfilesDir = path.join(projectRoot, 'assets', 'wordfiles');
const presetsDir = path.resolve(workspaceRoot, 'packages/core/src/presets/data');

const config = getDefaultConfig(projectRoot);

// getDefaultConfig points server.unstable_serverRoot at the monorepo root for
// web monorepo support, but Metro's asset request handler still resolves
// /assets/* relative to projectRoot — the mismatch doubles the path
// (apps/mobile/apps/mobile/assets/...) and 404s every local image. Pin it
// back to projectRoot.
config.server.unstable_serverRoot = projectRoot;

// Watch workspace packages
config.watchFolders = [workspaceRoot];

// Resolve packages from mobile first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

/** Serve LICW wordfiles at /wordfiles/* — same path as web Vite plugin. */
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  if (req.url?.startsWith('/wordfiles/') && fs.existsSync(wordfilesDir)) {
    const fileName = decodeURIComponent(req.url.slice('/wordfiles/'.length).split('?')[0]);
    const filePath = path.join(wordfilesDir, fileName);
    if (filePath.startsWith(wordfilesDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.setHeader('Content-Type', fileName.endsWith('.json') ? 'application/json' : 'text/plain');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  if (req.url?.startsWith('/presets/') && fs.existsSync(presetsDir)) {
    const relative = decodeURIComponent(req.url.slice('/presets/'.length).split('?')[0]);
    const filePath = path.join(presetsDir, relative);
    if (filePath.startsWith(presetsDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.setHeader('Content-Type', 'application/json');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  return middleware(req, res, next);
};

module.exports = config;
