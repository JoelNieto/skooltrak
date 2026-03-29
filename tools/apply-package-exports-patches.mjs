/**
 * Some dependencies ship without a proper "exports" map. Vite SSR can pick the wrong entry
 * (e.g. CJS `main` instead of ESM `module`) and break named ESM imports.
 *
 * Some packages define "exports" but point Node ESM at a file that re-imports UMD (`tslib`),
 * which breaks under Vite's SSR module runner (no default export on `../tslib.js`).
 * Idempotent: safe to run on every install.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const patches = [
  {
    relPath: 'node_modules/linkifyjs/package.json',
    exports: {
      '.': {
        import: './dist/linkify.mjs',
        require: './dist/linkify.cjs',
        default: './dist/linkify.mjs',
      },
    },
  },
  {
    relPath: 'node_modules/@wry/equality/package.json',
    exports: {
      '.': {
        import: './lib/index.js',
        require: './lib/bundle.cjs',
        default: './lib/index.js',
      },
    },
  },
  {
    relPath: 'node_modules/@wry/trie/package.json',
    exports: {
      '.': {
        import: './lib/index.js',
        require: './lib/bundle.cjs',
        default: './lib/index.js',
      },
    },
  },
  {
    relPath: 'node_modules/graphql-tag/package.json',
    exports: {
      '.': {
        import: './lib/index.js',
        require: './main.js',
        default: './lib/index.js',
      },
    },
  },
];

for (const { relPath, exports: exportMap } of patches) {
  const pkgPath = join(root, relPath);
  try {
    const raw = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    if (pkg.exports) {
      continue;
    }
    pkg.exports = exportMap;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`[patch-package-exports] Added "exports" to ${relPath}`);
  } catch (e) {
    console.warn(`[patch-package-exports] Skipped ${relPath}:`, e?.message ?? e);
  }
}

/** Mutate existing exports (package already has "exports" but wrong Node ESM target). */
const exportOverrides = [
  {
    relPath: 'node_modules/tslib/package.json',
    apply(pkg) {
      const dot = pkg.exports?.['.'];
      const imp = dot?.import;
      if (imp && typeof imp === 'object' && imp.node === './modules/index.js') {
        imp.node = './tslib.es6.mjs';
        return true;
      }
      return false;
    },
  },
];

for (const { relPath, apply } of exportOverrides) {
  const pkgPath = join(root, relPath);
  try {
    const raw = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    if (apply(pkg)) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
      console.log(`[patch-package-exports] Overrode exports in ${relPath}`);
    }
  } catch (e) {
    console.warn(`[patch-package-exports] Skipped override ${relPath}:`, e?.message ?? e);
  }
}
