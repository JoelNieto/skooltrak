import './ssr/node-polyfills';

import { initNodeFederation } from '@softarc/native-federation-node';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

console.log('Starting SSR for Shell');

const serverDir = dirname(fileURLToPath(import.meta.url));

/**
 * Native Federation's initNodeFederation passes manifest/remote paths to fs.readFile.
 * Relative paths are resolved from process.cwd() (repo root under `nx serve`), not from
 * this file — so we pass a path relative to process.cwd() for relBundlePath.
 * Do not use process.chdir: Angular route extraction runs in a worker where chdir is forbidden.
 */
function resolveBrowserDir(): string {
  const nextToServer = resolve(serverDir, '../browser');
  if (existsSync(join(nextToServer, 'remoteEntry.json'))) {
    return nextToServer;
  }
  const fromWorkspaceDist = resolve(process.cwd(), 'dist/apps/web-dashboard/browser');
  if (existsSync(join(fromWorkspaceDist, 'remoteEntry.json'))) {
    return fromWorkspaceDist;
  }
  return nextToServer;
}

function loadRemotes(): Record<string, string> {
  const browserDir = resolveBrowserDir();
  const candidates = [
    join(browserDir, 'federation.manifest.json'),
    join(serverDir, '../public/federation.manifest.json'),
    resolve(process.cwd(), 'apps/web-dashboard/public/federation.manifest.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf-8')) as Record<string, string>;
    }
  }
  throw new Error(
    `federation.manifest.json not found. Tried:\n${candidates.join('\n')}`,
  );
}

(async () => {
  const browserDir = resolveBrowserDir();
  if (!existsSync(join(browserDir, 'remoteEntry.json'))) {
    throw new Error(
      `Native Federation host remoteEntry.json missing under:\n${browserDir}\n` +
        'Build the dashboard at least once (e.g. nx run web-dashboard:esbuild:development) so dist/apps/web-dashboard/browser exists.',
    );
  }

  const remotes = loadRemotes();

  let relBundlePath = relative(process.cwd(), browserDir).replace(/\\/g, '/');
  if (!relBundlePath || relBundlePath === '.') {
    relBundlePath = './';
  } else if (!relBundlePath.endsWith('/')) {
    relBundlePath += '/';
  }

  await initNodeFederation({
    remotesOrManifestUrl: remotes,
    relBundlePath,
    throwIfRemoteNotFound: false,
  });

  await import('./bootstrap-server');
})();
