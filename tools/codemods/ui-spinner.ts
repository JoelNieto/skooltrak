/**
 * Codemod: DaisyUI loading spinners → `uiButton [loading]` (inside buttons) or `uiSpinner`.
 *
 *   bun tools/codemods/ui-spinner.ts <file.ts> [...more]        # rewrite files in place
 *   bun tools/codemods/ui-spinner.ts --dry <file.ts> [...more]  # report only
 *
 * 1. A spinner that opens an `@if` directly inside a `uiButton` moves to the button's `[loading]`:
 *      <button uiButton [disabled]="saving()">
 *        @if (saving()) { <span class="loading loading-spinner loading-sm"></span> Guardando… } @else { Guardar }
 *      </button>
 *    → <button uiButton [loading]="saving()" [disabled]="saving()">
 *        @if (saving()) { Guardando… } @else { Guardar }
 *      </button>
 *    When the spinner was all the branch held, `@if (c) { spinner } @else { icon }` becomes
 *    `@if (!c) { icon }` (the button shows its own spinner) and a lone `@if (c) { spinner }` goes away.
 *    A branch that keeps a label only loses the spinner (`@else if` chains stay as they are).
 * 2. Every other `<span|div class="loading loading-spinner …">` → `uiSpinner` with size xs/sm/lg
 *    (md is the default); other classes stay (e.g. text-primary).
 * Reports spinners in buttons it can't move (not a uiButton, already [loading], other shapes). Then
 * registers Spinner in the imports of every @Component that uses `uiSpinner`.
 */
import { readFileSync, writeFileSync } from 'fs';

const SPINNER = /<(span|div)\s+class="loading loading-spinner([^"]*)"\s*(?:\/>|>\s*<\/\1>)/;

interface Report {
  moved: number;
  spinners: number;
  skipped: { line: number; reason: string; snippet: string }[];
}

