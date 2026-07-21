const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

// Some dependencies (notably the entire better-auth ecosystem, plus a few
// others like @angular/core and date-fns) ship as ESM-only packages, or ship a
// CommonJS shell that internally `require()`s ESM-only files. Node's CommonJS
// runtime cannot `require()` ESM (ERR_REQUIRE_ESM), so these must be bundled by
// webpack (which transpiles ESM -> CJS) rather than left as external requires.
//
// Strategy:
//   1. Force-bundle the whole better-auth dependency subtree so webpack can
//      rewrite every nested import (better-call -> rou3, etc.). Chasing these
//      one by one is unmaintainable, so we bundle the closure as a unit.
//   2. For everything else, decide per-request: externalize a package only when
//      it can be safely required from CommonJS; bundle ESM-only packages.
//   3. Always keep native addons / the Prisma engine external.

const root = join(__dirname, '../..');
const modulesDir = join(root, 'node_modules');

// Roots of the ESM/CJS-interop-problematic subtree to bundle wholesale.
const bundleSubtreeRoots = ['better-auth', '@thallesp/nestjs-better-auth'];

// Compute the transitive dependency closure of the subtree roots so that every
// package they pull in is bundled together.
function computeSubtreeClosure(roots) {
  const closure = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.shift();
    if (closure.has(name)) continue;
    let pkg;
    try {
      pkg = require(join(modulesDir, name, 'package.json'));
    } catch {
      continue;
    }
    closure.add(name);
    for (const dep of Object.keys(pkg.dependencies || {})) {
      if (!closure.has(dep)) queue.push(dep);
    }
  }
  return closure;
}

const forceBundleSet = computeSubtreeClosure(bundleSubtreeRoots);

// Additional standalone ESM-only packages that are not part of the subtree.
const forceBundleExtra = [/^@angular\/core(\/.*)?$/, /^date-fns(\/.*)?$/];

// Packages that MUST stay external: native addons and the Prisma query engine /
// wasm runtime, which cannot be bundled reliably.
const forceExternal = [
  /^bcrypt$/,
  /^@prisma\/adapter-pg$/,
  /^@prisma\/client\/runtime\//,
];

function packageNameOf(request) {
  const parts = request.split('/');
  return request.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
}

const cjsResolvableCache = new Map();
function isCjsResolvable(request) {
  if (cjsResolvableCache.has(request)) return cjsResolvableCache.get(request);
  let resolvable = false;
  try {
    const resolved = require.resolve(request, { paths: [modulesDir] });
    resolvable = !resolved.endsWith('.mjs');
  } catch {
    resolvable = false;
  }
  cjsResolvableCache.set(request, resolvable);
  return resolvable;
}

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/dashboard-backend'),
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: [
    function ({ request }, callback) {
      // Relative / absolute imports and workspace path aliases are bundled.
      if (!request || /^[./]/.test(request) || request.startsWith('@/')) {
        return callback();
      }
      // Only consider bare package specifiers (node_modules).
      if (!/^(@[^/]+\/[^/]+|[^./][^/]*)/.test(request)) {
        return callback();
      }

      if (forceExternal.some((re) => re.test(request))) {
        return callback(null, `commonjs ${request}`);
      }

      // Bundle the better-auth subtree and other known ESM-only packages.
      if (
        forceBundleSet.has(packageNameOf(request)) ||
        forceBundleExtra.some((re) => re.test(request))
      ) {
        return callback();
      }

      // Externalize CJS-resolvable packages; bundle ESM-only ones.
      if (isCjsResolvable(request)) {
        return callback(null, `commonjs ${request}`);
      }
      return callback();
    },
  ],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
      // Let the custom `externals` above (merged in) fully control what is
      // externalized vs bundled. 'none' stops Nx from adding its own
      // node_modules externals that would re-externalize the ESM-only packages.
      externalDependencies: 'none',
      mergeExternals: true,
    }),
  ],
};
