---
name: link-workspace-packages
description: 'Link workspace packages in this Bun monorepo. USE WHEN: (1) you just created or generated new packages and need to wire up their dependencies, (2) user imports from a sibling package and needs to add it as a dependency, (3) you get resolution errors for workspace packages (@org/*) like "cannot find module", "failed to resolve import", "TS2307", or "cannot resolve". DO NOT patch around with tsconfig paths or manual package.json edits - use bun add to fix actual linking.'
---

# Link Workspace Packages

Add dependencies between packages in this Bun monorepo.

## Detect Package Manager

This project uses **Bun** exclusively. Confirm via:

- `"packageManager": "bun@…"` in root [`package.json`](../../package.json)
- `bun.lock` in the repo root

## Workflow

1. Identify consumer package (the one importing)
2. Identify provider package(s) (being imported)
3. Add dependency using `bun add` from the consumer directory
4. Verify symlinks created in consumer's `node_modules/`

## Bun

Supports `workspace:` protocol.

```bash
cd packages/app && bun add @org/ui
```

Result in `package.json`:

```json
{ "dependencies": { "@org/ui": "workspace:*" } }
```

From the workspace root, add a dev dependency:

```bash
bun add -d @org/ui
```

## Examples

**Link ui lib to app**

```bash
cd apps/web-dashboard && bun add @skooltrak-platform/ui
```

**Debug "Cannot find module"**

1. Check if dependency is declared in consumer's `package.json`
2. If not, add it using `bun add` from the consumer directory
3. Run `bun install` from the repo root

## Notes

- Symlinks appear in `<consumer>/node_modules/@org/<package>`
- Bun hoists shared deps to root `node_modules`
- Root `package.json` should have `"private": true` to prevent accidental publish
