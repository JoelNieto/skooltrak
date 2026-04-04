#!/usr/bin/env bun
/**
 * Cursor afterFileEdit hook: run graphql:generate when Prisma schema or
 * prisma/scripts change. Paths may be relative to the workspace or absolute.
 */
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inferredRoot = normalize(join(__dirname, '..', '..'));

function normalizePath(p) {
  return normalize(p).replace(/\\/g, '/');
}

function shouldRun(filePath) {
  const p = normalizePath(filePath);
  if (p.endsWith('/prisma/schema.prisma') || p === 'prisma/schema.prisma') return true;
  if (p.includes('/prisma/scripts/') || p.startsWith('prisma/scripts/')) return true;
  return false;
}

function pickCwd(filePath, workspaceRoots) {
  const roots = workspaceRoots?.length ? workspaceRoots : [inferredRoot];
  const norm = normalizePath(filePath);
  const isAbsolute = norm.startsWith('/') || /^[a-zA-Z]:\//.test(norm);
  if (isAbsolute) {
    for (const r of roots) {
      const rn = normalizePath(r);
      if (norm === rn || norm.startsWith(`${rn}/`)) return r;
    }
  }
  return roots[0];
}

let input;
try {
  input = await Bun.stdin.json();
} catch {
  process.exit(0);
}

const filePath = input?.file_path;
if (!filePath || !shouldRun(filePath)) {
  process.exit(0);
}

const cwd = pickCwd(filePath, input.workspace_roots);
const result = Bun.spawnSync(['bun', 'run', 'graphql:generate'], {
  cwd,
  stdout: 'inherit',
  stderr: 'inherit',
});

process.exit(result.exitCode ?? 1);
