/**
 * Codemod: raw DaisyUI buttons → the `uiButton` primitive from `#/ui`.
 *
 *   bun tools/codemods/ui-button.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-button.ts --dry <file.ts> [...more]  # report only
 *
 * Converts `<button>` / `<a>` elements whose static `class` holds `btn`:
 *   btn-primary, btn-neutral → variant="primary"
 *   btn-soft, btn-outline, btn-secondary, plain btn → secondary (default, attribute omitted)
 *   btn-ghost → variant="ghost"        btn-error → variant="danger"
 *   btn-xs, btn-sm → size="sm"         btn-lg, btn-xl → size="lg"
 *   btn-square, btn-circle → iconOnly  btn-block → w-full
 * Leaves an element untouched (and reports it) when it has dynamic btn classes ([class.btn-*],
 * [ngClass], [class]), interpolated classes, or btn classes without a clear mapping
 * (success, warning, info, link, accent, dash, wide, active, disabled). Then adds `Button` to the
 * component's TypeScript imports and to `@Component({ imports: [...] })`.
 */
import { readFileSync, writeFileSync } from 'fs';

const SKIP_TOKENS = new Set([
  'btn-success', 'btn-warning', 'btn-info', 'btn-link', 'btn-accent', 'btn-dash',
  'btn-wide', 'btn-active', 'btn-disabled',
]);

interface Result {
  converted: number;
  skipped: { line: number; reason: string; snippet: string }[];
}

/** Finds the end of a start tag, skipping '>' inside quoted attribute values (e.g. arrow functions). */
function startTagEnd(src: string, from: number): number {
  let quote: string | null = null;
  for (let i = from; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return i;
    }
  }
  return -1;
}

function mapTokens(tokens: string[]): { attrs: string[]; rest: string[] } | { skip: string } {
  const btn = tokens.filter((t) => t === 'btn' || t.startsWith('btn-'));
  const rest = tokens.filter((t) => !(t === 'btn' || t.startsWith('btn-')));
  const unknown = btn.find((t) => SKIP_TOKENS.has(t));
  if (unknown) return { skip: `unmapped ${unknown}` };

  const has = (t: string) => btn.includes(t);
  let variant: string | null = null;
  if (has('btn-error')) variant = 'danger';
  else if (has('btn-ghost')) variant = 'ghost';
  else if (has('btn-soft') || has('btn-outline') || has('btn-secondary')) variant = null;
  else if (has('btn-primary') || has('btn-neutral')) variant = 'primary';

  let size: string | null = null;
  if (has('btn-xs') || has('btn-sm')) size = 'sm';
  else if (has('btn-lg') || has('btn-xl')) size = 'lg';

  const attrs = ['uiButton'];
  if (variant) attrs.push(`variant="${variant}"`);
  if (size) attrs.push(`size="${size}"`);
  if (has('btn-square') || has('btn-circle')) attrs.push('iconOnly');
  if (has('btn-block') && !rest.includes('w-full')) rest.push('w-full');

  const known = new Set([
    'btn', 'btn-primary', 'btn-neutral', 'btn-secondary', 'btn-soft', 'btn-outline', 'btn-ghost', 'btn-error',
    'btn-xs', 'btn-sm', 'btn-md', 'btn-lg', 'btn-xl', 'btn-square', 'btn-circle', 'btn-block',
  ]);
  const leftover = btn.find((t) => !known.has(t));
  if (leftover) return { skip: `unmapped ${leftover}` };
  return { attrs, rest };
}

function convertTemplate(src: string): { out: string; result: Result } {
  const result: Result = { converted: 0, skipped: [] };
  let out = '';
  let i = 0;
  const tagRe = /<(button|a)(?=[\s>])/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(src))) {
    const start = m.index;
    const end = startTagEnd(src, start);
    if (end < 0) break;
    const tag = src.slice(start, end + 1);
    tagRe.lastIndex = end + 1;

    const classMatch = /(\s)class="([^"]*)"/.exec(tag);
    if (!classMatch || !/(^|\s)btn(\s|$|-)/.test(classMatch[2])) continue;
    if (/\buiButton\b/.test(tag)) continue;

    const line = src.slice(0, start).split('\n').length;
    const snippet = tag.replace(/\s+/g, ' ').slice(0, 120);
    if (/\[class\.btn-|\[ngClass\]|\[class\]=/.test(tag) || classMatch[2].includes('{{')) {
      result.skipped.push({ line, reason: 'dynamic class binding', snippet });
      continue;
    }

    const mapped = mapTokens(classMatch[2].trim().split(/\s+/));
    if ('skip' in mapped) {
      result.skipped.push({ line, reason: mapped.skip, snippet });
      continue;
    }

    const newClass = mapped.rest.length ? `${classMatch[1]}class="${mapped.rest.join(' ')}"` : '';
    let newTag = tag.replace(classMatch[0], newClass);
    newTag = newTag.replace(new RegExp(`^<${m[1]}`), `<${m[1]} ${mapped.attrs.join(' ')}`);
    out += src.slice(i, start) + newTag;
    i = end + 1;
    result.converted++;
  }
  out += src.slice(i);
  return { out, result };
}

function addImport(src: string, file: string): string {
  const inUiLib = file.includes('libs/ui/src/');
  // 1. TypeScript import
  if (!/\bButton\b[^;]*from '(#\/ui|\.\/button)'/.test(src)) {
    const uiImport = /import \{([^}]*)\} from '#\/ui';/.exec(src);
    if (uiImport && !inUiLib) {
      const names = uiImport[1].split(',').map((s) => s.trim()).filter(Boolean);
      names.push('Button');
      names.sort((a, b) => a.localeCompare(b));
      src = src.replace(uiImport[0], `import { ${names.join(', ')} } from '#/ui';`);
    } else {
      const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
      const pos = imports.length ? imports[imports.length - 1].index! + imports[imports.length - 1][0].length : 0;
      const line = inUiLib ? `import { Button } from './button';\n` : `import { Button } from '#/ui';\n`;
      src = src.slice(0, pos) + line + src.slice(pos);
    }
  }
  // 2. @Component imports array
  const comp = /@Component\(\{([\s\S]*?)\n\s*(template|templateUrl)\s*:/.exec(src);
  if (comp) {
    const head = comp[1];
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(head);
    if (arr) {
      if (!/\bButton\b/.test(arr[1])) {
        const replaced = head.replace(arr[0], `imports: [Button, ${arr[1].trim()}]`.replace(', ]', ']'));
        src = src.replace(head, replaced);
      }
    } else {
      const sel = /(\n(\s*)selector:[^\n]*\n)/.exec(head);
      if (sel) src = src.replace(head, head.replace(sel[1], `${sel[1]}${sel[2]}imports: [Button],\n`));
    }
  }
  return src;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
let total = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const { out, result } = convertTemplate(src);
  total += result.converted;
  const final = result.converted > 0 ? addImport(out, file) : out;
  if (!dry && final !== src) writeFileSync(file, final);
  console.log(`${file}: ${result.converted} converted, ${result.skipped.length} left for review`);
  for (const s of result.skipped) console.log(`  L${s.line} ${s.reason}: ${s.snippet}`);
}
console.log(`total converted: ${total}${dry ? ' (dry run)' : ''}`);
