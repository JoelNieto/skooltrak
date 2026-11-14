/**
 * Codemod: DaisyUI tables → the `uiTable` primitive from `#/ui`.
 *
 *   bun tools/codemods/ui-table.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-table.ts --dry <file.ts> [...more]  # report only
 *
 * For each `<table class="table …">`:
 *   table-sm / table-xs → density="compact" · table-zebra → zebra · table-pin-rows → stickyHeader;
 *   other classes (w-full, table-fixed…) stay.
 * Rows: the DaisyUI 4 `hover` class (a no-op in DaisyUI 5) is removed. A row that navigates
 *   ([routerLink] or (click) on the <tr>) loses its `hover:bg-*` class and the table gets `rowHover`;
 *   other rows keep their classes.
 * Wrapper: a <div> directly around the table that draws a panel (bg-base-100, border, rounded-*,
 *   shadow) becomes `uiCard` (no uiCardBody, so the table runs edge to edge); those panel classes
 *   are dropped and layout classes (overflow-x-auto, mt-4, max-h-96…) stay.
 * Reports tables with dynamic class bindings or unmapped table classes (table-md/lg/xl, pin-cols).
 * Then registers UiTable / Card in the imports of every @Component that uses them.
 */
import { readFileSync, writeFileSync } from 'fs';

type Primitive = 'UiTable' | 'Card';
const MODULE: Record<Primitive, string> = { UiTable: './table', Card: './card' };
const MARKERS: Record<Primitive, RegExp> = { UiTable: /\suiTable\b/, Card: /\suiCard[\s=>/]/ };

interface Report {
  tables: number;
  wrappers: number;
  skipped: { line: number; reason: string; snippet: string }[];
  used: Set<Primitive>;
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

/** Replaces a tag's static class list (dropping the attribute when empty) and prepends attributes. */
function retag(tag: string, tagName: string, keep: string[], attrs: string[]): string {
  const cls = /(\s+)class="[^"]*"/.exec(tag)!;
  let out = tag.replace(cls[0], keep.length ? `${cls[1]}class="${keep.join(' ')}"` : '');
  if (attrs.length) out = out.replace(new RegExp(`^<${tagName}`), `<${tagName} ${attrs.join(' ')}`);
  return out;
}

const PANEL = /^(bg-base-100|border|border-base-(200|300)|border-line|rounded(-(md|lg|xl|2xl|box))?|shadow(-\w+)?)$/;
const TABLE_MAP: Record<string, string> = {
  'table-sm': 'density="compact"',
  'table-xs': 'density="compact"',
  'table-zebra': 'zebra',
  'table-pin-rows': 'stickyHeader',
};

type Edit = { start: number; end: number; text: string };

function convert(src: string, report: Report): string {
  const edits: Edit[] = [];
  const re = /<table(?=[\s>])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    const openEnd = startTagEnd(src, start);
    const close = src.indexOf('</table>', openEnd);
    if (openEnd < 0 || close < 0) break;
    re.lastIndex = close;
    const tag = src.slice(start, openEnd + 1);
    const line = src.slice(0, start).split('\n').length;
    const skip = (reason: string) =>
      report.skipped.push({ line, reason, snippet: tag.replace(/\s+/g, ' ').slice(0, 120) });
    if (/\suiTable\b/.test(tag)) continue;
    const cls = /\sclass="([^"]*)"/.exec(tag);
    const tokens = cls ? cls[1].trim().split(/\s+/) : [];
    if (!tokens.includes('table')) continue;
    if (/\[ngClass\]|\[class\]=|\[class\.table/.test(tag) || cls![1].includes('{{')) {
      skip('dynamic class binding');
      continue;
    }
    const unmapped = tokens.find(
      (t) => t.startsWith('table-') && !(t in TABLE_MAP) && t !== 'table-fixed' && t !== 'table-auto',
    );
    if (unmapped) {
      skip(`unmapped ${unmapped}`);
      continue;
    }

    // rows
    let rowHover = false;
    const body = src.slice(openEnd + 1, close);
    const rowRe = /<tr(?=[\s>])/g;
    let r: RegExpExecArray | null;
    while ((r = rowRe.exec(body))) {
      const rStart = openEnd + 1 + r.index;
      const rEnd = startTagEnd(src, rStart);
      const rTag = src.slice(rStart, rEnd + 1);
      const rCls = /\sclass="([^"]*)"/.exec(rTag);
      if (!rCls) continue;
      const rTokens = rCls[1].trim().split(/\s+/);
      const navigates = /\s(\[routerLink\]|routerLink|\(click\))=/.test(rTag);
      const keep = rTokens.filter((t) => t !== 'hover' && !(navigates && /^hover:bg-/.test(t)));
      if (navigates && rTokens.some((t) => /^hover:bg-/.test(t))) rowHover = true;
      if (keep.length !== rTokens.length)
        edits.push({ start: rStart, end: rEnd + 1, text: retag(rTag, 'tr', keep, []) });
    }

    const attrs = ['uiTable', ...new Set(tokens.filter((t) => t in TABLE_MAP).map((t) => TABLE_MAP[t]))];
    if (rowHover) attrs.push('rowHover');
    const keep = tokens.filter((t) => t !== 'table' && !(t in TABLE_MAP));
    edits.push({ start, end: openEnd + 1, text: retag(tag, 'table', keep, attrs) });
    report.tables++;
    report.used.add('UiTable');

    // panel wrapper directly around the table
    const before = src.slice(0, start);
    const wrap = /<div(\s[^>]*)?\sclass="([^"]*)"([^>]*)>\s*$/.exec(before);
    if (wrap && !/\[ngClass\]|\[class\]=/.test(wrap[0])) {
      const wTokens = wrap[2].trim().split(/\s+/);
      if (wTokens.some((t) => t === 'bg-base-100' || t === 'border' || /^rounded/.test(t))) {
        const wStart = wrap.index;
        const wTag = wrap[0].replace(/\s*$/, '');
        const wKeep = wTokens.filter((t) => !PANEL.test(t));
        edits.push({ start: wStart, end: wStart + wTag.length, text: retag(wTag, 'div', wKeep, ['uiCard']) });
        report.wrappers++;
        report.used.add('Card');
      }
    }
  }
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}

