/*
  Preload script to force xmcp to resolve Zod v3 at runtime.
  It intercepts require() resolution for requests to 'zod' that originate from the xmcp package
  and resolves them relative to xmcp's package directory, where we've ensured a v3 is installed
  via pnpm packageExtensions/overrides.
*/

const Module = require('module');
const path = require('path');
const fs = require('fs');

const originalResolveFilename = Module._resolveFilename;

function isFromXmcp(parent) {
  if (!parent || !parent.filename) return false;
  const f = parent.filename.replace(/\\/g, '/');
  // Match pnpm and normal node_modules layouts
  return f.includes('/node_modules/xmcp/') || f.includes('/node_modules/.pnpm/xmcp@');
}

// Locate a Zod v3 installation inside pnpm store
function findZodV3NodeModules(baseDir) {
  try {
    const storeDir = path.join(baseDir, 'node_modules', '.pnpm');
    const entries = fs.readdirSync(storeDir, { withFileTypes: true });
    const z3Dirs = entries
      .filter((e) => e.isDirectory() && /^zod@3\./.test(e.name))
      // sort descending to prefer latest 3.x if multiple exist
      .sort((a, b) => (a.name < b.name ? 1 : -1));
    if (z3Dirs.length === 0) return null;
    const chosen = z3Dirs[0].name; // e.g., zod@3.24.4
    const z3NodeModules = path.join(storeDir, chosen, 'node_modules');
    const z3Pkg = path.join(z3NodeModules, 'zod', 'package.json');
    if (fs.existsSync(z3Pkg)) return z3NodeModules;
  } catch {}
  return null;
}

const projectRoot = process.cwd();
const zodV3NodeModules = findZodV3NodeModules(projectRoot);

Module._resolveFilename = function (request, parent, isMain, options) {
  // Only intercept zod when required from xmcp code
  if ((request === 'zod' || request.startsWith('zod/')) && isFromXmcp(parent) && zodV3NodeModules) {
    try {
      // Resolve the request using a search path that contains zod v3
      const resolved = require.resolve(request, { paths: [zodV3NodeModules] });
      // Debug output to confirm hook behavior
      try {
        console.error(`[force-zod3] Intercepted '${request}' from xmcp parent '${parent && parent.filename}', resolved to '${resolved}'`);
      } catch {}
      return resolved;
    } catch (e) {
      // Fall through to default resolution if we couldn't resolve v3 here
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