/** Index of the `}` closing the block whose `{` is at `open`, treating `{{ … }}` as text. */
function blockClose(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src.startsWith('{{', i)) {
      const end = src.indexOf('}}', i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

/** `@if (` … `)` → [condition, index after ')'] with balanced parentheses. */
function ifCondition(src: string, at: number): [string, number] | null {
  const m = /^@if\s*\(/.exec(src.slice(at));
  if (!m) return null;
  let depth = 1;
  let i = at + m[0].length;
  const start = i;
  for (; i < src.length && depth; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') depth--;
  }
  return depth ? null : [src.slice(start, i - 1).trim(), i];
}

const negate = (c: string) => (/^[\w.]+\(\)$/.test(c) ? `!${c}` : `!(${c})`);

/** Rewrites one button's content; null when the shape isn't the supported one. */
function moveToLoading(content: string): { content: string; condition: string } | null {
  const lead = /^\s*/.exec(content)![0].length;
  const cond = ifCondition(content, lead);
  if (!cond) return null;
  const [condition, afterCond] = cond;
  const open = content.indexOf('{', afterCond);
  if (content.slice(afterCond, open).trim()) return null;
  const close = blockClose(content, open);
  if (close < 0) return null;
  const body = content.slice(open + 1, close);
  const spinner = SPINNER.exec(body);
  if (!spinner || body.slice(0, spinner.index).trim()) return null; // spinner must open the branch
  const rest = body.slice(spinner.index + spinner[0].length).trim();
  // The branch keeps a label: drop the spinner, leave the rest (including any @else if chain) as is.
  if (rest) {
    const spinnerAt = open + 1 + spinner.index;
    const after = content.slice(spinnerAt + spinner[0].length).replace(/^[ \t]*\n?/, '');
    return { content: content.slice(0, spinnerAt).replace(/[ \t]*$/, '') + after, condition };
  }

  let tail = content.slice(close + 1);
  let elseBody: string | null = null;
  const elseMatch = /^\s*@else\s*\{/.exec(tail);
  if (elseMatch) {
    const elseOpen = close + 1 + elseMatch[0].length - 1;
    const elseClose = blockClose(content, elseOpen);
    if (elseClose < 0) return null;
    elseBody = content.slice(elseOpen + 1, elseClose);
    tail = content.slice(elseClose + 1);
  }
  if (/^\s*@else/.test(tail)) return null;

  const block = elseBody !== null ? `@if (${negate(condition)}) {${elseBody}}` : '';
  return { content: content.slice(0, lead) + block + tail, condition };
}

function convert(src: string, report: Report): string {
  // 1. spinners inside buttons
  let out = '';
  let i = 0;
  const btnRe = /<button(?=[\s>])/g;
  let m: RegExpExecArray | null;
  while ((m = btnRe.exec(src))) {
    const start = m.index;
    const close = src.indexOf('</button>', start);
    let openEnd = start;
    for (let q: string | null = null; openEnd < src.length; openEnd++) {
      const ch = src[openEnd];
      if (q) {
        if (ch === q) q = null;
      } else if (ch === '"' || ch === "'") q = ch;
      else if (ch === '>') break;
    }
    if (close < 0) break;
    btnRe.lastIndex = close;
    const content = src.slice(openEnd + 1, close);
    if (!SPINNER.test(content)) continue;
    const tag = src.slice(start, openEnd + 1);
    const line = src.slice(0, start).split('\n').length;
    const skip = (reason: string) =>
      report.skipped.push({ line, reason, snippet: (tag + content).replace(/\s+/g, ' ').slice(0, 150) });
    if (!/\suiButton\b/.test(tag)) {
      skip('spinner in a button that is not uiButton');
      continue;
    }
    if (/\[loading\]/.test(tag)) {
      skip('button already has [loading]');
      continue;
    }
    const moved = moveToLoading(content);
    if (!moved) {
      skip('unsupported shape');
      continue;
    }
    const newTag = tag.replace(/\suiButton\b/, `$& [loading]="${moved.condition.replace(/"/g, "'")}"`);
    out += src.slice(i, start) + newTag + moved.content;
    i = close;
    report.moved++;
  }
  src = out + src.slice(i);

  // 2. remaining spinners
  return src.replace(new RegExp(SPINNER.source, 'g'), (_all, tagName: string, rest: string) => {
    const tokens = rest.trim().split(/\s+/).filter(Boolean);
    const size = tokens.find((t) => /^loading-(xs|sm|md|lg|xl)$/.test(t))?.slice(8);
    const keep = tokens.filter((t) => !/^loading-(xs|sm|md|lg|xl)$/.test(t));
    const attrs = ['uiSpinner'];
    if (size && size !== 'md') attrs.push(`size="${size === 'xl' ? 'lg' : size}"`);
    if (keep.length) attrs.push(`class="${keep.join(' ')}"`);
    report.spinners++;
    return `<${tagName} ${attrs.join(' ')}></${tagName}>`;
  });
}

function registerSpinner(src: string, file: string): string {
  const from = file.includes('libs/ui/src/') ? './spinner' : '#/ui';
  if (!new RegExp(`import \\{[^}]*\\bSpinner\\b[^}]*\\} from '${from}'`).test(src)) {
    const existing = new RegExp(`import \\{([^}]*)\\} from '${from.replace(/[./]/g, '\\$&')}';`).exec(src);
    if (existing) {
      const all = [
        ...existing[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        'Spinner',
      ].sort((a, b) => a.localeCompare(b));
      src = src.replace(existing[0], `import { ${all.join(', ')} } from '${from}';`);
    } else {
      const imports = [...src.matchAll(/^import [^;]+;\n/gm)];
      const pos = imports.length ? imports[imports.length - 1].index! + imports[imports.length - 1][0].length : 0;
      src = src.slice(0, pos) + `import { Spinner } from '${from}';\n` + src.slice(pos);
    }
  }
  return src.replace(/@Component\(\{([\s\S]*?)\n\}\)/g, (block, body: string) => {
    if (!/\suiSpinner\b/.test(body)) return block;
    const arr = /imports:\s*\[([\s\S]*?)\]/.exec(body);
    if (arr) {
      if (/\bSpinner\b/.test(arr[1])) return block;
      return block.replace(arr[0], `imports: [Spinner, ${arr[1].trim().replace(/,\s*$/, '')}]`);
    }
    const sel = /(\n(\s*)selector:[^\n]*)/.exec(body);
    return sel ? block.replace(sel[1], `${sel[1]}\n${sel[2]}imports: [Spinner],`) : block;
  });
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => a !== '--dry');
const totals = { moved: 0, spinners: 0, skipped: 0 };
for (const file of files) {
  if (/components\/spinner(\.spec)?\.ts$|\.stories\.ts$/.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  const report: Report = { moved: 0, spinners: 0, skipped: [] };
  let out = convert(src, report);
  if (report.spinners) out = registerSpinner(out, file);
  if (!dry && out !== src) writeFileSync(file, out);
  totals.moved += report.moved;
  totals.spinners += report.spinners;
  totals.skipped += report.skipped.length;
  if (report.moved + report.spinners + report.skipped.length === 0) continue;
  console.log(
    `${file}: ${report.moved} → [loading], ${report.spinners} → uiSpinner; ${report.skipped.length} reported`,
  );
  for (const s of report.skipped) console.log(`  L${s.line} ${s.reason}: ${s.snippet}`);
}
console.log(
  `\ntotal: ${totals.moved} moved to uiButton [loading], ${totals.spinners} → uiSpinner; ${totals.skipped} reported${dry ? ' (dry run)' : ''}`,
);