function addImports(src: string, file: string, names: Primitive[]): string {
  const inUiLib = file.includes('libs/ui/src/');
  const groups = new Map<string, Primitive[]>();
  for (const n of names) {
    const from = inUiLib ? MODULE[n] : '#/ui';
    if (new RegExp(`import \\{[^}]*\\b${n}\\b[^}]*\\} from '${from}'`).test(src)) continue;
    groups.set(from, [...(groups.get(from) ?? []), n]);
  }
  for (const [from, missing] of groups) {
    const existing = new RegExp(`import \\{([^}]*)\\} from '${from.replace(/[./]/g, '\\$&')}';`).exec(src);
    if (existing) {
      const all = [
        ...existing[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        ...missing,
      ];
      all.sort((a, b) => a.localeCompare(b));
      src = src.replace(existing[0], `import { ${all.join(', ')} } from '${from}';`);
    } else {
      const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
      const pos = imports.length ? imports[imports.length - 1].index! + imports[imports.length - 1][0].length : 0;
      src = src.slice(0, pos) + `import { ${[...missing].sort().join(', ')} } from '${from}';\n` + src.slice(pos);
    }
  }
  return src.replace(/@Component\(\{([\s\S]*?)\n\}\)/g, (block, body: string) => {
    const needed = names.filter((n) => MARKERS[n].test(body));
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(body);
    if (arr) {
      const missing = needed.filter((n) => !new RegExp(`\\b${n}\\b`).test(arr[1]));
      if (!missing.length) return block;
      const current = arr[1].trim().replace(/,\s*$/, '');
      return block.replace(arr[0], `imports: [${[...missing, current].filter(Boolean).join(', ')}]`);
    }
    if (!needed.length) return block;
    const sel = /(\n(\s*)selector:[^\n]*)/.exec(body);
    return sel ? block.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [${needed.join(', ')}],`) : block;
  });
}

function unregistered(src: string): string[] {
  const missing: string[] = [];
  for (const m of src.matchAll(/@Component\(\{([\s\S]*?)\n\}\)/g)) {
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(m[1])?.[1] ?? '';
    for (const name of Object.keys(MARKERS) as Primitive[])
      if (MARKERS[name].test(m[1]) && !new RegExp(`\\b${name}\\b`).test(arr)) missing.push(name);
  }
  return missing;
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
const totals = { tables: 0, wrappers: 0, skipped: 0 };
const notRegistered: string[] = [];
for (const file of files) {
  if (/components\/table(\.spec)?\.ts$|\.stories\.ts$/.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  const report: Report = { tables: 0, wrappers: 0, skipped: [], used: new Set() };
  let out = convert(src, report);
  if (report.used.size) out = addImports(out, file, [...report.used].sort() as Primitive[]);
  const missing = unregistered(out);
  if (missing.length) notRegistered.push(`${file}: ${missing.join(', ')}`);
  if (!dry && out !== src) writeFileSync(file, out);
  totals.tables += report.tables;
  totals.wrappers += report.wrappers;
  totals.skipped += report.skipped.length;
  if (report.tables + report.skipped.length === 0) continue;
  console.log(
    `${file}: ${report.tables} tables, ${report.wrappers} panel wrappers → uiCard; ${report.skipped.length} left for review`,
  );
  for (const s of report.skipped) console.log(`  L${s.line} ${s.reason}: ${s.snippet}`);
}
console.log(
  `\ntotal: ${totals.tables} tables, ${totals.wrappers} panel wrappers converted; ${totals.skipped} left for review${dry ? ' (dry run)' : ''}`,
);
if (notRegistered.length) {
  console.error(`\nPrimitives used but not in @Component imports (they would render unstyled):`);
  for (const f of notRegistered) console.error(`  ${f}`);
  process.exitCode = 1;
}
