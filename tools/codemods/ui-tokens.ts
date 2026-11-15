/**
 * Codemod: DaisyUI base colours → the semantic token utilities from libs/ui/src/styles/theme.css.
 *
 *   bun tools/codemods/ui-tokens.ts <file.ts|html> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-tokens.ts --dry <file.ts|html> [...more]  # report only
 *
 * Text (DaisyUI's one ink colour at eight opacities → four ink tokens):
 *   text-base-content          → text-ink-strong   (same colour)
 *   text-base-content/80–/90   → text-ink
 *   text-base-content/60–/70   → text-ink-muted
 *   text-base-content/≤50      → text-ink-subtle
 * Surfaces and lines (DaisyUI base-100/200/300 = surface-1/0/2 in theme.css):
 *   bg-base-100 → bg-surface-1 · bg-base-200 → bg-surface-0 · bg-base-300 → bg-surface-2
 *   hover/active:bg-base-200|300 → …:bg-surface-2 (the designed hover fill, as in uiTable rows)
 *   border-/divide-base-200|300 → …-line (the hairline token; base-300 was a near-invisible surface)
 *   ring-offset-base-100 → ring-offset-surface-1
 * Variant prefixes (hover:, group-hover:, md:, …) and opacity suffixes on surfaces are kept.
 * Works on class attributes, [class.x] bindings and class strings in TS alike: these names only
 * ever appear as classes. Idempotent. Anything matching base-* that has no mapping is reported.
 */
import { readFileSync, writeFileSync } from 'fs';

const INK: Record<string, string> = {
  '': 'ink-strong',
  '90': 'ink',
  '80': 'ink',
  '70': 'ink-muted',
  '60': 'ink-muted',
  '50': 'ink-subtle',
  '40': 'ink-subtle',
  '30': 'ink-subtle',
  '20': 'ink-subtle',
};
const SURFACE: Record<string, string> = { '100': 'surface-1', '200': 'surface-0', '300': 'surface-2' };

// A class token: optional variants, a utility prefix, base-{shade}, optional /opacity.
const TOKEN =
  /(?<=^|[\s"'`.:[{(,])((?:[a-z0-9-]+:)*)(text|bg|border(?:-[trblxy])?|divide|ring-offset|ring|outline|from|to|via|fill|stroke)-base-(100|200|300|content)(?:\/(\d+))?(?![\w/-])/g;

function map(variants: string, util: string, shade: string, alpha: string | undefined): string | null {
  const interactive = /(^|:)(hover|active|focus|focus-visible|group-hover|peer-hover):$/.test(variants);
  if (shade === 'content') {
    if (util !== 'text') return null;
    const ink = INK[alpha ?? ''];
    return ink ? `${variants}text-${ink}` : null;
  }
  const suffix = alpha ? `/${alpha}` : '';
  if (util === 'bg') {
    const surface = interactive && shade !== '100' ? 'surface-2' : SURFACE[shade];
    return `${variants}bg-${surface}${suffix}`;
  }
  if (/^border/.test(util) || util === 'divide') {
    if (shade === '100') return null;
    return `${variants}${util}-line${suffix}`;
  }
  if (util === 'ring-offset' && shade === '100') return `${variants}ring-offset-surface-1`;
  return null;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
let total = 0;
const unmapped: string[] = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let count = 0;
  const out = src.replace(TOKEN, (all, variants: string, util: string, shade: string, alpha?: string) => {
    const next = map(variants, util, shade, alpha);
    if (!next) {
      const line = src.slice(0, src.indexOf(all)).split('\n').length;
      unmapped.push(`${file}:${line} ${all}`);
      return all;
    }
    count++;
    return next;
  });
  if (!count) continue;
  total += count;
  if (!dry) writeFileSync(file, out);
  console.log(`${file}: ${count}`);
}
if (unmapped.length) console.log(`\nunmapped (left as is):\n  ${unmapped.join('\n  ')}`);
console.log(`\ntotal: ${total} classes${dry ? ' (dry run)' : ''}`);
